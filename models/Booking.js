    const { DataTypes } = require('sequelize');
    const sequelize = require('../config/database'); // Corrected path

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
                model: 'Services',
                key: 'id',
            }
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id',
            }
        },
        checkInDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        checkOutDate: {
            type: DataTypes.DATEONLY,
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
        timestamps: true,
        tableName: 'Bookings'
    });

    module.exports = Booking;
    