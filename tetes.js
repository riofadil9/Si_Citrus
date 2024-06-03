const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'mySecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Mock user data
const users = {
  user1: 'password1',
  user2: 'password2'
};

// Middleware untuk validasi login
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    res.redirect('/login');
  }
}

// Rute untuk halaman login
app.get('/login', (req, res) => {
  res.render('login');
});

// Rute untuk memproses login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (users[username] && users[username] === password) {
    req.session.user = username;
    res.redirect('/home');
  } else {
    res.render('login', { error: 'Invalid username or password' });
  }
});

// Rute untuk halaman beranda (protected)
app.get('/home', isAuthenticated, (req, res) => {
  res.render('home', { user: req.session.user });
});

// Rute untuk logout
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/home');
    }
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
