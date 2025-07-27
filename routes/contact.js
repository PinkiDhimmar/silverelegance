const express = require('express');
const router = express.Router();
const conn = require('../dbConfig');

// Show contact form with optional message
router.get('/contact', (req, res) => {
  res.render('contact', { msg: req.query.msg || null });
});

// Handle contact form submission
router.post('/contact', (req, res) => {
  const { name, email,subject, message } = req.body;

  if (!name || !email ||!subject || !message) {
    return res.redirect('/contact?msg=' + encodeURIComponent('Please fill in all fields.'));
  }

  const sql = 'INSERT INTO messages (name, email,subject, message) VALUES (?, ?, ?, ?)';
  conn.query(sql, [name, email,subject, message], (err) => {
    if (err) {
      console.error('Contact form insert error:', err);
      return res.redirect('/contact?msg=' + encodeURIComponent('Error sending message.'));
    }

    res.redirect('/contact?msg=' + encodeURIComponent('Thank you for contacting us. We will get back to you soon.'));
  });
});

module.exports = router;
