const express = require('express');
const router = express.Router();
const conn = require('../dbConfig');

router.get('/search', (req, res) => {
  const searchTerm = req.query.q;

  if (!searchTerm) {
    return res.redirect('/');
  }

  const sql = `
    SELECT * FROM products
    WHERE name LIKE ? OR description LIKE ?
  `;
  const likeTerm = `%${searchTerm}%`;

  conn.query(sql, [likeTerm, likeTerm], (err, results) => {
    if (err) {
      console.error('Search error:', err);
      return res.send('Search failed.');
    }

    res.render('search-results', {
      title: `Search Results for "${searchTerm}"`,
      results,
      searchTerm
    });
  });
});

module.exports = router;
