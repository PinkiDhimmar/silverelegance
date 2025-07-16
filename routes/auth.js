// routes/auth.js

const express = require('express');
const router = express.Router();
const conn = require('../dbConfig');
const bcrypt = require('bcrypt');

// Register Page
router.get('/register', (req, res) => {
  res.render('register', { title: 'Register' });
});

// Register (POST)
router.post('/register', async (req, res) => {
  const { name, email, password, address, city, postal_code, phone, DOB } = req.body;

  if (!email || !password || !name || !address || !city || !postal_code || !phone || !DOB) {
    return res.send('All fields required');
  }

  const hashedPassword = await bcrypt.hash(password, 12); // 🔐 Hash password

  const sql = 'INSERT INTO users (name, email, password, role, DOB, address, city, postal_code, phone, country) VALUES (?, ?, ?, "customer", ?, ?, ?, ?, ?, "New Zealand")';
  conn.query(sql, [name, email, hashedPassword, DOB, address, city, postal_code, phone], (err) => {
    if (err) {
      console.error('Register error:', err);
      return res.send('User already exists or DB error');
    }
    res.redirect('/login');
  });
});


// Login Page
router.get('/login', (req, res) => {
  res.render('login');
});

// Login (POST)
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  conn.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.send('Database error');

    if (results.length === 0) {
      return res.send('Invalid email or password');
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };
      return res.redirect('/dashboard');
    } else {
      return res.send('Invalid email or password');
    }
  });
});

// Dashboard Redirect
router.get('/dashboard', (req, res) => {
  const user = req.session.user;
  if (!user) return res.redirect('/login');

  return res.redirect(user.role === 'admin' ? '/admin/dashboard' : '/customer-dashboard');
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
