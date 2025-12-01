const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Google authentication
router.get('/google', authController.googleAuth);

// Exchange Google access token for JWT
router.post('/google-token', authController.exchangeGoogleToken);

// Check if user is admin
router.get('/check-admin', auth, async (req, res) => {
    try {
        console.log(req.user)
        res.json({ 
            isAdmin: req.user.isAdmin,
            user: {
                email: req.user.email,
                name: req.user.name,
                image: req.user.image
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;