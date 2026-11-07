const mongoose = require("mongoose");
const logger = require("../config/logger");
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("MongoDB connected");
  } catch (error) {
    logger.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};
module.exports = connectDB;
