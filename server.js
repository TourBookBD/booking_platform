// server.js
require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');

// Import models (ensure these paths are correct relative to server.js)
const User = require('./models/User');
const Service = require('./models/Service');
const Booking = require('./models/Booking');
const Review = require('./models/Review');

// Import routes
const authRoutes = require('./routes/auth');
const serviceRoutes = require('./routes/services');
const bookingRoutes = require('./routes/bookings');
const reviewRoutes = require('./routes/reviews');

// NO LONGER NEEDED:
// const { updateServiceRating } = require('./routes/reviews');
// The updateServiceRating function and its import are removed from server.js
// because calculations are now done on-demand in the services route.

const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Enable parsing of JSON request bodies

// Define Sequelize Associations (after all models have been imported)
// User to Service (Owner)
User.hasMany(Service, { foreignKey: 'ownerId', as: 'services' });
Service.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// User to Booking
User.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Service to Booking
Service.hasMany(Booking, {
    foreignKey: 'serviceId',
    as: 'bookings',
    onDelete: 'CASCADE' // If a service is deleted, its bookings are also deleted
});
Booking.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });

// Service to Review
Service.hasMany(Review, {
    foreignKey: 'serviceId',
    as: 'reviews',
    onDelete: 'CASCADE' // If a service is deleted, its reviews are also deleted
});
Review.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });

// User to Review (who wrote the review)
User.hasMany(Review, {
    foreignKey: 'userId',
    as: 'userReviews', // Use a distinct alias if User also has other associations with Review
    onDelete: 'CASCADE' // If a user is deleted, their reviews are also deleted
});
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });


// Use API routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);

// Root route for API status check (optional)
app.get('/api', (req, res) => {
    res.send('API is running!');
});

// Database synchronization and server start
const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true }) // `alter: true` attempts to make necessary changes to existing tables
    .then(async () => { // Make this block async if you need to use await inside
        console.log('PostgreSQL connected successfully!');
        console.log('Database synchronized (tables created/updated)!');

        // REMOVED: The logic to re-calculate all service ratings on startup is removed.
        // This is because the averageRating and reviewCount are now calculated on-demand
        // when a service's details page is viewed via the GET /api/services/:id route.
        // If you want to re-enable pre-calculation for performance, you'd put the logic back here.

        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });