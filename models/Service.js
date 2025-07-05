const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User'); // Import the User model to define association

const Service = sequelize.define('Service', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: DataTypes.ENUM('hotels', 'restaurants', 'rooms', 'transport'),
        allowNull: false,
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
            min: 0
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true, // Image URL is optional
        defaultValue: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400', // Default image
    },
    rating: {
        type: DataTypes.FLOAT,
        defaultValue: 4.0, // Default rating
        validate: {
            min: 1,
            max: 5
        }
    },
    // ownerId will be automatically added by the association
}, {
    timestamps: true,
});

// Define association: A Service belongs to a User (business owner)
Service.belongsTo(User, {
    foreignKey: 'ownerId', // This will add an `ownerId` column to the Service table
    as: 'owner' // Alias for when we include the user
});

// A User can have many Services
User.hasMany(Service, {
    foreignKey: 'ownerId',
    as: 'services'
});

module.exports = Service;