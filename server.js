require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database'); // Import sequelize instance
const User = require('./models/User'); // Import User model (important for Sequelize to know about it)
const Service = require('./models/Service'); // Import Service model
const Booking = require('./models/Booking'); // Import Booking model
const authRoutes = require('./routes/auth'); // Import auth routes
const serviceRoutes = require('./routes/services'); // Import service routes
const bookingRoutes = require('./routes/bookings'); // Import booking routes


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection and Sync
sequelize.authenticate()
    .then(() => {
        console.log('PostgreSQL connected successfully!');
        // Synchronize all models. `alter: true` is for development convenience.
        // For production, consider using migrations.
        return sequelize.sync({ alter: true });
    })
    .then(() => {
        console.log('Database synchronized (tables created/updated)!');
    })
    .catch(err => console.error('PostgreSQL connection or sync error:', err));

// Define API routes
app.use('/api/auth', authRoutes); // All authentication routes will be prefixed with /api/auth
app.use('/api/services', serviceRoutes); // All service routes will be prefixed with /api/services
app.use('/api/bookings', bookingRoutes); // All booking routes will be prefixed with /api/bookings

// Basic Route
app.get('/', (req, res) => {
    res.send('TourBook API is running with PostgreSQL...');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});