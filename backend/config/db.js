const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🚀 MongoDB Compass Connected Cleanly...');
  } catch (err) {
    console.error('❌ Database connection failure:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;