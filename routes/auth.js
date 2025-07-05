const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (id, email, isBusinessOwner) => {
    return jwt.sign({ id, email, isBusinessOwner }, process.env.JWT_SECRET, {
        expiresIn: '1h', // Token expires in 1 hour
    });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
    const { fullName, email, password, isBusinessOwner } = req.body;

    try {
        // Check if user already exists
        let user = await User.findOne({ where: { email } });
        if (user) {
            return res.status(400).json({ msg: 'User with that email already exists' });
        }

        // Create new user
        user = await User.create({
            fullName,
            email,
            password, // Password will be hashed by the model hook
            isBusinessOwner: isBusinessOwner || false,
        });

        const token = generateToken(user.id, user.email, user.isBusinessOwner);

        res.status(201).json({
            msg: 'User registered successfully',
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                isBusinessOwner: user.isBusinessOwner,
            },
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error during registration');
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const token = generateToken(user.id, user.email, user.isBusinessOwner);

        res.json({
            msg: 'Logged in successfully',
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                isBusinessOwner: user.isBusinessOwner,
            },
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error during login');
    }
});

module.exports = router;