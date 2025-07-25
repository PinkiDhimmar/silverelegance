const express = require('express');
const router = express.Router();
const conn = require('../dbConfig');

// Get products by category slug
router.get('/products/:slug', (req, res, next) => {
  const slug = req.params.slug;

  const sql = ` SELECT products.*, categories.name AS category_name,
                CASE 
                  WHEN products.is_special_active = 1 AND products.discount_percent > 0
                  THEN ROUND(products.price - (products.price * products.discount_percent / 100), 2)
                  ELSE products.price
                END AS discountedPrice
              FROM products
              JOIN categories ON products.category_id = categories.id
              WHERE categories.slug = ?`;

  conn.query(sql, [slug], (err, results) => {
    if (err) return next(err);

    results.forEach(p => {
      p.price = Number(p.price) || 0;
      p.discountedPrice = Number(p.discountedPrice) || 0;
    });

    res.render('products-by-category', {
      categorySlug: slug,
      products: results
    });
  });
});

// Product detail page - fetch product by id
router.get('/product/:id', (req, res, next) => {
  const productId = req.params.id;

  const sql = `SELECT products.*, categories.name AS category_name,
                CASE 
                WHEN products.is_special_active = 1 AND products.discount_percent > 0 THEN 
                 ROUND(products.price - (products.price * products.discount_percent / 100), 2)
                ELSE products.price END AS display_price
                FROM products
                JOIN categories ON products.category_id = categories.id WHERE products.id = ?`;


  conn.query(sql, [productId], (err, results) => {
    if (err) return next(err);

    if (results.length === 0) {
      return res.status(404).send('Product not found');
    }

    res.render('product-detail', {
      product: results[0]
    });
  });
});

module.exports = router;
