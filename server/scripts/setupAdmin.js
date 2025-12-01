const mongoose = require('mongoose');
const User = require('../models/userModel');
require('dotenv').config();

const setupAdmin = async () => {
    try {
        // Connect to MongoDB using DB_URL
        const dbUrl = process.env.DB_URL ;
        console.log('Connecting to MongoDB with URL:', dbUrl);
        
        await mongoose.connect(dbUrl);
        console.log('Connected to MongoDB');

        // Get email from command line argument
        const email = process.argv[2];
        
        if (!email) {
            console.error('Please provide an email address as an argument');
            console.log('Usage: node scripts/setupAdmin.js <email>');
            process.exit(1);
        }

        // Find user by email
        const user = await User.findOne({ email });
        
        if (!user) {
            console.error(`User with email ${email} not found`);
            console.log('Make sure the user has logged in at least once through Google OAuth');
            process.exit(1);
        }

        // Update user to be admin
        user.isAdmin = true;
        await user.save();
        
        console.log(`User ${email} has been granted admin privileges`);
        console.log('User details:', {
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin
        });

        process.exit(0);
    } catch (error) {
        console.error('Error setting up admin:', error);
        process.exit(1);
    }
};

setupAdmin();
