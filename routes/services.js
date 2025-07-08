// routes/services.js
const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const User = require('../models/User');
const Review = require('../models/Review'); // NEW: Import the Review model
const { protect, authorizeBusinessOwner } = require('../middleware/authMiddleware');

// @route   GET /api/services
// @desc    Get all services (with optional type and search filters)
// @access  Public
// Note: This route will still return averageRating and reviewCount as stored in the DB,
// not the on-the-fly calculated ones for individual services.
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

// @route   GET /api/services/:id
// @desc    Get a single service by ID (with ON-DEMAND average rating/review count)
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const service = await Service.findByPk(req.params.id, {
            include: [{
                model: User,
                as: 'owner',
                attributes: ['id', 'fullName', 'email']
            }]
        });

        if (!service) {
            return res.status(404).json({ msg: 'Service not found' });
        }

        // --- START: ON-DEMAND calculation of averageRating and reviewCount ---
        const reviews = await Review.findAll({
            where: { serviceId: req.params.id },
            attributes: ['rating'] // Only fetch ratings to minimize data transfer
        });

        let currentAverageRating = 0;
        let currentReviewCount = reviews.length;

        if (currentReviewCount > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            currentAverageRating = totalRating / currentReviewCount;
        }

        // Override the values from the database in the object sent in the response.
        // We use service.dataValues to directly modify the plain data object
        // without affecting the actual database record (unless .save() is called, which we don't want here).
        service.dataValues.averageRating = currentAverageRating;
        service.dataValues.reviewCount = currentReviewCount;
        // --- END: ON-DEMAND calculation ---

        res.json(service);
    } catch (err) {
        console.error(err.message);
        if (err.name === 'SequelizeInvalidUUIDError' || (err.name === 'SequelizeDatabaseError' && err.message.includes('invalid input syntax for type uuid'))) {
            return res.status(400).json({ msg: 'Invalid service ID format.' });
        }
        res.status(500).send('Server Error');
    }
});


// @route   POST /api/services
// @desc    Add new service
// @access  Private (Business Owner)
router.post('/', protect, authorizeBusinessOwner, async (req, res) => {
    const { name, type, location, price, description, image } = req.body;
    const ownerId = req.user.id;

    try {
        const newService = await Service.create({
            name,
            type,
            location,
            price,
            description,
            image,
            ownerId
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
    const { name, type, location, price, description, image } = req.body;
    const ownerId = req.user.id;

    try {
        const service = await Service.findByPk(id);

        if (!service) {
            return res.status(404).json({ msg: 'Service not found' });
        }

        if (service.ownerId !== ownerId) {
            return res.status(403).json({ msg: 'Not authorized to update this service' });
        }

        service.name = name !== undefined ? name : service.name;
        service.type = type !== undefined ? type : service.type;
        service.location = location !== undefined ? location : service.location;
        service.price = price !== undefined ? price : service.price;
        service.description = description !== undefined ? description : service.description;
        service.image = image !== undefined ? image : service.image;

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
    const ownerId = req.user.id;

    try {
        const service = await Service.findByPk(id);

        if (!service) {
            return res.status(404).json({ msg: 'Service not found' });
        }

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