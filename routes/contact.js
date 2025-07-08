const express = require('express');
const router = express.Router();
const conn = require('../dbConfig');

// Show contact form with optional message
router.get('/contact', (req, res) => {
  res.render('contact', { msg: req.query.msg || null });
});

// Handle contact form submission
router.post('/contact', (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.redirect('/contact?msg=' + encodeURIComponent('Please fill in all fields.'));
  }

  const sql = 'INSERT INTO messages (name, email, message) VALUES (?, ?, ?)';
  conn.query(sql, [name, email, message], (err) => {
    if (err) {
      console.error('Contact form insert error:', err);
      return res.redirect('/contact?msg=' + encodeURIComponent('Error sending message.'));
    }

    res.redirect('/contact?msg=' + encodeURIComponent('Message sent successfully!'));
  });
});

module.exports = router;
