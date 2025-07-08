// routes/reviews.js
const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Service = require('../models/Service'); // Still needed to check if service exists
const User = require('../models/User');
const { protect, authorizeBusinessOwner } = require('../middleware/authMiddleware');

// Removed: The updateServiceRating helper function is removed as calculations are now on-demand in services.js

// @route   POST /api/reviews
// @desc    Submit a new review for a service
// @access  Private (Authenticated User)
router.post('/', protect, async (req, res) => {
    const { serviceId, rating, comment } = req.body;
    const userId = req.user.id;

    if (!serviceId || !rating) {
        return res.status(400).json({ msg: 'Service ID and rating are required.' });
    }
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ msg: 'Rating must be between 1 and 5.' });
    }

    try {
        const service = await Service.findByPk(serviceId);
        if (!service) {
            return res.status(404).json({ msg: 'Service not found.' });
        }

        const newReview = await Review.create({
            serviceId,
            userId,
            rating,
            comment: comment || null
        });

        // Removed: updateServiceRating call here

        const reviewWithUser = await Review.findByPk(newReview.id, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'fullName', 'email']
            }]
        });

        res.status(201).json({ msg: 'Review submitted successfully!', review: reviewWithUser });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error submitting review');
    }
});

// @route   GET /api/reviews/service/:serviceId
// @desc    Get all reviews for a specific service
// @access  Public
router.get('/service/:serviceId', async (req, res) => {
    try {
        const reviews = await Review.findAll({
            where: { serviceId: req.params.serviceId },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'fullName', 'email']
            }],
            order: [['createdAt', 'DESC']]
        });
        res.json(reviews);
    } catch (err) {
        console.error(err.message);
        if (err.name === 'SequelizeInvalidUUIDError' || (err.name === 'SequelizeDatabaseError' && err.message.includes('invalid input syntax for type uuid'))) {
            return res.status(400).json({ msg: 'Invalid service ID format.' });
        }
        res.status(500).send('Server error fetching reviews for service');
    }
});

// @route   PUT /api/reviews/:id/response
// @desc    Business owner responds to a review
// @access  Private (Business Owner who owns the service associated with the review)
router.put('/:id/response', protect, authorizeBusinessOwner, async (req, res) => {
    const { ownerResponse } = req.body;
    const reviewId = req.params.id;
    const ownerUserId = req.user.id;

    if (!ownerResponse) {
        return res.status(400).json({ msg: 'Owner response cannot be empty.' });
    }

    try {
        const review = await Review.findByPk(reviewId, {
            include: [{
                model: Service,
                as: 'service',
                attributes: ['ownerId']
            }]
        });

        if (!review) {
            return res.status(404).json({ msg: 'Review not found.' });
        }

        if (!review.service || review.service.ownerId !== ownerUserId) {
            return res.status(403).json({ msg: 'Not authorized to respond to this review.' });
        }

        review.ownerResponse = ownerResponse;
        await review.save();

        const updatedReviewWithUser = await Review.findByPk(review.id, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'fullName', 'email']
            }]
        });

        res.json({ msg: 'Owner response added successfully!', review: updatedReviewWithUser });

    } catch (err) {
        console.error(err.message);
        if (err.name === 'SequelizeInvalidUUIDError' || (err.name === 'SequelizeDatabaseError' && err.message.includes('invalid input syntax for type uuid'))) {
            return res.status(400).json({ msg: 'Invalid review ID format.' });
        }
        res.status(500).send('Server error adding owner response');
    }
});

// @route   PUT /api/reviews/:id
// @desc    Update a user's own review
// @access  Private (Authenticated User who owns the review)
router.put('/:id', protect, async (req, res) => {
    const { rating, comment } = req.body;
    const reviewId = req.params.id;
    const userId = req.user.id;

    if (!rating) {
        return res.status(400).json({ msg: 'Rating is required for updating a review.' });
    }
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ msg: 'Rating must be between 1 and 5.' });
    }

    try {
        const review = await Review.findByPk(reviewId);
        if (!review) {
            return res.status(404).json({ msg: 'Review not found.' });
        }

        if (review.userId !== userId) {
            return res.status(403).json({ msg: 'Not authorized to update this review.' });
        }

        review.rating = rating;
        review.comment = comment !== undefined ? comment : review.comment;
        await review.save();

        // Removed: updateServiceRating call here

        const updatedReviewWithUser = await Review.findByPk(review.id, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'fullName', 'email']
            }]
        });

        res.json({ msg: 'Review updated successfully!', review: updatedReviewWithUser });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error updating review');
    }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete a user's own review
// @access  Private (Authenticated User who owns the review)
router.delete('/:id', protect, async (req, res) => {
    const reviewId = req.params.id;
    const userId = req.user.id;

    try {
        const review = await Review.findByPk(reviewId);
        if (!review) {
            return res.status(404).json({ msg: 'Review not found.' });
        }

        if (review.userId !== userId) {
            return res.status(403).json({ msg: 'Not authorized to delete this review.' });
        }

        // Removed: serviceId extraction and updateServiceRating call here

        await review.destroy();
        res.json({ msg: 'Review deleted successfully!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error deleting review');
    }
});

module.exports = router;
// Removed: module.exports.updateServiceRating = updateServiceRating; as it's no longer needed for external calls