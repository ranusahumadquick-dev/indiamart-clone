// Import mongoose for database connection
const mongoose = require('mongoose');
const logger = require('morgan');

// Database connection state
let isConnected = false;

/**
 * Connect to MongoDB database using Mongoose
 * Uses connection string from environment variables
 */
const connectDB = async () => {
  try {
    // MongoDB connection URI from environment variables
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/bazaarconnect';
    
    console.log('Connecting to MongoDB...');
    
    // Connect with Mongoose
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    
    isConnected = true;
    
    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('MongoDB Connected Successfully');
    });
    
    mongoose.connection.on('error', (error) => {
      console.error('MongoDB Connection Error:', error);
      isConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB Disconnected');
      isConnected = false;
    });
    
    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('MongoDB Connection Failed:', error.message);
    
    // If connection fails, retry after 5 seconds
    if (!isConnected) {
      console.log('Retrying in 5 seconds...');
      setTimeout(connectDB, 5000);
    }
  }
};

/**
 * Get database connection status
 */
const getDBStatus = () => {
  return {
    isConnected: isConnected,
    host: mongoose.connection?.host || 'Unknown',
    port: mongoose.connection?.port || 'Unknown',
    database: mongoose.connection?.name || 'Unknown'
  };
};

module.exports = {
  connect: connectDB,
  isConnected,
  getDBStatus,
  mongoose
};