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
  const guest = req.session.guest;


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
      res.render('checkout', { cart: cartResults, user, guest: null, total });
    });
  } else {
    const cart = req.session.cart || [];
    const total = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
    res.render('checkout', { cart, user: null,  guest: guest || null, total });
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
router.post('/checkout/place-order', (req, res) => {
  const user = req.session.user || null;
  const guest = req.session.guest || null;

  const {
    name: guestName,
    email: guestEmail,
    address,
    city,
    postal_code,
    payment_method,
  } = req.body;

  const isLoggedIn = user && user.id;
  const name = isLoggedIn ? user.name : (guestName || (guest && guest.name));
  const email = isLoggedIn ? user.email : (guestEmail || (guest && guest.email));
  const userId = isLoggedIn ? user.id : null;

  if (!name || !email || !address || !city || !postal_code || !payment_method) {
    return res.send('Please fill in all required fields.');
  }

  if (isLoggedIn) {
    // For logged-in user, fetch cart from database
    const sql = `
      SELECT c.product_id, c.quantity, p.price
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `;
    conn.query(sql, [userId], (err, cartItems) => {
      if (err) {
        console.error('Error fetching cart from DB:', err);
        return res.send('Error fetching cart.');
      }
      if (!cartItems.length) return res.send('Cart is empty.');

      const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const orderSql = `
        INSERT INTO orders
          (user_id, customer_name, email, address, city, postal_code, total_amount, payment_method, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      conn.query(orderSql, [userId, name, email, address, city, postal_code, total, payment_method], (err2, result) => {
        if (err2) {
          console.error('Order insert error:', err2);
          return res.send('Error placing order.');
        }

        const orderId = result.insertId;
        const itemsSql = `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?`;
        const itemsValues = cartItems.map(item => [
          orderId,
          item.product_id,
          item.quantity,
          item.price,
        ]);

        conn.query(itemsSql, [itemsValues], (err3) => {
          if (err3) {
            console.error('Order items insert error:', err3);
            return res.send('Error saving order items.');
          }

          // Clear DB cart after successful order
          conn.query('DELETE FROM cart WHERE user_id = ?', [userId], (err4) => {
            if (err4) {
              console.error('Error clearing cart:', err4);
              return res.send('Error clearing cart.');
            }

            res.send(`✅ Order placed successfully! Your order ID is ${orderId}`);
          });
        });
      });
    });

  } else {
    // Guest user: use cart from session
    const cart = req.session.cart || [];
    if (cart.length === 0) return res.send('Cart is empty.');

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const orderSql = `
      INSERT INTO orders
        (user_id, customer_name, email, address, city, postal_code, total_amount, payment_method, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    conn.query(orderSql, [null, name, email, address, city, postal_code, total, payment_method], (err, result) => {
      if (err) {
        console.error('Order insert error:', err);
        return res.send('Error placing order.');
      }

      const orderId = result.insertId;
      const itemsSql = `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?`;
      const itemsValues = cart.map(item => [
        orderId,
        item.product_id || item.id,
        item.quantity,
        item.price,
      ]);

      conn.query(itemsSql, [itemsValues], (err2) => {
        if (err2) {
          console.error('Order items insert error:', err2);
          return res.send('Error saving order items.');
        }

        // Clear session cart and guest info
        req.session.cart = [];
        req.session.guest = null;

        res.send(`✅ Guest order placed successfully! Your order ID is ${orderId}`);
      });
    });
  }
});


module.exports = router;
