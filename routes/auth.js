// routes/auth.js

const express = require('express');
const router = express.Router();
const conn = require('../dbConfig');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Register Page
router.get('/register', (req, res) => {
  res.render('register', { title: 'Register' });
});

// Register (POST)
router.post('/register', async (req, res) => {
let { name, email, password, address, city, postal_code, phone, DOB } = req.body;

  if (!email || !password || !name || !address || !city || !postal_code || !phone || !DOB) {
    return res.send('All fields required');
  }
  email = email.trim().toLowerCase();
  password = password.trim();
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const sql = `INSERT INTO users 
      (name, email, password, role, DOB, address, city, postal_code, phone, country) 
      VALUES (?, ?, ?, "customer", ?, ?, ?, ?, ?, "New Zealand")`;

    conn.query(sql, [name, email, hashedPassword, DOB, address, city, postal_code, phone], (err) => {
      if (err) {
        console.error('Register error:', err);
        return res.send('User already exists or DB error');
      }
      res.redirect('/login');
    });
  } catch (error) {
    console.error('Hashing error:', error);
    res.send('Internal server error');
  }
});


// Login Page
router.get('/login', (req, res) => {
  res.render('login');
});

// Login (POST)
router.post('/login', (req, res) => {
  let email = req.body.email;
  email = email.trim().toLowerCase();
  const password = req.body.password;
   const redirectUrl = req.body.redirect || '/dashboard';
  conn.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) {
      console.error('DB error:', err);
      return res.send('Database error');
    }

    if (results.length === 0) {
      console.warn('No user found with email:', email);
      return res.send('Invalid email or password');
    }

    const user = results[0];

    try {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        req.session.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        };
        return res.redirect(redirectUrl);
      } else {
        return res.send('Invalid email or password');
      }
    } catch (compareError) {
      console.error('Compare error:', compareError);
      res.send('Internal server error');
    }
  });
});


// Dashboard Redirect
router.get('/dashboard', (req, res) => {
  const user = req.session.user;
  if (!user) return res.redirect('/login');

  return res.redirect(user.role === 'admin' ? '/admin/dashboard' : '/customer-dashboard');
});
//forgot password
router.get('/forgot-password', (req, res) => {
  res.render('forgot-password'); // Create this view
});
// Forgot Password (POST)
router.post('/forgot-password', (req, res) => {
  const email = req.body.email.trim().toLowerCase();
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 3600000); // 1 hour

  const sql = 'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?';
  conn.query(sql, [token, expiry, email], (err, result) => {
    if (err) {
      console.error('Token update error:', err);
      return res.send('Something went wrong.');
    }

    if (result.affectedRows === 0) {
      return res.send('No account with that email.');
    }

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'silverjewellerywellington@gmail.com',        // ✅ Replace
        pass: 'vwix yhqs psen cfrp',                        // ✅ Use App Password
      },
    });

    const resetLink = `http://localhost:3000/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    const mailOptions = {
      to: email,
      from: 'youremail@gmail.com',
      subject: 'Password Reset for Silver Elegance',
      html: `<p>Click below to reset your password:</p><a href="${resetLink}">${resetLink}</a>`,
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.error('Email error:', err);
        return res.send('Email failed to send.');
      }
      res.render('forgot-password', {message: 'Check your email for the reset link.', email : ''});
    });
  });
});

// Reset Password Page
router.get('/reset-password', (req, res) => {
  const { token, email } = req.query;
  if (!token || !email) return res.send('Invalid link.');

  const sql = 'SELECT * FROM users WHERE email = ? AND reset_token = ? AND reset_token_expiry > NOW()';
  conn.query(sql, [email, token], (err, results) => {
    if (err || results.length === 0) return res.send('Token expired or invalid.');

    res.render('reset-password', { email, token }); // EJS form
  });
});
// Reset Password (POST)

router.post('/reset-password', async (req, res) => {
  const { email, token, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 12);

  const sql = `
    UPDATE users 
    SET password = ?, reset_token = NULL, reset_token_expiry = NULL 
    WHERE email = ? AND reset_token = ? AND reset_token_expiry > NOW()
  `;

  conn.query(sql, [hashedPassword, email, token], (err, result) => {
    if (err || result.affectedRows === 0) {
      return res.send('Invalid or expired token.');
    }

    res.render('reset-password', {
  email: null,
  token: null,
  message: '✅ Password successfully updated. <a href="/login" class="alert-link">Login now</a>.',
  success: true});
  });
});

// Terms and Conditions Page
router.get('/terms&condition', (req, res) => {
  res.render('terms&condition', { title: 'Terms and Conditions' });
});
// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
