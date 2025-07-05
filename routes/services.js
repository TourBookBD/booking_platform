const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const { protect, authorizeBusinessOwner } = require('../middleware/authMiddleware');

// @route   GET /api/services
// @desc    Get all services
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { type, search } = req.query;
        let whereClause = {};

        if (type && type !== 'all') {
            whereClause.type = type;
        }

        if (search) {
            whereClause = {
                ...whereClause,
                [require('sequelize').Op.or]: [
                    { name: { [require('sequelize').Op.iLike]: `%${search}%` } },
                    { description: { [require('sequelize').Op.iLike]: `%${search}%` } },
                    { location: { [require('sequelize').Op.iLike]: `%${search}%` } }
                ]
            };
        }

        const services = await Service.findAll({ where: whereClause });
        res.json(services);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error fetching services');
    }
});

// @route   POST /api/services
// @desc    Add new service
// @access  Private (Business Owner)
router.post('/', protect, authorizeBusinessOwner, async (req, res) => {
    const { name, type, location, price, description, image, rating } = req.body;
    const ownerId = req.user.id; // Get owner ID from authenticated user

    try {
        const newService = await Service.create({
            name,
            type,
            location,
            price,
            description,
            image,
            rating,
            ownerId // Assign the ownerId
        });
        res.status(201).json(newService);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error adding service');
    }
});

// @route   PUT /api/services/:id
// @desc    Update a service
// @access  Private (Business Owner who owns the service)
router.put('/:id', protect, authorizeBusinessOwner, async (req, res) => {
    const { id } = req.params;
    const { name, type, location, price, description, image, rating } = req.body;
    const ownerId = req.user.id; // Current authenticated business owner's ID

    try {
        const service = await Service.findByPk(id);

        if (!service) {
            return res.status(404).json({ msg: 'Service not found' });
        }

        // Ensure the logged-in business owner owns this service
        if (service.ownerId !== ownerId) {
            return res.status(403).json({ msg: 'Not authorized to update this service' });
        }

        service.name = name || service.name;
        service.type = type || service.type;
        service.location = location || service.location;
        service.price = price || service.price;
        service.description = description || service.description;
        service.image = image || service.image;
        service.rating = rating || service.rating;

        await service.save();
        res.json(service);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error updating service');
    }
});

// @route   DELETE /api/services/:id
// @desc    Delete a service
// @access  Private (Business Owner who owns the service)
router.delete('/:id', protect, authorizeBusinessOwner, async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user.id; // Current authenticated business owner's ID

    try {
        const service = await Service.findByPk(id);

        if (!service) {
            return res.status(404).json({ msg: 'Service not found' });
        }

        // Ensure the logged-in business owner owns this service
        if (service.ownerId !== ownerId) {
            return res.status(403).json({ msg: 'Not authorized to delete this service' });
        }

        await service.destroy();
        res.json({ msg: 'Service removed' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error deleting service');
    }
});

module.exports = router;
