const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

/* Exchange Google Access Token for JWT */
exports.exchangeGoogleToken = async (req, res, next) => {
    const { access_token } = req.body;
    if (!access_token) {
        return res.status(400).json({
            message: "Access token is required"
        });
    }

    try {
        console.log('Exchanging Google access token for JWT...');
        
        // Get user info from Google
        console.log('Fetching user info from Google...');
        const userRes = await axios.get(
            'https://www.googleapis.com/oauth2/v1/userinfo',
            {
                headers: { 
                    Authorization: `Bearer ${access_token}`,
                    Accept: 'application/json'
                }
            }
        );

        if (!userRes.data) {
            throw new Error('No user data received from Google');
        }

        console.log('Successfully received user info:', userRes.data);
        
        const { email, name, picture } = userRes.data;
        if (!email || !name) {
            throw new Error('Required user data missing from Google response');
        }

        // Find or create user
        let user = await User.findOne({ email });
        if (!user) {
            console.log('Creating new user with email:', email);
            user = await User.create({
                name,
                email,
                image: picture,
            });
            console.log('Successfully created new user');
        } else {
            console.log('Found existing user:', email);
        }

        // Generate JWT token
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not configured');
        }

        const { _id } = user;
        const token = jwt.sign(
            { _id, email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_TIMEOUT || '7d' }
        );

        console.log('Successfully generated JWT token in exchangeGoogleToken');
        console.log('Token structure:', {
            tokenLength: token.length,
            tokenParts: token.split('.').length,
            payload: jwt.decode(token)
        });

        // Send response
        res.status(200).json({
            message: 'success',
            token,
            user: {
                email: user.email,
                name: user.name,
                image: user.image
            }
        });
    } catch (error) {
        console.error('Detailed token exchange error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            stack: error.stack
        });

        // Send appropriate error response
        res.status(500).json({
            message: "Token exchange failed",
            error: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                details: error.response?.data
            } : undefined
        });
    }
};

/* GET Google Authentication API. */
exports.googleAuth = async (req, res, next) => {
    const { code } = req.query;
    if (!code) {
        return res.status(400).json({
            message: "Authorization code is required"
        });
    }

    try {
        console.log('Starting Google auth process with code:', code);
        
        // Exchange code for tokens
        console.log('Exchanging code for tokens...');
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: 'postmessage',
            grant_type: 'authorization_code',
        });

        if (!tokenResponse.data.access_token) {
            throw new Error('No access token received from Google');
        }

        const accessToken = tokenResponse.data.access_token;
        console.log('Successfully received access token from Google');
        
        // Get user info
        console.log('Fetching user info from Google...');
        const userRes = await axios.get(
            'https://www.googleapis.com/oauth2/v1/userinfo',
            {
                headers: { 
                    Authorization: `Bearer ${accessToken}`,
                    Accept: 'application/json'
                }
            }
        );

        if (!userRes.data) {
            throw new Error('No user data received from Google');
        }

        console.log('Successfully received user info:', userRes.data);
        
        const { email, name, picture } = userRes.data;
        if (!email || !name) {
            throw new Error('Required user data missing from Google response');
        }

        // Find or create user
        let user = await User.findOne({ email });
        if (!user) {
            console.log('Creating new user with email:', email);
            user = await User.create({
                name,
                email,
                image: picture,
            });
            console.log('Successfully created new user');
        } else {
            console.log('Found existing user:', email);
        }

        // Generate JWT token
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not configured');
        }

        const { _id } = user;
        const token = jwt.sign(
            { _id, email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_TIMEOUT || '7d' }
        );

        console.log('Successfully generated JWT token');

        // Send response
        res.status(200).json({
            message: 'success',
            token,
            user: {
                email: user.email,
                name: user.name,
                image: user.image
            }
        });
    } catch (error) {
        console.error('Detailed Google auth error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            stack: error.stack
        });

        // Send appropriate error response
        res.status(500).json({
            message: "Authentication failed",
            error: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                details: error.response?.data
            } : undefined
        });
    }
};