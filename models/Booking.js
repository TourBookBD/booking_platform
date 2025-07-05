const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');    // Import User model
const Service = require('./Service'); // Import Service model

const Booking = sequelize.define('Booking', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    serviceId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Service, // This is a reference to the Service model
            key: 'id',
        }
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User, // This is a reference to the User model
            key: 'id',
        }
    },
    checkInDate: {
        type: DataTypes.DATEONLY, // Stores date only (YYYY-MM-DD)
        allowNull: false,
    },
    checkOutDate: {
        type: DataTypes.DATEONLY, // Stores date only (YYYY-MM-DD)
        allowNull: false,
    },
    numberOfGuests: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1
        }
    },
    specialRequirements: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    totalPrice: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
            min: 0
        }
    },
    status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
        defaultValue: 'confirmed',
        allowNull: false,
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt
});

// Define associations
Booking.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Booking.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });

User.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });
// IMPORTANT: Add onDelete: 'CASCADE' to the Service.hasMany(Booking) association
Service.hasMany(Booking, { 
    foreignKey: 'serviceId', 
    as: 'bookings',
    onDelete: 'CASCADE' // This is the crucial line for cascading deletes
});

module.exports = Booking;
