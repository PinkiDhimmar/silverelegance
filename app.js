// app.js
// Node.js Silver Elegance Web Application
// Author: Pinki Dhimmar
// Date created: 20 June 2025

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
//const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');

const app = express();
const conn = require('./dbConfig');

require('dotenv').config();

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
  secret: 'yoursecret',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 86400000 } // 1 day
}));

// Static assets
app.use('/public', express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use('/public', express.static(path.join(__dirname, 'public')));


//Make conn available in all routes
app.use((req, res, next) => {
  req.conn = conn; // ✅ Make conn available in all routes
  next();
});
// Pass session and user to all views
app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.user = req.session.user || null;
  next();
});

// pass cart to all views via middleware------navbar count 
app.use((req, res, next) => {
  const user = req.session.user;
  res.locals.user = user;

  if (user && user.id) {
    // 1. CART COUNT
    const cartSql = 'SELECT SUM(quantity) AS total FROM cart WHERE user_id = ?';
    conn.query(cartSql, [user.id], (err, cartResults) => {
      res.locals.cartCount = (cartResults && cartResults[0].total) || 0;

      // 2. WISHLIST COUNT
      const wishlistSql = 'SELECT COUNT(*) AS total FROM wishlist WHERE user_id = ?';
      conn.query(wishlistSql, [user.id], (err2, wishResults) => {
        res.locals.wishlistCount = (wishResults && wishResults[0].total) || 0;
        next();
    });
    });
  } else {
    // Guest user: cart from session
    const cart = req.session.cart || [];
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    res.locals.cartCount = totalQty;
    res.locals.wishlistCount = 0; // No wishlist for guest users
    next();
  }
});



// Load categories for navbar
app.use((req, res, next) => {
  conn.query('SELECT name, slug FROM categories', (err, results) => {
    if (err) return next(err);
    res.locals.categories = results || [];
    next();
  });
});

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const customerRoutes = require('./routes/customer');
const cartRoutes = require('./routes/cart');
const wishlistRoutes = require('./routes/wishlist');
const checkoutRoutes = require('./routes/checkout');
const productsRoutes = require('./routes/products');
const contactRoutes = require('./routes/contact');
const searchRoutes = require('./routes/search');
const saleRoutes = require('./routes/sale');

// Use routes
app.use(authRoutes);
app.use(adminRoutes);
app.use(customerRoutes);
app.use(cartRoutes);
app.use(wishlistRoutes);
app.use(checkoutRoutes);
app.use(productsRoutes);
app.use(contactRoutes);
app.use(searchRoutes);
app.use(saleRoutes);

// Home page
app.get('/', (req, res) => {
  const newProductSql = `SELECT * FROM products
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    ORDER BY created_at DESC
    LIMIT 8`;

  conn.query(newProductSql, (err, newProducts) => {
    if (err) throw err;

    res.render('home', {
      newProducts
    });
  });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Start server
app.listen(3000, () => console.log('Server running at port 3000'));
