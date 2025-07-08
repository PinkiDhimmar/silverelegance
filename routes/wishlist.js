const express = require('express');
const router = express.Router();
const conn = require('../dbConfig');

// Middleware: ensure user logged in
function requireLogin(req, res, next) {
  if (!req.session.user || !req.session.user.id) {
    return res.redirect('/login?redirect=/wishlist');
  }
  next();
}

// View wishlist
router.get('/wishlist', requireLogin, (req, res) => {
  const userId = req.session.user.id;

  const sql = `
    SELECT w.id AS wishlist_id, p.*
    FROM wishlist w
    JOIN products p ON w.product_id = p.id
    WHERE w.user_id = ?
    ORDER BY w.created_at DESC
  `;

  conn.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching wishlist:', err);
      return res.render('wishlist', {
        wishlist: [],
        user: req.session.user,
        message: 'Error loading wishlist'
      });
    }
console.log('Wishlist Results:', Array.isArray(results), results);
    res.render('wishlist', {
      wishlist: results || [],
      user: req.session.user,
      message: req.query.message || null
    });
  });
});

// Add item to wishlist
router.post('/wishlist/add', (req, res) => {
  const user = req.session.user;
  if (!user) return res.redirect('/login');

  const productId = parseInt(req.body.product_id, 10);
  if (!productId) return res.status(400).send('Invalid product ID');

  const sql = `INSERT INTO wishlist (user_id, product_id, created_at) VALUES (?, ?, NOW())`;
  conn.query(sql, [user.id, productId], (err, results) => {
    if (err) {
      console.error('Wishlist insert error:', err);
      return res.send('Error adding to wishlist');
    }
        res.render('wishlist', {
        wishlist: results,
        user: req.session.user,
        message: req.query.message || null 
        });

  });
});

// Remove item from wishlist
router.post('/wishlist/remove/:id', requireLogin, (req, res) => {
  const wishlistId = req.params.id;
  const userId = req.session.user.id;

  const deleteSql = 'DELETE FROM wishlist WHERE id = ? AND user_id = ?';
  conn.query(deleteSql, [wishlistId, userId], (err) => {
    if (err) {
      console.error('Error deleting wishlist item:', err);
      return res.send('Error removing item');
    }
    res.redirect('/wishlist');
  });
});

// Move item from cart to wishlist
router.post('/cart/wishlist/:productId', (req, res) => {
  const user = req.session.user;
  const productId = req.params.productId;

  if (!user) return res.redirect('/login');

  // 1. Add to wishlist
  const insertWishlist = `INSERT INTO wishlist (user_id, product_id, created_at) VALUES (?, ?, NOW())`;

  conn.query(insertWishlist, [user.id, productId], (err) => {
    if (err) return res.send('Error adding to wishlist');

    // 2. Remove from cart
    const deleteCart = `DELETE FROM cart WHERE user_id = ? AND product_id = ?`;
    conn.query(deleteCart, [user.id, productId], (err2) => {
      if (err2) return res.send('Error removing from cart');
      res.redirect('/checkout?moved=1'); // optional message
    });
  });
});

module.exports = router;
