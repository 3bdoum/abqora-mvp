require('dotenv').config();
const connectDB = require('../config/db');
const { seedData } = require('./seed');

const run = async () => {
    await connectDB();
    await seedData();
    console.log('Course/access migration completed without deleting existing progress.');
    process.exit(0);
};

run().catch((error) => {
    console.error('Migration error:', error.message);
    process.exit(1);
});
