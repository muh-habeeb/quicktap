const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/paymentModel');

// Initialize Razorpay with test keys
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  // Use test keys if environment variables are not set
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID ,
    key_secret: process.env.RAZORPAY_KEY_SECRET ,
  });
  console.log('Using Razorpay test keys');
}

// Create Razorpay order
router.post('/create-order', async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.',
      });
    }

    const { amount, currency = 'INR', receipt, notes } = req.body;

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt,
      notes: notes || {},
    };

    const order = await razorpay.orders.create(options);
    
    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      },
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message,
    });
  }
});

// Create Razorpay order from cart
router.post('/create-cart-order', async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Razorpay is not configured.',
      });
    }

    const { userId, cartItems, totalAmount, currency = 'INR' } = req.body;

    if (!userId || !cartItems || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, cartItems, totalAmount',
      });
    }

    const receipt = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const options = {
      amount: Math.round(totalAmount * 100), // Razorpay expects amount in paise
      currency,
      receipt,
      notes: {
        userId: userId,
        itemCount: cartItems.length,
        items: cartItems.map(item => `${item.name} x${item.quantity}`).join(', ')
      },
    };

    const order = await razorpay.orders.create(options);
    
    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        notes: options.notes,
      },
    });
  } catch (error) {
    console.error('Error creating cart order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create cart order',
      error: error.message,
    });
  }
});

// Verify Razorpay payment
router.post('/verify', async (req, res) => {
  try {
    const secretKey = process.env.RAZORPAY_KEY_SECRET || 'jEQ0qUumMXfWmdfzkCvpGA0T';

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, userName, amount, orderDetails } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      try {
        // Store payment details in database
        const payment = new Payment({
          userId: userId || 'guest',
          userName: userName || 'Guest User',
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          amount: amount,
          currency: 'INR',
          status: 'completed',
          orderDetails: orderDetails || {},
          paymentMethod: 'razorpay'
        });

        await payment.save();
        console.log('Payment details stored in database:', payment);

        // Payment is verified and stored, update order status
        res.json({
          success: true,
          message: 'Payment verified successfully and stored in database',
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          storedPayment: payment
        });
      } catch (dbError) {
        console.error('Error storing payment in database:', dbError);
        // Even if database storage fails, payment verification was successful
        res.json({
          success: true,
          message: 'Payment verified successfully but failed to store in database',
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          warning: 'Database storage failed'
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message,
    });
  }
});

// Create UPI payment
router.post('/upi', async (req, res) => {
  try {
    const { amount, upiId, description, orderId } = req.body;

    // Generate unique payment ID
    const paymentId = `upi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store payment details (you can use a database here)
    const paymentData = {
      paymentId,
      orderId,
      amount,
      upiId,
      description,
      status: 'pending',
      createdAt: new Date(),
    };

    // Generate UPI deep link
    const upiLink = `upi://pay?pa=${upiId}&pn=quick-tap%20Food&am=${amount}&cu=INR&tn=${encodeURIComponent(description)}`;

    res.json({
      success: true,
      paymentId,
      upiLink,
      qrData: upiLink,
      message: 'UPI payment initiated',
    });
  } catch (error) {
    console.error('Error creating UPI payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create UPI payment',
      error: error.message,
    });
  }
});

// Get payment status
router.get('/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;

    // In a real implementation, you would check the payment status from your database
    // For now, we'll return a mock status
    const status = 'pending'; // This should come from your database

    res.json({
      success: true,
      paymentId,
      status,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error getting payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
      error: error.message,
    });
  }
});

// Webhook for payment updates (for real-time updates)
router.post('/webhook', async (req, res) => {
  try {
    const { event, payload } = req.body;

    // Handle different payment events
    switch (event) {
      case 'payment.captured':
        // Payment was successful
        console.log('Payment captured:', payload.payment.entity);
        break;
      case 'payment.failed':
        // Payment failed
        console.log('Payment failed:', payload.payment.entity);
        break;
      default:
        console.log('Unhandled event:', event);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ success: false });
  }
});

// Get all payments (for admin)
router.get('/admin/all', async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      payments: payments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
});

// Get payment statistics (for admin)
router.get('/admin/stats', async (req, res) => {
  try {
    const totalPayments = await Payment.countDocuments();
    const totalAmount = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const recentPayments = await Payment.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalPayments,
        totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0,
        recentPayments
      }
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment statistics',
      error: error.message
    });
  }
});

module.exports = router;
