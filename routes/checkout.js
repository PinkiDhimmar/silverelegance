// routes/checkout.js
const express = require('express');
const router = express.Router();
const conn = require('../dbConfig');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Utility to calculate total
function calculateTotal(cart) {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// Middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/login?redirect=/checkout');
}

// GET: Checkout page
router.get('/checkout', (req, res) => {
  const user = req.session.user;
  const guest = req.session.guest;

  if (user && user.id) {
    const sql = `
      SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.image,
             p.is_special_active, p.discount_percent
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `;
    conn.query(sql, [user.id], (err, cartResults) => {
      if (err) {
        console.error('Checkout DB error:', err);
        return res.send('Checkout error');
      }

      // Calculate discountedPrice
      cartResults.forEach(item => {
        if (item.is_special_active && item.discount_percent > 0) {
          item.discountedPrice = +(item.price - (item.price * item.discount_percent / 100)).toFixed(2);
        } else {
          item.discountedPrice = item.price;
        }
      });

      // Total using discounted price
      const total = cartResults.reduce((sum, item) => {
        return sum + item.quantity * item.discountedPrice;
      }, 0);

      res.render('checkout', { cart: cartResults, user, guest: null, total });
    });
  } else {
    const cart = req.session.cart || [];

    // Discounted price for session cart
    cart.forEach(item => {
      if (item.is_special_active && item.discount_percent > 0) {
        item.discountedPrice = +(item.price - (item.price * item.discount_percent / 100)).toFixed(2);
      } else {
        item.discountedPrice = item.price;
      }
    });

    const total = cart.reduce((sum, item) => sum + item.quantity * item.discountedPrice, 0);
    res.render('checkout', { cart, user: null, guest: guest || null, total });
  }
});


// POST: Guest checkout (sets session user temporarily)
router.post('/checkout/guest', (req, res) => {
  const { name, email, address } = req.body;
  req.session.guest = {
    name,
    email,
    address
  };
  res.redirect('/checkout');
});

// POST: Guest or user places order (session cart)


// POST: Logged-in user places order (database cart)
router.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body;

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY not configured');
    return res.status(500).json({ error: 'Stripe not configured.' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // Make sure this is a number like 1000 (for $10.00)
      currency: 'nzd',
      automatic_payment_methods: { enabled: true },
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: 'Failed to create payment intent.' });
  }
});


// Place Order (after Stripe payment succeeds)
router.post('/checkout/place-order', async (req, res) => {
  const user = req.session.user || null;
  const guest = req.session.guest || null;

  const {
    name: guestName,
    email: guestEmail,
    address,
    city,
    postal_code,
    payment_method,
    stripePaymentIntentId,
    shipping_method,
    courier_fee
  } = req.body;

  const isLoggedIn = user && user.id;
  const name = isLoggedIn ? user.name : (guestName || (guest && guest.name));
  const email = isLoggedIn ? user.email : (guestEmail || (guest && guest.email));
  const userId = isLoggedIn ? user.id : null;
console.log('Form body:', req.body);
  if (!name || !email || !payment_method || !stripePaymentIntentId || !shipping_method) {
    return res.send('Please fill in all required fields.');
  }


  if (shipping_method === 'ship') {
    if (!address || !city || !postal_code) {
      return res.send('Please fill in all required shipping address fields.');
    }
  }
  const parsedCourierFee = parseFloat(courier_fee || 0);
  let paymentStatus = 'pending';
  let paymentId = null;
  let paymentDetails = null;

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);
    paymentStatus = paymentIntent.status;
    paymentId = paymentIntent.id;
    paymentDetails = JSON.stringify(paymentIntent);
  } catch (err) {
    console.error('Stripe verification failed:', err);
    return res.send('Payment verification failed.');
  }

  const cartPromise = isLoggedIn
    ? new Promise((resolve, reject) => {
        const sql = `SELECT c.product_id, c.quantity, p.price, p.discount_percent, p.is_special_active
          FROM cart c
          JOIN products p ON c.product_id = p.id
          WHERE c.user_id = ?`;
        conn.query(sql, [userId], (err, result) => {
          if (err) return reject(err);
           result.forEach(item => {
            if (item.is_special_active && item.discount_percent > 0) {
              item.discountedPrice = +(item.price - (item.price * item.discount_percent / 100)).toFixed(2);
            } else {
              item.discountedPrice = item.price;
            }
          });
          resolve(result);
        });
      })
    : Promise.resolve(req.session.cart || []);

  try {
    const cartItems = await cartPromise;
    if (!cartItems.length) return res.send('Cart is empty.');

    const total = cartItems.reduce((sum, item) => sum + item.discountedPrice * item.quantity, 0);

    const orderSql = `
      INSERT INTO orders (user_id, customer_name, email, address, city, postal_code, total_amount, courier_fee,
        payment_method, status, payment_id, payment_details, shipping_method, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

    const orderParams = [
      userId,
      name,
      email,
      address,
      city,
      postal_code,
      total,
      parsedCourierFee,
      payment_method,
      paymentStatus,
      paymentId,
      paymentDetails,
      shipping_method
    ];

    conn.query(orderSql, orderParams, (err2, result) => {
      if (err2) {
        console.error('Order insert error:', err2);
        return res.send('Error placing order.');
      }

      const orderId = result.insertId;
      const itemsSql = `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?`;
      const itemsValues = cartItems.map(item => [
        orderId,
        item.product_id || item.id,
        item.quantity,
        item.price,
      ]);

      conn.query(itemsSql, [itemsValues], (err3) => {
        if (err3) {
          console.error('Order items insert error:', err3);
          return res.send('Error saving order items.');
        }

        // Clear cart
        if (isLoggedIn) {
          conn.query('DELETE FROM cart WHERE user_id = ?', [userId], (err4) => {
            if (err4) {
              console.error('Error clearing cart:', err4);
              return res.send('Error clearing cart.');
            }
            res.redirect(`/checkout/success?orderId=${orderId}`);
          });
        } else {
          req.session.cart = [];
          req.session.guest = null;
          res.redirect(`/checkout/success?orderId=${orderId}`);
        }
      });
    });
  } catch (err) {
    console.error('Checkout error:', err);
    return res.send('An error occurred during checkout.');
  }
});


router.get('/checkout/success', (req, res) => {
  res.render('checkout-success'); // Make sure this EJS view exists
});

module.exports = router;
