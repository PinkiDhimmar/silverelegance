// routes/cart.js
const express = require('express');
const router = express.Router();
const conn = require('../dbConfig');

// Utility: Init session cart
function initSessionCart(req) {
  if (!req.session.cart) {
    req.session.cart = [];
  }
}

// Add to cart (POST)
router.post('/cart/add', (req, res) => {
  const { productId, name, price, discountedPrice, quantity, image, code, is_special_active, discount_percent } = req.body;

  const id = parseInt(productId, 10);
  const qty = parseInt(quantity, 10);
  const parsedPrice = parseFloat(price);
  const parsedDiscountedPrice = parseFloat(discountedPrice);
  const user = req.session.user;

  if (!id || !name || isNaN(parsedPrice) || !qty || qty < 1 || !image) {
    return res.status(400).send('Invalid product data');
  }

  if (user && user.id) {
    const checkSql = 'SELECT * FROM cart WHERE user_id = ? AND product_id = ?';
    conn.query(checkSql, [user.id, id], (err, results) => {
      if (err) return res.send('DB error');

      if (results.length > 0) {
        const newQty = results[0].quantity + qty;
        const updateSql = 'UPDATE cart SET quantity = ? WHERE id = ?';
        conn.query(updateSql, [newQty, results[0].id], () => {
          return res.redirect('/checkout');
        });
      } else {
        const insertSql = 'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)';
        conn.query(insertSql, [user.id, id, qty], () => {
          return res.redirect('/cart');
        });
      }
    });
  } else {
    initSessionCart(req);

    const existing = req.session.cart.find(item => item.id === id);
    const special = is_special_active === '1' || is_special_active === 1 || is_special_active === true;

    const finalDiscountPercent = parseFloat(discount_percent) || 0;
    const originalPrice = parsedPrice;
    const discountPrice = (special && finalDiscountPercent > 0)
      ? parseFloat((originalPrice - (originalPrice * finalDiscountPercent / 100)).toFixed(2))
      : parsedDiscountedPrice || originalPrice;

    if (existing) {
      existing.quantity += qty;
    } else {
      req.session.cart.push({
        id,
        name,
        quantity: qty,
        price: discountPrice,
        original_price: originalPrice,
        discount_percent: finalDiscountPercent,
        is_special_active: special,
        code: code || '',
        image
      });
    }

    res.redirect('/cart');
  }
});


// Remove item from cart (POST)
router.post('/cart/remove/:id', (req, res) => {
  const itemId = parseInt(req.params.id, 10);
  const user = req.session.user;

  if (user && user.id) {
    // Logged-in user → remove from database cart
    const sql = 'DELETE FROM cart WHERE id = ? AND user_id = ?';
    conn.query(sql, [itemId, user.id], (err) => {
      if (err) {
        console.error('DB cart remove error:', err);
        return res.status(500).send('Error removing item from cart');
      }
      return res.redirect('/cart');
    });
  } else {
    // Guest user → remove from session cart
    if (!req.session.cart) req.session.cart = [];

    req.session.cart = req.session.cart.filter(item => item.id !== itemId);
    return res.redirect('/checkout');
  }
});


// Remove item from session cart
router.post('/cart/remove', (req, res) => {
  const productId = parseInt(req.body.productId, 10);
  if (req.session.cart) {
    req.session.cart = req.session.cart.filter(p => p.id !== productId);
  }
  res.redirect('/cart');
});

// View cart (only for guest — DB users go to /checkout)
router.get('/cart', (req, res) => {
  const user = req.session.user;

  if (user && user.id) {
    const sql = `SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.price AS original_price, p.image,
             p.is_special_active, p.discount_percent,
             CASE 
               WHEN p.is_special_active = 1 AND p.discount_percent > 0 
               THEN ROUND(p.price - (p.price * p.discount_percent / 100), 2)
               ELSE p.price
             END AS discountedPrice
            FROM cart c 
            JOIN products p ON c.product_id = p.id 
            WHERE c.user_id = ?`;
    conn.query(sql, [user.id], (err, results) => {
      if (err) {
        console.error('DB Cart Load Error:', err);
        return res.send('Error loading cart');
      }
        // Ensure numeric consistency
      results.forEach(item => {
        item.price = Number(item.price) || 0;
        item.quantity = parseInt(item.quantity, 10) || 1;
        item.original_price = parseFloat(item.original_price) || 0;
        item.discountedPrice = parseFloat(item.discountedPrice) || item.original_price;
      });
  res.render('cart',{ cart: results || [], user });
    });
        
  } else {
    const cart = req.session.cart || [];

     cart.forEach(item => {
       item.price = Number(item.price) || 0;
        item.discount_percent = parseFloat(item.discount_percent) || 0;
        item.quantity = parseInt(item.quantity, 10) || 1;
        item.original_price = item.price;
      if (item.is_special_active && item.discount_percent > 0) {
        item.discountedPrice = parseFloat(
          (item.price - (item.price * item.discount_percent / 100)).toFixed(2)
        );
      } else {
        item.discountedPrice = item.price;
      }
    });
    res.render('cart', { cart, user: null });
  }
});


// Update quantity of a cart item
router.post('/cart/update/:id', (req, res) => {
  const user = req.session.user;
  const cartId = parseInt(req.params.id);
  const action = req.body.action;
  const userQty = parseInt(req.body.quantity);

  if (!cartId || isNaN(userQty) || userQty < 1) return res.redirect('/cart');

  if (user && user.id) {
    // Logged-in users (update DB)
    const getSql = 'SELECT * FROM cart WHERE id = ? AND user_id = ?';
    conn.query(getSql, [cartId, user.id], (err, results) => {
      if (err || results.length === 0) return res.redirect('/cart');

      let newQty = results[0].quantity;

      if (action === 'increase') newQty++;
      else if (action === 'decrease') newQty = Math.max(1, newQty - 1);
      else newQty = userQty;

      const updateSql = 'UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?';
      conn.query(updateSql, [newQty, cartId, user.id], () => res.redirect('/cart'));
    });
  } else {
    // Guest users (session cart)
    const cart = req.session.cart || [];
    const item = cart.find(i => i.id === cartId);
    if (!item) return res.redirect('/cart');

    if (action === 'increase') item.quantity++;
    else if (action === 'decrease') item.quantity = Math.max(1, item.quantity - 1);
    else item.quantity = userQty;

    res.redirect('/cart');
  }
});

module.exports = router;
