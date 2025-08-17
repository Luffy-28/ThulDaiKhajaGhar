require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const admin = require("firebase-admin");

// Firebase Admin Setup
var serviceAccount = require("./restaurent-5d9ad-firebase-adminsdk-fbsvc-5f92d59b97.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://restaurent-5d9ad.firebaseio.com"
});

const db = admin.firestore();
const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

//  Enable CORS
app.use(cors({
  origin: ['https://restaurent-5d9ad.web.app'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// Create Payment Intent
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { products } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty products array' });
    }

    for (const product of products) {
      if (!product.price || !product.quantity || typeof product.price !== 'number' || typeof product.quantity !== 'number') {
        return res.status(400).json({ error: 'Invalid product data: price and quantity must be numbers' });
      }
    }

    const subtotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const total = subtotal;

    if (total <= 0) {
      return res.status(400).json({ error: 'Total amount must be greater than zero' });
    }

    // Create PaymentIntent with card details saving
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: 'aud',
      payment_method_types: ['card'],   
      setup_future_usage: 'off_session', 
      metadata: {
        subtotal: subtotal.toFixed(2),
        total: total.toFixed(2),
      },
    });

    console.log(' PaymentIntent created:', paymentIntent.id);

    return res.json({
      clientSecret: paymentIntent.client_secret,
      subtotal: subtotal.toFixed(2),
      total: total.toFixed(2),
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    console.error('Stripe error:', err.message);
    return res.status(500).json({ error: 'Payment intent creation failed', details: err.message });
  }
});

// Save Card Details
app.post('/save-card-details', async (req, res) => {
  const { paymentIntentId, userId } = req.body;

  if (!paymentIntentId || !userId) {
    return res.status(400).json({ success: false, error: 'paymentIntentId and userId are required' });
  }

  try {
    console.log("Retrieving PaymentIntent:", paymentIntentId);

    // Expand payment_method to get card details directly
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['payment_method'],
    });

    let paymentMethodId = null;
    let last4 = "0000";
    let brand = "unknown";

    if (paymentIntent.payment_method && paymentIntent.payment_method.card) {
      // Full card details available
      paymentMethodId = paymentIntent.payment_method.id;
      last4 = paymentIntent.payment_method.card.last4;
      brand = paymentIntent.payment_method.card.brand;
    } else {
      // Fallback: Retrieve manually
      paymentMethodId = paymentIntent.payment_method;
      const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
      last4 = pm?.card?.last4 || "0000";
      brand = pm?.card?.brand || "unknown";
    }

    // Save to Firestore
    await db.collection('users')
      .doc(userId)
      .collection('cardDetails')
      .doc('default')
      .set({
        paymentMethodId,
        brand,
        last4,
        lastUsed: new Date().toISOString(),
      }, { merge: true });

    console.log(`Card details saved for user: ${userId} (**** **** **** ${last4})`);

    res.json({ success: true, message: 'Card details saved successfully' });
  } catch (error) {
    console.error(' Error saving card details:', error);
    res.status(500).json({ success: false, error: 'Failed to save card details', details: error.message });
  }
});
const PORT = process.env.PORT || 5001;
app.listen(PORT, (err) => {
  if (err) {
    console.error(' Failed to start server:', err);
    return;
  }
  console.log(`Server running on http://localhost:${PORT}`);
});