const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const User = require('../models/User');
const { protect, authorizeBusinessOwner } = require('../middleware/authMiddleware');

// Helper function to calculate price with separate logic per service type
function calculateBookingPrice(checkIn, checkOut, pricePerUnit, serviceType, numberOfGuests = 1) {
    let totalPrice = 0;

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    // Calculate difference in days. If check-in and check-out are the same day, this will be 0.
    // We'll adjust for a minimum of 1 day for per-day services.
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (serviceType) {
        case 'hotels':
        case 'rooms':
            // Hotels and Rooms are calculated per night/day. Minimum 1 day.
            totalPrice = (diffDays === 0 ? 1 : diffDays) * pricePerUnit;
            break;
        case 'restaurants':
            // Restaurants are calculated per person.
            totalPrice = pricePerUnit * numberOfGuests;
            break;
        case 'transport':
            // Transport is calculated per person per ride/trip.
            // If it's a single-day trip (checkIn === checkOut), it's one ride.
            // If it spans multiple days, it's typically still a single booking/trip unless specified.
            // Assuming 'pricePerUnit' for transport is the cost for one person for one trip/day.
            // If multiple days, it's per person per day.
            totalPrice = (diffDays === 0 ? 1 : diffDays) * pricePerUnit * numberOfGuests;
            break;
        default:
            // Fallback for any other service types or if logic is not defined
            totalPrice = pricePerUnit;
            break;
    }

    return totalPrice;
}

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private (Authenticated User)
router.post('/', protect, async (req, res) => {
    const { serviceId, checkInDate, checkOutDate, numberOfGuests, specialRequirements } = req.body;
    const userId = req.user.id; // Get user ID from authenticated request

    try {
        // 1. Find the service to get its price and type
        const service = await Service.findByPk(serviceId);
        if (!service) {
            return res.status(404).json({ msg: 'Service not found' });
        }

        // 2. Calculate total price on the backend to prevent client-side manipulation
        const totalPrice = calculateBookingPrice(checkInDate, checkOutDate, service.price, service.type, numberOfGuests);

        // 3. Create the booking
        const newBooking = await Booking.create({
            serviceId,
            userId,
            checkInDate,
            checkOutDate,
            numberOfGuests,
            specialRequirements,
            totalPrice,
            status: 'confirmed' // Default status
        });

        res.status(201).json(newBooking);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error creating booking');
    }
});

// @route   GET /api/bookings/my
// @desc    Get all bookings for the logged-in user
// @access  Private (Authenticated User)
router.get('/my', protect, async (req, res) => {
    try {
        const bookings = await Booking.findAll({
            where: { userId: req.user.id },
            include: [{
                model: Service,
                as: 'service',
                // IMPORTANT: Include 'price' attribute here
                attributes: ['id', 'name', 'type', 'location', 'image', 'ownerId', 'price'] 
            }],
            order: [['createdAt', 'DESC']]
        });
        res.json(bookings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error fetching user bookings');
    }
});

// @route   GET /api/bookings/business
// @desc    Get all bookings for services owned by the logged-in business owner
// @access  Private (Business Owner)
router.get('/business', protect, authorizeBusinessOwner, async (req, res) => {
    try {
        // Find all services owned by the current business owner
        const ownerServices = await Service.findAll({
            where: { ownerId: req.user.id },
            attributes: ['id'] // We only need service IDs
        });

        const serviceIds = ownerServices.map(service => service.id);

        if (serviceIds.length === 0) {
            return res.json([]); // No services owned, so no bookings
        }

        // Find bookings associated with these service IDs
        const bookings = await Booking.findAll({
            where: { serviceId: serviceIds }, // Use array for IN clause
            include: [
                {
                    model: Service,
                    as: 'service',
                    // IMPORTANT: Include 'price' attribute here
                    attributes: ['id', 'name', 'type', 'location', 'image', 'price']
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'fullName', 'email'] // Include booker's details
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(bookings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error fetching business bookings');
    }
});

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status (user can cancel their own, business owner can update for their services)
// @access  Private (Authenticated User or Business Owner)
router.put('/:id/status', protect, async (req, res) => {
    const { status } = req.body;
    const bookingId = req.params.id;
    const userId = req.user.id; // Current authenticated user's ID
    const isBusinessOwner = req.user.isBusinessOwner; // Current authenticated user's role

    try {
        const booking = await Booking.findByPk(bookingId, {
            include: [{
                model: Service,
                as: 'service',
                attributes: ['ownerId']
            }]
        });

        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found' });
        }

        // Authorization logic:
        // 1. If the user is cancelling their OWN booking
        // 2. OR if the user is a business owner AND owns the service associated with the booking
        const isOwnerOfBooking = booking.userId === userId;
        const isOwnerOfService = isBusinessOwner && booking.service && booking.service.ownerId === userId;

        if (!isOwnerOfBooking && !isOwnerOfService) {
            return res.status(403).json({ msg: 'Not authorized to update this booking' });
        }

        // Specific rules for status changes:
        // A regular user can only change their booking status to 'cancelled'
        if (isOwnerOfBooking && !isBusinessOwner && status !== 'cancelled') {
            return res.status(403).json({ msg: 'Regular users can only cancel their bookings.' });
        }

        // Validate new status for all authorized users
        const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ msg: 'Invalid booking status' });
        }

        booking.status = status;
        await booking.save();

        res.json({ msg: 'Booking status updated successfully', booking });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error updating booking status');
    }
});

module.exports = router;
