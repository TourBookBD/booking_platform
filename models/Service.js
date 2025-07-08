    const { DataTypes } = require('sequelize');
    const sequelize = require('../config/database'); // Corrected path

    const Service = sequelize.define('Service', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('hotels', 'restaurants', 'rooms', 'transport'),
            allowNull: false
        },
        location: {
            type: DataTypes.STRING,
            allowNull: false
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
            allowNull: true
        },
        image: {
            type: DataTypes.STRING,
            allowNull: true
        },
        rating: {
            type: DataTypes.FLOAT,
            allowNull: true,
            validate: {
                min: 1,
                max: 5
            }
        },
        ownerId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        averageRating: {
            type: DataTypes.FLOAT,
            defaultValue: 0.0,
            allowNull: false,
            validate: {
                min: 0,
                max: 5
            }
        },
        reviewCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
            validate: {
                min: 0
            }
        }
    }, {
        timestamps: true,
        tableName: 'Services'
    });

    module.exports = Service;
    