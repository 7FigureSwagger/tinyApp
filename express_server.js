const express = require('express');
const app = express();
const PORT = 8080; //default port
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true })) // this gives us req.body
app.set('view engine', 'ejs');

function generateRandomString() {
  let rando = [];
  for (let i = 0; i <= 6; i++) {
    rando.push(Math.floor(Math.random() * 10));
  }

  rando = rando.join('');

  return rando;
}

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

const userData = {
  1: 'default'
}

app.get('/', (req, res) => {
  let templateVars = { urls: urlDatabase, username: 'Anon' }; 
  res.render('urls_index', templateVars);
  // res.send('Hello!');
});

// Redirect to url page after login
app.post('/login', (req, res) => {

  res.cookie('username', req.body.username);
  let templateVars = { urls: urlDatabase};
  res.redirect('/urls', 200,  templateVars);
});

app.post('/logout', (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.clearCookie('username');
  res.redirect('/urls', 200, templateVars);
})

app.get("/u/:shortURL", (req, res) => {
  // const longURL = ...
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  // let colon = ':';

  res.redirect(`${longURL}`);
});

//sends current database
app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies['username'] }; 
  res.render('urls_index', templateVars);
});

//redirect to index page after 'login'


//Shorten URL then add to database, redirect to page to view it
app.post("/urls", (req, res) => {
  console.log(req.body.longURL);  // Log the POST request body to the console
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  if (!longURL.startsWith('http:') && !longURL.startsWith('https:')) {
    longURL = 'http://' + longURL;
  }

  urlDatabase[shortURL] = longURL;

  let templateVars = req.body.username;

  console.log(req.body.username);
  console.log(shortURL);
  res.redirect(`/urls/${shortURL}`, 200, templateVars);
});

//Delete URL from current database
app.post("/urls/:shortURL/delete", (req, res) => {
  let tempDelete = req.params.shortURL;
  console.log('trying to delete ', req.params.shortURL);
  delete urlDatabase[tempDelete];
  let templateVars = { username: req.cookies['username'] }
  res.redirect("/urls", 200, templateVars);
})

//Edit long URL for specific short URL
app.post("/urls/:shortURL", (req, res) => {
  console.log('editing');

  let shortURL = req.params.shortURL;
  urlDatabase[shortURL] = req.body.longURL;

  // res.cookie('username', req.body.username);
  let templateVars = { username: req.cookies['username'] };
  res.redirect(`/urls/${shortURL}`, templateVars);
})

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  // res.cookie('username', req.body.username);
  console.log(req.body.username);
  let templateVars = {urls: urlDatabase, username: req.cookies['username']};
  res.render("urls_new", templateVars);
});


app.get("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  console.log(shortURL);
  
  let templateVars = { shortURL: shortURL, longURL: longURL, username: req.cookies['username'] };
  res.render("urls_show", templateVars);
});

app.get('/hello', (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});





module.exports = urlDatabase;
