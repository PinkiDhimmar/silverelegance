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
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) return res.send('Missing credentials');

  const sql = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "customer")';
  conn.query(sql, [name, email, password], (err) => {
    if (err) throw err;
    res.render('login');
  });
});

// Login Page
router.get('/login', (req, res) => {
  res.render('login');
});

// Login (POST)
router.post('/login', (req, res) => {
  const { email, password, redirect = '/dashboard' } = req.body;

  conn.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.send('DB error');

    const user = results[0];
    if (user && user.password === password) {
      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };
      return res.redirect(redirect);
    } else {
      return res.send('Invalid login');
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
