const express = require('express');
const router = express.Router();
const conn = require('../dbConfig');

router.get('/sale', (req, res) => {
  const now = new Date();
  const sql = `
    SELECT * FROM products
    WHERE is_special_active = 1 AND special_ends_on > ?
    ORDER BY special_ends_on ASC
  `;
  conn.query(sql, [now], (err, results) => {
    if (err) throw err;
    res.render('sale', { specials: results });
  });
});
module.exports = router;