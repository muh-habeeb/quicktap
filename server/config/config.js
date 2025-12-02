require('dotenv').config();

const config = {
  // Server Configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  mongoUri: process.env.DB_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/quicktap',
  
  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtTimeout: process.env.JWT_TIMEOUT || '3d',
  
  // Google OAuth Configuration
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  
  // Razorpay Configuration
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET
  },
  
  // Cloudinary Configuration
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },
  
  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',')
      : '*',
    credentials: process.env.CORS_CREDENTIALS === 'true' || false
  },
  
  // Client URL Configuration
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  
  // API Configuration
  apiPrefix: '/api',
  
  // Get server URLs
  getServerUrls: function() {
    return {
      local: `http://localhost:${this.port}`,
      network: `http://172.20.10.2:${this.port}`,
      base: process.env.SERVER_URL || `http://localhost:${this.port}`
    };
  }
};

module.exports = config;
