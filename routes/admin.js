// routes/admin.js

const express = require('express');
const router = express.Router();
const conn = require('../dbConfig');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Image Upload Configuration
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// Admin Dashboard
router.get('/admin/dashboard', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/login');
  }
  res.render('admin/dashboard', { user: req.session.user });
});

// View Products
router.get('/admin/products', (req, res) => {
  const sql = `SELECT p.id, p.name, p.description, p.price, p.stock, p.image, c.name AS category_name 
    FROM products p LEFT JOIN categories c ON p.category_id = c.id order by p.created_at DESC`;
  conn.query(sql, (err, results) => {
    if (err) throw err;
    res.render('admin/products', { products: results });
  });
});

// Add Product (Form)
router.get('/admin/products/add', (req, res) => {
  conn.query('SELECT * FROM categories', (err, categories) => {
    if (err) throw err;
    res.render('admin/add-product', { categories });
  });
});

// Add Product (POST)
router.post('/admin/products/add', upload.single('image'), (req, res) => {
  const { name, description, category_id, price, stock } = req.body;
  const image = req.file.filename;
  const sql = `
    INSERT INTO products (name, description, category_id, price, stock, image) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  conn.query(sql, [name, description, category_id, price, stock, image], err => {
    if (err) throw err;
    res.redirect('/admin/products');
  });
});

// Edit Product (Form)
router.get('/admin/products/edit/:id', (req, res) => {
  const productId = req.params.id;
  conn.query('SELECT * FROM products WHERE id = ?', [productId], (err, productResults) => {
    if (err) throw err;
    if (productResults.length === 0) return res.send('Product not found');

    conn.query('SELECT * FROM categories', (err, categories) => {
      if (err) throw err;
      res.render('admin/edit-product', { product: productResults[0], categories });
    });
  });
});

// Edit Product (POST)
router.post('/admin/products/edit/:id', upload.single('image'), (req, res) => {
  const productId = req.params.id;
  const { name, description, category_id, price, stock } = req.body;

  let sql, data;
  if (req.file) {
    const image = req.file.filename;
    sql = `UPDATE products SET name = ?, description = ?, category_id = ?, price = ?, stock = ?, image = ? 
            WHERE id = ?`;
    data = [name, description, category_id, price, stock, image, productId];
  } else {
    sql = `UPDATE products SET name = ?, description = ?, category_id = ?, price = ?, stock = ? WHERE id = ?`;
    data = [name, description, category_id, price, productId];
  }

  conn.query(sql, data, err => {
    if (err) throw err;
    res.redirect('/admin/products');
  });
});

// Delete Product
router.get('/admin/products/delete/:id', (req, res) => {
  const productId = req.params.id;

  conn.query('SELECT image FROM products WHERE id = ?', [productId], (err, result) => {
    if (err) throw err;
    if (result.length === 0) return res.send('Product not found');

    const imageName = result[0].image;
    conn.query('DELETE FROM products WHERE id = ?', [productId], err => {
      if (err) throw err;

      const imagePath = path.join(__dirname, '../uploads', imageName);
      fs.unlink(imagePath, unlinkErr => {
        if (unlinkErr) console.warn('Image not deleted:', imageName);
        res.redirect('/admin/products');
      });
    });
  });
});

// View Categories
router.get('/admin/categories', (req, res) => {
  conn.query('SELECT * FROM categories', (err, results) => {
    if (err) throw err;
    res.render('admin/categories', {
      user: req.session.user,
      categories: results,
    });
  });
});

// Add Category (Form)
router.get('/admin/categories/add', (req, res) => {
  res.render('admin/add-category');
});

// Add Category (POST)
router.post('/admin/categories/add', (req, res) => {
  const { name } = req.body;
  const slug = slugify(name);
  conn.query('INSERT INTO categories (name, slug) VALUES (?, ?)', [name, slug], err => {
    if (err) throw err;
    res.redirect('/admin/categories');
  });
});

// Edit Category (Form)
router.get('/admin/categories/edit/:id', (req, res) => {
  conn.query('SELECT * FROM categories WHERE id = ?', [req.params.id], (err, results) => {
    if (err) throw err;
    if (results.length === 0) return res.send('Category not found');
    res.render('admin/edit-category', { category: results[0] });
  });
});

// Edit Category (POST)
router.post('/admin/categories/edit/:id', (req, res) => {
  const { name } = req.body;
  const slug = slugify(name);
  const id = req.params.id;
  conn.query('UPDATE categories SET name = ?, slug = ? WHERE id = ?', [name, slug, id], err => {
    if (err) throw err;
    res.redirect('/admin/categories');
  });
});

// Delete Category
router.get('/admin/categories/delete/:id', (req, res) => {
  conn.query('DELETE FROM categories WHERE id = ?', [req.params.id], err => {
    if (err) throw err;
    res.redirect('/admin/categories');
  });
});

// View Orders
router.get('/admin/orders', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/login');
  }

  const sql = `
    SELECT o.id, o.total_amount, o.payment_method, o.created_at, u.name 
    FROM orders o JOIN users u ON o.user_id = u.id
  `;
  conn.query(sql, (err, results) => {
    if (err) return res.send('Failed to fetch orders');
    res.render('admin/orders', { orders: results, current: 'orders' });
  });
});

// Order Details
router.get('/admin/order-details/:id', (req, res) => {
  const orderId = req.params.id;

  conn.query('SELECT * FROM orders WHERE id = ?', [orderId], (err, orderResult) => {
    if (err || orderResult.length === 0) return res.send('Order not found');
    const order = orderResult[0];

    const sql = `
      SELECT oi.quantity, p.name, p.price 
      FROM order_items oi 
      JOIN products p ON oi.product_id = p.id 
      WHERE oi.order_id = ?
    `;
    conn.query(sql, [orderId], (err2, items) => {
      if (err2) return res.send('Could not load items');
      res.render('admin/order-details', {
        order,
        items,
        message: req.query.message || null
      });
    });
  });
});

// Update Order
router.post('/admin/update-order/:id', (req, res) => {
  const { status, courier_name, tracking_number } = req.body;
  conn.query(
    `UPDATE orders SET status = ?, courier_name = ?, tracking_number = ? WHERE id = ?`,
    [status, courier_name, tracking_number, req.params.id],
    err => {
      if (err) return res.send('Failed to update order');
      res.redirect(`/admin/order-details/${req.params.id}?message=Order updated successfully`);
    }
  );
});

// View Users
router.get('/admin/users', (req, res) => {
  conn.query('SELECT id, name, email, role, created_at FROM users', (err, results) => {
    if (err) throw err;
    res.render('admin/users', { users: results });
  });
});

// Change User Role
router.post('/admin/users/:id/role', (req, res) => {
  const { role } = req.body;
  conn.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id], err => {
    if (err) throw err;
    res.redirect('/admin/users');
  });
});

// View User's Orders
router.get('/admin/users/:id/orders', (req, res) => {
  const userId = req.params.id;
  const sql = `
    SELECT o.id AS order_id, o.total_amount, o.status, o.created_at, o.tracking_number, 
           u.name AS user_name 
    FROM orders o 
    JOIN users u ON o.user_id = u.id 
    WHERE o.user_id = ?
  `;
  conn.query(sql, [userId], (err, orders) => {
    if (err) throw err;
    res.render('admin/user-orders', { orders, userId });
  });
});

// Messages
router.get('/admin/messages', (req, res) => {
  conn.query('SELECT * FROM messages ORDER BY created_at DESC', (err, results) => {
    if (err) return res.send('Error loading messages');
    res.render('admin/messages', { messages: results });
  });
});

router.post('/admin/messages/:id/reply', (req, res) => {
  const { reply } = req.body;
  conn.query('UPDATE messages SET reply = ? WHERE id = ?', [reply, req.params.id], err => {
    if (err) return res.send('Reply failed');
    res.redirect('/admin/messages');
  });
});

// Helper function
function slugify(text) {
  return text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
}

module.exports = router;
