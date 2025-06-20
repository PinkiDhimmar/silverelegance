//Node.js cafe web application
//Author: Chathuni Wahalathantri
//Date created: 14 February 2024

//This line uses the require function to include the express module.
var express = require('express');
//This line creates an instance called app in the express application.
var app = express();

//This line uses the require function to include the express-session module.
var session = require('express-session');
//This line contains the configuration to connect the database.
var conn = require('./dbConfig');
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
// Product detail page by fetch product from product id
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
//dashboard route
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
//product-by-categories (add to cart)
app.post('/cart/add', (req, res) => {
  const { productId, name, price, quantity } = req.body;

  // Parse and validate
  const id = parseInt(productId);
  const qty = parseInt(quantity);
  const cartItem = {
    id,
    name,
    price: parseFloat(price),
    quantity: qty
  };

  // Initialize cart
  if (!req.session.cart) req.session.cart = [];

  // Check if product is already in cart
  const existingIndex = req.session.cart.findIndex(p => p.id === id);
  if (existingIndex !== -1) {
    // Update quantity
    req.session.cart[existingIndex].quantity += qty;
  } else {
    // Add new item
    req.session.cart.push(cartItem);
  }

  res.redirect('/cart');
});
//remove from cart
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

//This will be used to return to home page after the members logout.
app.get('/logout',(req,res) => {
	req.session.destroy();
	res.redirect('/');
});

app.listen(3000);
console.log('Running at Port 3000');
