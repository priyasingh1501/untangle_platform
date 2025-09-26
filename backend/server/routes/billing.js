const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Razorpay = require('razorpay');
const crypto = require('crypto');

function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error('Razorpay keys missing: set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// Get user's subscription details
router.get('/subscription', auth, async (req, res) => {
  try {
    console.log('🔍 Billing /subscription req.user:', req.user);
    const userId = req.user?.id || req.user?.userId || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: user not found in token' });
    }
    const subscription = await Subscription.getActiveSubscription(userId);
    
    if (!subscription) {
      // Create trial subscription if none exists
      const newSubscription = await Subscription.createTrial(userId);
      return res.json({
        success: true,
        subscription: newSubscription
      });
    }

    res.json({
      success: true,
      subscription
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription details'
    });
  }
});

// Get billing history
router.get('/payments', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const userId = req.user?.id || req.user?.userId || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: user not found in token' });
    }
    const payments = await Payment.getUserPayments(userId, parseInt(limit), parseInt(skip));
    const total = await Payment.countDocuments({ user: userId });

    res.json({
      success: true,
      payments,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasMore: skip + payments.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history'
    });
  }
});

// Create payment intent (for Stripe/Razorpay)
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan. Must be monthly or yearly.' });
    }

    // Get or create subscription
    const userId = req.user?.id || req.user?.userId || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: user not found in token' });
    }
    let subscription = await Subscription.getActiveSubscription(userId);
    if (!subscription) {
      subscription = await Subscription.createTrial(userId);
    }

    // Amount in paise for Razorpay
    const amountPaise = plan === 'monthly' ? 499 * 100 : 4999 * 100;

    // Create Razorpay order
    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: { userId: req.user.id, plan },
    });

    // Persist pending payment mapped to this order
    const payment = await Payment.create({
      user: userId,
      subscription: subscription._id,
      amount: amountPaise / 100,
      currency: 'INR',
      status: 'pending',
      paymentMethod: 'card',
      paymentProvider: 'razorpay',
      providerPaymentId: order.id,
      providerOrderId: order.id,
      description: `Lyfe ${plan} subscription`,
    });

    res.json({
      success: true,
      paymentId: payment._id,
      razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create payment intent',
      error: error?.message || 'Unknown error'
    });
  }
});

// Verify payment (webhook handler)
router.post('/verify-payment', auth, async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, plan } = req.body;

    // Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const userId = req.user?.id || req.user?.userId || req.user?._id;
    const payment = await Payment.findOne({ providerOrderId: razorpay_order_id, user: userId });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    payment.status = 'completed';
    payment.providerPaymentId = razorpay_payment_id;
    payment.providerSignature = razorpay_signature;
    await payment.save();

    // Activate or update subscription
    const subscription = await Subscription.findById(payment.subscription);
    if (subscription) {
      const selectedPlan = ['monthly', 'yearly'].includes(plan) ? plan : 'monthly';
      subscription.plan = selectedPlan;
      subscription.status = 'active';
      subscription.paymentMethod = 'card';
      subscription.paymentProvider = 'razorpay';
      subscription.paymentId = razorpay_payment_id;
      subscription.lastPaymentDate = new Date();
      if (selectedPlan === 'monthly') {
        subscription.currentPeriodStart = new Date();
        subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      } else {
        subscription.currentPeriodStart = new Date();
        subscription.currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      }
      subscription.nextBillingDate = subscription.currentPeriodEnd;
      subscription.amount = selectedPlan === 'monthly' ? 499 : 4999;
      await subscription.save();
    }

    res.json({ success: true, subscription });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Failed to verify payment' });
  }
});

// Cancel subscription
router.post('/cancel-subscription', auth, async (req, res) => {
  try {
    const { reason } = req.body;

    const subscription = await Subscription.getActiveSubscription(req.user.id);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    await subscription.cancel(reason);

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    });
  }
});

// Reactivate subscription
router.post('/reactivate-subscription', auth, async (req, res) => {
  try {
    const { plan } = req.body;

    if (!['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan. Must be monthly or yearly.'
      });
    }

    let subscription = await Subscription.findOne({
      user: req.user.id,
      status: 'cancelled'
    }).sort({ createdAt: -1 });

    if (!subscription) {
      // Create new subscription
      subscription = new Subscription({
        user: req.user.id,
        plan,
        status: 'active',
        amount: plan === 'monthly' ? 499 : 4999
      });
    } else {
      // Reactivate existing subscription
      subscription.plan = plan;
      subscription.status = 'active';
      subscription.amount = plan === 'monthly' ? 499 : 4999;
    }

    // Set billing dates
    if (plan === 'monthly') {
      subscription.currentPeriodStart = new Date();
      subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      subscription.nextBillingDate = subscription.currentPeriodEnd;
    } else if (plan === 'yearly') {
      subscription.currentPeriodStart = new Date();
      subscription.currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      subscription.nextBillingDate = subscription.currentPeriodEnd;
    }

    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription reactivated successfully',
      subscription
    });
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reactivate subscription'
    });
  }
});

// Webhook endpoint for payment providers
router.post('/webhook', async (req, res) => {
  try {
    const { event, data } = req.body;

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(data);
        break;
      case 'payment.failed':
        await handlePaymentFailed(data);
        break;
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(data);
        break;
      default:
        console.log('Unhandled webhook event:', event);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false });
  }
});

// Helper functions for webhook handling
async function handlePaymentCaptured(data) {
  const payment = await Payment.findOne({ providerPaymentId: data.id });
  if (payment) {
    await payment.markCompleted(data);
    
    // Update subscription
    const subscription = await Subscription.findById(payment.subscription);
    if (subscription) {
      await subscription.renew();
    }
  }
}

async function handlePaymentFailed(data) {
  const payment = await Payment.findOne({ providerPaymentId: data.id });
  if (payment) {
    await payment.markFailed(data.error?.description || 'Payment failed');
  }
}

async function handleSubscriptionCancelled(data) {
  const subscription = await Subscription.findOne({ 
    paymentId: data.subscription_id 
  });
  if (subscription) {
    await subscription.cancel('Cancelled via payment provider');
  }
}

module.exports = router;
