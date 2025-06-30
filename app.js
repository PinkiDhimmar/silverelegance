//Node.js silver elegance web application
//Author: Pinki DHimmar
//Date created: 20 June 2025

//This line uses the require function to include the express module.
var express = require('express');
//This line creates an instance called app in the express application.
var app = express();

//This line uses the require function to include the express-session module.
var session = require('express-session');
const bcrypt = require('bcrypt');

//This line contains the configuration to connect the database.
var conn = require('./dbConfig');

// multer is used for uploaded image
const multer = require('multer');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, file.originalname),
});

const upload = multer({ storage });
//end multer

var bodyParser = require('body-parser');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//app.use(rolesRoutes);	

//This line sets up the express application to use 'EJS' as the view engine.
app.set('view engine', 'ejs');


//This will set up the express application to include the session middleware.
app.use(session({
  secret: 'yoursecret',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));
// Make session available in all views
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});
//pass user globally
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

//console.log(req.body);
//This line will check for any request with a URL path starting with '/public'.
app.use('/public', express.static('public'));

// Body parser middleware to parse form data
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//serve and attache uplosded image like this
app.use('/uploads', express.static('uploads'));

//count cart items
app.use((req, res, next) => {
  const cart = req.session.cart || [];
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  res.locals.cartCount = cartCount;
  next();
});

//navbar products fetch data from categories table
app.use((req, res, next) => {
  // For example: fetch categories from DB and attach to locals
  conn.query('SELECT name, slug FROM categories', (err, results) => {
    if (err) return next(err);
    res.locals.categories = results || [];
    next();
  });
});

// Route: Products by category slug
app.get('/products/:slug', (req, res) => {
  const slug = req.params.slug;

  const sql = `SELECT products.*, categories.name AS category_name FROM products
  				JOIN categories ON products.category_id = categories.id WHERE categories.slug = ?`;

  conn.query(sql, [slug], (err, results) => {
    if (err) throw err;

    res.render('products-by-category', {
      categorySlug: slug, products: results
    });
  });
});
// Product detail page -- fetch product from product id
app.get('/product/:id', (req, res, next) => {
  const slug = req.params.id;

  const sql = `SELECT products.*, categories.name AS category_name FROM products
    			JOIN categories ON products.category_id = categories.id WHERE products.id = ?`;

  conn.query(sql, [slug], (err, results) => {
    if (err) return next(err);

    if (results.length === 0) {
      return res.status(404).send('Product not found');
    }

    res.render('product-detail', {
      product: results[0]
    });
  });
});
//This will make a GET request to the URL of your server to
//render the 'home' view and send HTML content as response.
app.get('/', function (req, res) {
  res.render("home");
});

app.get('/login', function (req, res) {
  res.render("login");
});

app.get('/register', function (req, res) {
  res.render("register", { title: 'Register' });
});

//login page
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const redirect = req.body.redirect || '/dashboard';

  conn.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.send('DB error');

    if (results.length > 0 && results[0].password === password) {
      req.session.user = results[0];
      return res.redirect(redirect);
    } else {
      return res.send('Invalid login');
    }
  });
});

//dashboard route --- admin or customer
app.get('/dashboard', (req, res) => {
  const user = req.session.user;

  if (!user) return res.redirect('/login');

  if (user.role === 'admin') {
    return res.redirect('/admin/dashboard');
  } else {
    return res.redirect('/customer-dashboard');
  }
});
// get customer-dashboard
app.get('/customer-dashboard', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'customer') {
    return res.redirect('/login');
  }

  const userId = req.session.user.id;

  conn.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
    if (err || results.length === 0) return res.send('User not found.');

    res.render('customer-dashboard', {
      user: results[0],
      message: req.query.message || null , // ✅ This allows message to show in EJS
      current: 'dashboard'
    });
  });
});



  //customer-dashboard update my details page
  app.post('/update-profile', (req, res) => {
    const { id, name, email, phone } = req.body;

    const sql = `UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?`;
    conn.query(sql, [name, email, phone, id], (err, result) => {
      if (err) {
        console.log(err);
        return res.send('Error updating profile');
      }
      //req.session.message = 'Profile updated successfully!';
      res.redirect('/customer-dashboard');
    });
  });
// customer-dashboard-view order- view details of order 
app.get('/customer/myorder', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'customer') {
    return res.redirect('/login');
  }
  const userId = req.session.user.id;

  conn.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, orders) => {
    if (err) return res.send('Error fetching orders');

    res.render('customer/myorder', {
      user: req.session.user,
      orders: orders,
      current: 'orders' // for sidebar highlighting
    });
  });
});
app.get('/customer/order-details/:id', (req, res) => { 
  const orderId = req.params.id;
  const userId = req.session.user.id;

  // Get order info
  conn.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId], (err, orderResult) => {
    if (err || orderResult.length === 0) {
      return res.send('Order not found or unauthorized.');
    }

    const order = orderResult[0];

    // Join order_items with products to get item details
    const sql = `SELECT order_items.quantity, products.name, products.price, products.image FROM order_items
                  JOIN products ON order_items.product_id = products.id WHERE order_items.order_id = ?`;

    conn.query(sql, [orderId], (err2, items) => {
      if (err2) return res.send('Error loading order items');

      res.render('customer/order-details', {
        order,
        items,
        current: 'orders'
      });
    });
  });
});


//customer-dashboard ----- edit address
app.get('/customer/address', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'customer') {
    return res.redirect('/login');
  }

  const userId = req.session.user.id;

  conn.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
    if (err || results.length === 0) return res.send('User not found');

    res.render('customer/address', {
      user: results[0],
      message: req.query.message || null,
      current: 'address'
    });
  });
});

app.post('/customer/update-address', (req, res) => {
  const userId = req.session.user.id;
  const { address, city, postal_code, country } = req.body;

  conn.query(
    'UPDATE users SET address=?, city=?, postal_code=?, country=? WHERE id=?',
    [address, city, postal_code, country, userId],
    (err, result) => {
      if (err) return res.send('Failed to update address');

      res.redirect('/customer/address?message=' + encodeURIComponent('Address updated successfully.'));
    }
  );
});
// customer dashboard----change password
app.get('/customer/change-password', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'customer') {
    return res.redirect('/login');
  }

  res.render('customer/change-password', {
    message: req.query.message || null,
    error: req.query.error || null,
    current: 'password' // For sidebar highlight
  });
});

app.post('/customer/change-password', (req, res) => {
  const userId = req.session.user.id;
  const { current_password, new_password, confirm_password } = req.body;

  if (new_password !== confirm_password) {
    return res.redirect('/customer/change-password?error=' + encodeURIComponent('New passwords do not match.'));
  }

  conn.query('SELECT password FROM users WHERE id = ?', [userId], (err, results) => {
    if (err || results.length === 0) {
      return res.redirect('/customer/change-password?error=' + encodeURIComponent('User not found.'));
    }

    const hashedPasswordFromDB = results[0].password;

    bcrypt.compare(current_password, hashedPasswordFromDB, (err, isMatch) => {
      if (err || !isMatch) {
        return res.redirect('/customer/change-password?error=' + encodeURIComponent('Current password is incorrect.'));
      }

      bcrypt.hash(new_password, 10, (err, hashedNewPassword) => {
        if (err) {
          return res.redirect('/customer/change-password?error=' + encodeURIComponent('Error encrypting new password.'));
        }

        conn.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId], (err2) => {
          if (err2) {
            return res.redirect('/customer/change-password?error=' + encodeURIComponent('Failed to update password.'));
          }

          res.redirect('/customer/change-password?message=' + encodeURIComponent('Password updated successfully.'));
        });
      });
    });
  });
});

  //get admin dashboard
  app.get('/admin/dashboard', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.redirect('/login');
    }

    res.render('admin/dashboard', { user: req.session.user });
  });

  //This will send a POST request to '/register' which will store 
  //the user information in a table.
  app.post('/register', function (req, res) {
    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;
    if (email && password) {
      var sql = `INSERT INTO users (name, email, password,role) VALUES ("${name}", "${email}", "${password}", "customer")`;
      conn.query(sql, function (err, result) {
        if (err) throw err;
        console.log('record inserted');
        res.render('login');
      })
    }
    else {
      console.log("Error");
    }
  });





  //view cart page
  app.get('/cart', (req, res) => {
    const cart = req.session.cart || [];
    res.render('cart', { cart });
  });

  //product-by-categories page (add to cart)
  app.post('/cart/add', (req, res) => {
    const { productId, name, price, quantity } = req.body;
    const id = parseInt(productId); // Parse and validate
    const qty = parseInt(quantity); // Parse and validate
    const cartItem = { id, name, price: parseFloat(price), quantity: qty };

    if (!req.session.cart) req.session.cart = [];// Initialize cart
    const existingIndex = req.session.cart.findIndex(p => p.id === id);// Check if product is already in cart
    if (existingIndex !== -1) {
      req.session.cart[existingIndex].quantity += qty;// Update quantity
    } else {
      req.session.cart.push(cartItem);// Add new item
    }
    res.redirect('/cart');
  });

  //remove item from cart
  app.post('/cart/remove', (req, res) => {
    const productId = parseInt(req.body.productId);
    if (req.session.cart) {
      req.session.cart = req.session.cart.filter(p => p.id !== productId);
    }
    res.redirect('/cart');
  });

  //checkout
  app.get('/checkout', (req, res) => {
    if (!req.session.cart) {
      req.session.cart = [];
    }

    res.render('checkout', {
      user: req.session.user || null,
      cart: req.session.cart
    });
  });


  app.post('/checkout', (req, res) => {
    const cart = req.session.cart;
    const user = req.session.user;
    const { address, city, postal } = req.body;

    if (!user || !cart || cart.length === 0) {
      return res.send('Login required and cart must not be empty.');
    }

    const name = user.name;
    const email = user.email;
    const userId = user.id || null;

    // calculate total
    let total = 0;
    cart.forEach(item => {
      total += item.price * item.quantity;
    });

    const orderSql = `
    INSERT INTO orders (user_id, customer_name, email, address, city, postal, total_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

    conn.query(orderSql, [userId, name, email, address, city, postal, total], (err, result) => {
      if (err) return res.send('Error saving order.');

      const orderId = result.insertId;

                         // prepare order items
      const itemsSql = `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?`;
      const itemValues = cart.map(item => [orderId, item.product_id, item.quantity, item.price]);

      conn.query(itemsSql, [itemValues], (err2) => {
        if (err2) return res.send('Error saving order items.');

        req.session.cart = []; // clear cart
        res.send(`✅ Order placed successfully. Your order ID is ${orderId}`);
      });
    });
  });


  app.post('/checkout/guest', (req, res) => {
    const { name, email, address } = req.body;

    req.session.user = {
      name,
      email,
      address,
      isGuest: true
    };

    res.redirect('/checkout');
  });

  // contact us page
  app.get('/contact', (req, res) => {
    res.render('contact', { msg: req.query.msg });
  });

  app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;

    conn.query('INSERT INTO messages (name, email, message) VALUES (?, ?, ?)',
      [name, email, message], (err) => {
        if (err) throw err;
        console.log("Contact form submitted:", { name, email, message });
        res.redirect('/contact?msg=Message sent successfully!');
      });
  });

  // admin dashboard--- manage products
  app.get('/admin/products', (req, res) => {

    const sql = `SELECT p.id, p.name, p.description, p.price, p.image, c.name AS category_name FROM products p
    			LEFT JOIN categories c ON p.category_id = c.id`;
    conn.query(sql, (err, results) => {
      if (err) throw err;
      res.render('admin/products', {
        products: results
      });
    });
  });

  //admin dashboard----add products (submission by Multer for upload image and also (npm install multer))
  app.get('/admin/products/add', (req, res) => {

    // Fetch categories from MySQL to populate the select dropdown
    conn.query('SELECT * FROM categories', (err, categories) => {
      if (err) throw err;
      res.render('admin/add-product', {
        categories
      });
    });
  });
  app.post('/admin/products/add', upload.single('image'), (req, res) => {

    const { name, description, category_id, price } = req.body;
    const image = req.file.filename;

    const sql = 'INSERT INTO products (name, description, category_id, price, image) VALUES (?, ?, ?, ?, ?)';
    conn.query(sql, [name, description, category_id, price, image], (err) => {
      if (err) throw err;
      res.redirect('/admin/products');
    });
  });

  //admin dashboard-----edit(update) products

  app.get('/admin/products/edit/:id', (req, res) => {

    const productId = req.params.id;

    const productSql = 'SELECT * FROM products WHERE id = ?';
    const categorySql = 'SELECT * FROM categories';

    conn.query(productSql, [productId], (err, productResults) => {
      if (err) throw err;
      if (productResults.length === 0) return res.send('Product not found');

      const product = productResults[0];

      conn.query(categorySql, (err, categories) => {
        if (err) throw err;
        res.render('admin/edit-product', { product, categories });
      });
    });
  });

  app.post('/admin/products/edit/:id', upload.single('image'), (req, res) => {

    const productId = req.params.id;
    const { name, description, category_id, price } = req.body;
    let sql, data;
    if (req.file) {  // New image uploaded
      const image = req.file.filename;
      sql = `UPDATE products SET name = ?, description = ?, category_id = ?, price = ?, image = ? WHERE id = ?`;
      data = [name, description, category_id, price, image, productId];
    } else {// No image uploaded
      sql = `UPDATE products SET name = ?, description = ?, category_id = ?, price = ? WHERE id = ?`;
      data = [name, description, category_id, price, productId];
    }
    conn.query(sql, data, (err, result) => {
      if (err) throw err;
      res.redirect('/admin/products');
    });
  });

  //admin dashboard ----- delete products

  app.get('/admin/products/delete/:id', (req, res) => {

    const productId = req.params.id;
    //Get image filename
    const getImageQuery = 'SELECT image FROM products WHERE id = ?';
    conn.query(getImageQuery, [productId], (err, result) => {
      if (err) throw err;

      if (result.length === 0) {
        return res.send('Product not found');
      }
      const imageName = result[0].image;

      // Delete product from database
      const deleteQuery = 'DELETE FROM products WHERE id = ?';
      conn.query(deleteQuery, [productId], (err2) => {
        if (err2) throw err2;

        // Step 3: Remove image from filesystem (uploads folder)
        const fs = require('fs');
        const path = require('path');
        const imagePath = path.join(__dirname, 'uploads', imageName);
        fs.unlink(imagePath, (unlinkErr) => {
          if (unlinkErr) {
            console.warn('Image not deleted or not found:', imageName);
          }
          return res.redirect('/admin/products');
        });
      });
    });
  });

  //admin dashboard ---- product categories

  app.get('/admin/categories', (req, res) => {

    const sql = 'SELECT * FROM categories';
    conn.query(sql, (err, results) => {
      if (err) throw err;
      res.render('admin/categories', {
        user: req.session.user,
        categories: results
      });
    });
  });

  //admin dashboard ----- add categories

  app.get('/admin/categories/add', (req, res) => {

    res.render('admin/add-category');
  });
  //slug auto-generation
  function slugify(text) {
    return text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
  }

  app.post('/admin/categories/add', (req, res) => {

    const { name } = req.body;
    const slug = slugify(name);

    const sql = 'INSERT INTO categories (name, slug) VALUES (?, ?)';
    conn.query(sql, [name, slug], (err) => {
      if (err) throw err;
      res.redirect('/admin/categories');
    });
  });

  //admin dashboard ----- edit categories

  app.get('/admin/categories/edit/:id', (req, res) => {

    const categoryId = req.params.id;

    conn.query('SELECT * FROM categories WHERE id = ?', [categoryId], (err, results) => {
      if (err) throw err;
      if (results.length === 0) return res.send('Category not found');

      res.render('admin/edit-category', { category: results[0] });
    });
  });
  function slugify(text) {
    return text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
  }

  app.post('/admin/categories/edit/:id', (req, res) => {

    const { name } = req.body;
    const slug = slugify(name);
    const id = req.params.id;

    const sql = 'UPDATE categories SET name = ?, slug = ? WHERE id = ?';
    conn.query(sql, [name, slug, id], (err) => {
      if (err) throw err;
      res.redirect('/admin/categories');
    });
  });

  // admin dashboard ------ delete categories

  app.get('/admin/categories/delete/:id', (req, res) => {
    const categoryId = req.params.id;

    conn.query('DELETE FROM categories WHERE id = ?', [categoryId], (err) => {
      if (err) throw err;
      res.redirect('/admin/categories');
    });
  });

  //admin dashboard----view orders

  app.get('/admin/orders', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/login');
  }

  const sql = `SELECT orders.id, orders.total_amount, orders.status, orders.created_at, users.name
                FROM orders JOIN users ON orders.user_id = users.id`;

  conn.query(sql, (err, results) => {
    if (err) {
      console.log(err);
      return res.send('Failed to fetch orders');
    }

    res.render('admin/orders', {
      orders: results,
      current: 'orders'
    });
  });
});
//admin-dashboard---view order-details
app.get('/admin/order-details/:id', (req, res) => {
  const orderId = req.params.id;

  conn.query('SELECT * FROM orders WHERE id = ?', [orderId], (err, orderResult) => {
    if (err || orderResult.length === 0) return res.send('Order not found');

    const order = orderResult[0];

    const sql = `SELECT order_items.quantity, products.name, products.price FROM order_items
                JOIN products ON order_items.product_id = products.id WHERE order_items.order_id = ?`;

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

app.post('/admin/update-order/:id', (req, res) => {
  const orderId = req.params.id;
  const { status, payment_status, payment_method, tracking_number, courier_name } = req.body;

  const sql = `UPDATE orders SET status = ?, payment_status = ?, payment_method = ?, tracking_number = ? WHERE id = ?`;

  conn.query(sql, [status, payment_status, payment_method, tracking_number, orderId], (err) => {
    if (err) return res.send('Failed to update order');

    res.redirect('/admin/order-details/' + orderId + '?message=Order updated successfully');
  });
});

  //admin dashboard view registered users
  app.get('/admin/users', (req, res) => {

    const sql = 'SELECT id, name, email, role, created_at FROM users';

    conn.query(sql, (err, results) => {
      if (err) throw err;
      res.render('admin/users', { users: results });
    });
  });

  //admin can edit registered user roles

  app.post('/admin/users/:id/role', (req, res) => {

    const { role } = req.body;
    const sql = 'UPDATE users SET role = ? WHERE id = ?';
    conn.query(sql, [role, req.params.id], (err) => {
      if (err) throw err;
      res.redirect('/admin/users');
    });
  });
  // admin can view orders for a user
  app.get('/admin/users/:id/orders', (req, res) => {

    const userId = req.params.id;

    const sql = `SELECT o.id AS order_id, o.total_amount, o.status, o.created_at, o.tracking_number, 
				u.name AS user_name	FROM orders o JOIN users u ON o.user_id = u.id
				WHERE o.user_id = ?`;

    conn.query(sql, [userId], (err, orders) => {
      if (err) throw err;
      res.render('admin/user-orders', { orders, userId });
    });
  });

//admin dashboard-------------view messages and reply messages
app.get('/admin/messages', (req, res) => {
  conn.query('SELECT * FROM messages ORDER BY created_at DESC', (err, results) => {
    if (err) return res.send('Error loading messages');
    res.render('admin/messages', { messages: results });
  });
});

app.post('/admin/messages/:id/reply', (req, res) => {
  const reply = req.body.reply;
  const id = req.params.id;

  conn.query('UPDATE messages SET reply = ? WHERE id = ?', [reply, id], (err) => {
    if (err) return res.send('Reply failed');
    res.redirect('/admin/messages');
  });
});


//This will be used to return to home page after the members logout.
  app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
  });

  app.listen(3000);
  console.log('Running at Port 3000');
