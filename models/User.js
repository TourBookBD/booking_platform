const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs'); // Import bcrypt for password hashing

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    fullName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isBusinessOwner: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt
    tableName: 'Users', // Explicitly set table name to 'Users'
    hooks: {
        // Before creating or updating a user, hash their password
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) { // Only hash if password has been changed
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

// Instance method to compare entered password with hashed password
User.prototype.comparePassword = async function(enteredPassword) {
    // 'this.password' refers to the hashed password stored in the database for this user instance
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = User;
