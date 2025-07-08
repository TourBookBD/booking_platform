    const { DataTypes } = require('sequelize');
    const sequelize = require('../config/database'); // Corrected path: go up one level to root, then into config

    const Review = sequelize.define('Review', {
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
                model: 'Services', // Reference table name directly
                key: 'id',
            },
            onDelete: 'CASCADE' // If a service is deleted, its reviews are also deleted
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Users', // Reference table name directly
                key: 'id',
            },
            onDelete: 'CASCADE' // If a user is deleted, their reviews are also deleted
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1, // Minimum rating of 1 star
                max: 5  // Maximum rating of 5 stars
            }
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true, // Comments are optional
        },
        ownerResponse: {
            type: DataTypes.TEXT,
            allowNull: true, // Owner responses are optional
        }
    }, {
        timestamps: true, // Adds createdAt and updatedAt fields automatically
        tableName: 'Reviews' // Explicitly set table name to 'Reviews'
    });

    // IMPORTANT: Associations are defined in server.js, not here, to prevent circular dependencies.
    // Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });
    // Review.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });

    module.exports = Review;
    