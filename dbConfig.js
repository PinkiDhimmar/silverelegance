var mysql = require('mysql');
var conn = mysql.createConnection({
	host: 'localhost', 
	user: 'root',      
	password: '',    
	database: 'silver_elegance' // Database name
}); 

conn.connect(function(err) {
	if (err) throw err;
	console.log('Database is connected successfully !');
});

module.exports = conn;