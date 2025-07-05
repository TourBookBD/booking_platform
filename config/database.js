require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'postgres',
        port: process.env.DB_PORT,
        logging: false, // Set to true to see SQL queries in console
        dialectOptions: {
            // SSL settings if your production database requires it (e.g., Heroku Postgres)
            // For local Docker, this is usually not needed.
            // ssl: {
            //     require: true,
            //     rejectUnauthorized: false // Adjust this based on your SSL certificate
            // }
        }
    }
);

module.exports = sequelize;