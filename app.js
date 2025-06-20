//Node.js silver elegance web application
//Author: Pinki DHimmar
//Date created: 20 June 2025

//This line uses the require function to include the express module.
var express = require('express');
//This line creates an instance called app in the express application.
var app = express();

//This line uses the require function to include the express-session module.
var session = require('express-session');
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

app.use(express.urlencoded({extended: true}));
app.use(express.json());

//app.use(rolesRoutes);	

//This line sets up the express application to use 'EJS' as the view engine.
app.set('view engine','ejs');
//This will set up the express application to include the session middleware.
app.use(session({
	secret: 'yoursecret',
	resave: false,
	saveUninitialized: true
}));

//These lines will ensure that the express application can handle both JSON and URL-encoded data.



//console.log(req.body);
//This line will check for any request with a URL path starting with '/public'.
app.use('/public', express.static('public'));

// Body parser middleware to parse form data
app.use(bodyParser.urlencoded({ extended: false}));
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

    res.render('products-by-category', {categorySlug: slug, products: results
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

    res.render('product-detail', {product: results[0]
    });
  });
});
//This will make a GET request to the URL of your server to
//render the 'home' view and send HTML content as response.
app.get('/',function(req,res){
    res.render("home");
});

app.get('/login',function(req,res){
    res.render("login");
});

app.get('/register',function(req,res){
    res.render("register",{title:'Register'});
});

//login page
app.post('/login', function(req, res) {
	let email = req.body.email;
	let password = req.body.password;
	if (email && password) {
		conn.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], 
		function(error, results, fields) {
			if (error) throw error;
			if (results.length > 0) {
				req.session.loggedin = true;
				req.session.email = email;
				req.session.role = results[0].role;
				console.log("User role:",results[0].role);
				console.log("User ID:", results[0].id);
				const user = results[0];
				// Redirect to the dashboard page with user ID
				res.redirect(`/dashboard/${user.id}`);
			} else {
				res.send('Incorrect Email and/or Password!');
			}			
			res.end();
		});
	} else {
		res.send('Please enter Username and Password!');
		res.end();
	}
});

//This will send a POST request to '/register' which will store 
//the user information in a table.
app.post('/register', function(req, res) {
	let name = req.body.name;
	let email = req.body.email;
	let password = req.body.password;
	if (email && password) {
		var sql = `INSERT INTO users (name, email, password,role) VALUES ("${name}", "${email}", "${password}", "customer")`;
		conn.query(sql, function(err, result) {
			if (err) throw err;
			console.log('record inserted');
			res.render('login');
		})
	}
	else {
		console.log("Error");
	}
});

//dashboard route --- admin or customer
app.get('/dashboard/:id', (req, res) => {
	//var id = req.session.id; // Assuming userId is stored in session after login
  const userId = req.params.id;
  conn.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) throw err;
    if (results.length === 0) return res.send('User not found');
    const user = results[0];
    res.render('dashboard', { user });
  });
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
  const cartItem = {id, name, price: parseFloat(price), quantity: qty };

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
  const cart = req.session.cart || [];
  res.render('checkout', { cart });
});

app.post('/checkout', (req, res) => {
  const { name, address, email, payment } = req.body;
  const cart = req.session.cart;

  if (!cart || cart.length === 0) {
    return res.redirect('/cart');
  }
  req.session.cart = [];// Clear cart
  res.send('Order placed successfully!'); 
});

// contact us page
app.get('/contact', (req, res) => {
  res.render('contact', { success: false });
});

app.post('/contact', (req, res) => {
  const { name, email, message } = req.body;

  conn.query('INSERT INTO messages (name, email, message) VALUES (?, ?, ?)',
  [name, email, message],(err) => {
    if (err) throw err;
	console.log("Contact form submitted:", { name, email, message });
    res.render('contact', { success: true });
  });
});

// admin dashboard--- manage products
app.get('/admin/products', (req, res) => {
  const sql = `SELECT p.id, p.name, p.description, p.price, p.image, c.name AS category_name FROM products p
    			LEFT JOIN categories c ON p.category_id = c.id`;
  conn.query(sql, (err, results) => {
    if (err) throw err;
    res.render('admin/products', { products: results });
  });
});

//admin dashboard----add products (submission by Multer for upload image and also (npm install multer))
app.get('/admin/products/add', (req, res) => {
  // Fetch categories from MySQL to populate the select dropdown
  conn.query('SELECT * FROM categories', (err, categories) => {
    if (err) throw err;
    res.render('admin/add-product', { categories });
  });
});
app.post('/admin/products/add', upload.single('image'), (req, res) => {
  const { name, description, category_id, price } = req.body;
  const image = req.file.filename;

  const sql = 'INSERT INTO products (name, description, category_id, price, image) VALUES (?, ?, ?, ?)';
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
    res.render('admin/categories', { categories: results });
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



//This will be used to return to home page after the members logout.
app.get('/logout',(req,res) => {
	req.session.destroy();
	res.redirect('/');
});

app.listen(3000);
console.log('Running at Port 3000');
