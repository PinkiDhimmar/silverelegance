const express = require('express');
const router = express.Router();
const conn = require('../dbConfig');
const bcrypt = require('bcrypt');

// Middleware to ensure user is a logged-in customer
function ensureCustomer(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'customer') {
    return res.redirect('/login');
  }
  next();
}

// Customer Dashboard
router.get('/customer-dashboard', ensureCustomer, (req, res) => {
  const userId = req.session.user.id;

  conn.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
    if (err || results.length === 0) return res.send('User not found.');

    res.render('customer-dashboard', {
      user: results[0],
      message: req.query.message || null,
      current: 'dashboard'
    });
  });
});

// Update Customer Profile
router.post('/update-profile', ensureCustomer, (req, res) => {
  const { id, name, email, phone } = req.body;

  const sql = `UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?`;
  conn.query(sql, [name, email, phone, id], (err) => {
    if (err) return res.send('Error updating profile');
    res.redirect('/customer-dashboard');
  });
});

// View Orders
router.get('/customer/myorder', ensureCustomer, (req, res) => {
  const userId = req.session.user.id;

  conn.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, orders) => {
    if (err) return res.send('Error fetching orders');

    res.render('customer/myorder', {
      user: req.session.user,
      orders,
      current: 'orders'
    });
  });
});

// View Order Details
router.get('/customer/order-details/:id', ensureCustomer, (req, res) => {
  const orderId = req.params.id;
  const userId = req.session.user.id;

  conn.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId], (err, orderResult) => {
    if (err || orderResult.length === 0) return res.send('Order not found or unauthorized.');

    const order = orderResult[0];
    const sql = `
      SELECT order_items.quantity, products.name, products.price, products.image 
      FROM order_items 
      JOIN products ON order_items.product_id = products.id 
      WHERE order_items.order_id = ?
    `;
    conn.query(sql, [orderId], (err2, items) => {
      if (err2) return res.send('Error loading order items');

      res.render('customer/order-details', {
        order,
        items,
        current: 'orders'
      });
    });
  });
});

// View/Edit Address
router.get('/customer/address', ensureCustomer, (req, res) => {
  const userId = req.session.user.id;

  const sql = 'SELECT address, city, postal_code, country FROM users WHERE id = ?';
  conn.query(sql, [userId], (err, results) => {
    if (err) throw err;
  if (results.length === 0) {
      return res.redirect('/customer/dashboard?error=' + encodeURIComponent('User not found.'));
    }
    res.render('customer/address', {
      user: results[0],
      message: req.query.message || null,
      current: 'address'
    });
  });
});

router.post('/customer/update-address', ensureCustomer, (req, res) => {
  const userId = req.session.user.id;
  const { address, city, postal_code, country } = req.body;

  conn.query('UPDATE users SET address=?, city=?, postal_code=?, country=? WHERE id=?',
    [address, city, postal_code, country, userId],
    (err) => {
      if (err) return res.send('Failed to update address');
      res.redirect('/customer/address?message=' + encodeURIComponent('Address updated successfully.'));
    }
  );
});

// Change Password
router.get('/customer/change-password', ensureCustomer, (req, res) => {
  res.render('customer/change-password', {
    message: req.query.message || null,
    error: req.query.error || null,
    current: 'password'
  });
});

router.post('/customer/change-password', ensureCustomer, (req, res) => {
  const userId = req.session.user.id;
  const { current_password, new_password, confirm_password } = req.body;

  if (new_password !== confirm_password) {
    return res.redirect('/customer/change-password?error=' + encodeURIComponent('New passwords do not match.'));
  }

  conn.query('SELECT password FROM users WHERE id = ?', [userId], (err, results) => {
    if (err || results.length === 0) {
      return res.redirect('/customer/change-password?error=' + encodeURIComponent('User not found.'));
    }

    const passwordFromDB = results[0].password;

    // Plain text password check
    if (current_password !== passwordFromDB) {
      return res.redirect('/customer/change-password?error=' + encodeURIComponent('Current password is incorrect.'));
    }

    // Update password directly (no hashing)
    conn.query('UPDATE users SET password = ? WHERE id = ?', [new_password, userId], (err2) => {
      if (err2) {
        return res.redirect('/customer/change-password?error=' + encodeURIComponent('Failed to update password.'));
      }

      res.redirect('/customer/change-password?message=' + encodeURIComponent('Password updated successfully.'));
    });
  });
});



module.exports = router;
