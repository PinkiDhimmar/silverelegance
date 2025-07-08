// routes/checkout.js
const express = require('express');
const router = express.Router();
const conn = require('../dbConfig');

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

  if (user && user.id) {
    const sql = `
      SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.image
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `;
    conn.query(sql, [user.id], (err, cartResults) => {
      if (err) {
        console.error('Checkout DB error:', err);
        return res.send('Checkout error');
      }

      const total = cartResults.reduce((sum, item) => sum + item.quantity * item.price, 0);
      res.render('checkout', { cart: cartResults, user, total });
    });
  } else {
    const cart = req.session.cart || [];
    const total = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
    res.render('checkout', { cart, user: null, total });
  }
});



// POST: Guest checkout (sets session user temporarily)
router.post('/checkout/guest', (req, res) => {
  const { name, email, address } = req.body;
  req.session.user = {
    name,
    email,
    address,
    isGuest: true
  };
  res.redirect('/checkout');
});

// POST: Guest or user places order (session cart)
router.post('/checkout', (req, res) => {
  const cart = req.session.cart;
  const user = req.session.user;
  const { address, city, postal } = req.body;

  if (!user || !cart || cart.length === 0) {
    return res.send('Login required and cart must not be empty.');
  }

  const name = user.name;
  const email = user.email;
  const userId = user.id || null;
  const total = calculateTotal(cart);

  const orderSql = `
    INSERT INTO orders (user_id, customer_name, email, address, city, postal, total_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  conn.query(orderSql, [userId, name, email, address, city, postal, total], (err, result) => {
    if (err) return res.send('Error saving order.');

    const orderId = result.insertId;
    const itemsSql = `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?`;

    // Note: session cart item structure must include `product_id`
    const itemValues = cart.map(item => [orderId, item.product_id || item.id, item.quantity, item.price]);

    conn.query(itemsSql, [itemValues], (err2) => {
      if (err2) return res.send('Error saving order items');

      req.session.cart = [];
      res.send(`✅ Order placed successfully. Your order ID is ${orderId}`);
    });
  });
});

// POST: Logged-in user places order (database cart)
router.post('/checkout/place-order', isLoggedIn, (req, res) => {
  const user = req.session.user;
  const userId = user.id;
  const { address, city, postal_code, payment_method } = req.body;

  const cartSql = `
    SELECT c.product_id, c.quantity, p.price
    FROM cart c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
  `;
  conn.query(cartSql, [userId], (err, cartItems) => {
    if (err) return res.send('Error fetching cart items');
    if (cartItems.length === 0) return res.send('Cart is empty');

    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderSql = `
      INSERT INTO orders (user_id, customer_name, email, address, city, postal, total_amount, payment_method, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    conn.query(orderSql, [userId, user.name, user.email, address, city, postal_code, total, payment_method], (err2, result) => {
      if (err2) return res.send('Error creating order');

      const orderId = result.insertId;
      const itemsSql = `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?`;
      const itemsValues = cartItems.map(i => [orderId, i.product_id, i.quantity, i.price]);

      conn.query(itemsSql, [itemsValues], (err3) => {
        if (err3) return res.send('Error saving order items');

        conn.query('DELETE FROM cart WHERE user_id = ?', [userId], (err4) => {
          if (err4) return res.send('Error clearing cart after order');
          res.send(`✅ Order placed successfully! Your Order ID: ${orderId}`);
        });
      });
    });
  });
});

module.exports = router;
