const express = require('express');
const { findUserByEmail } = require('./helpers');
const app = express();
const PORT = 8080; //default port
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

const password = "purple-monkey-dinosaur"; // found in the req.params object

app.use(cookieSession({
  name: 'user_id',
  keys: ['cat'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))
app.use(bodyParser.urlencoded({ extended: true })); // this gives us req.body
app.set('view engine', 'ejs');

function generateRandomString() {
  let rando = [];
  for (let i = 0; i <= 6; i++) {
    rando.push(Math.floor(Math.random() * 10));
  }
  rando = rando.join('');
  return rando;
};

let urlsForUser = function (userID) {
  let filteredURLS = {};
  for (let url in urlDatabase) {
    if (userID === urlDatabase[url].userID) {
      filteredURLS[url] = urlDatabase[url];
    }
  }
  return filteredURLS;
}

const userLoggedIn = function(cookie, users) {
  for ( const user in users) {
    if (cookie === user) {
      return true;
    }
  } return false;
}

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

const users = {
  'bobtoo': {
    id: "bobtoo",
    email: 'bob@gmail.com',
    password: 'xxx'
  }
};

app.get('/', (req, res) => {
  res.redirect('/urls');
});

app.get('/user/login', (req, res) => {
  if (userLoggedIn(req.session.user_id, users)) {
    res.redirect('/urls');
  } else {
    let userID = req.session.user_id;
    let templateVars = {
      user_id: req.session.user_id,
      urls: urlDatabase,
      user: users[userID]
     };
    res.render('user_login', templateVars);
    };
});

app.get('/user/logout', (req, res) => {
  let templateVars = { urls: urlDatabase };
  req.session = null;
  res.redirect('/urls', 200, templateVars);
});

app.get('/user/register', (req, res) => {
  let templateVars = { user: users };

  res.render('user_regs', templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL].longURL;

  res.redirect(`${longURL}`);
});

//sends current database
app.get('/urls', (req, res) => {
  let tempDatabase = {};
  let whichUser = req.session.user_id;
  tempDatabase = urlsForUser(whichUser);
  let templateVars = { urls: tempDatabase, user: users[whichUser] }; 
  
  console.log('new user after redirect', users[whichUser]);
  res.render('urls_index', templateVars);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  let userID = req.session.user_id;
  let templateVars = {
    user_id: req.session.user_id,
    urls: urlDatabase,
    user: users[userID]
  };

  if(!userID){
    res.send("you must be signed in to create new url");
  } else {
    res.render("urls_new", templateVars);
  }
});


app.get("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL].longURL;  
  let templateVars = { shortURL: shortURL, longURL: longURL, user: users };
  res.render("urls_show", templateVars);
});

app.get('/hello', (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


// -------------------------POST REQUESTS----------------------------------


// Redirected login page, after registration
app.post('/user/register', (req, res) => {
  
  let isEmpty = ( req.body.email.length === 0 || req.body.password.length === 0 ); 
  if(isEmpty) {
    res.status(400).send('you need to fill both fields');
  }
  for (key in users) {
    if (users[key].email === req.body.email) {
      res.status(400).send("You're already in the database!");
    }
  }
  let inputPass = req.body.password
  let hashedPassword = bcrypt.hashSync(inputPass, 10);
  let newUser = {
    email: req.body.email,
    password: hashedPassword,
    id: generateRandomString()
  }
  users[newUser.id] = newUser;
  req.session.user_id = ('user_id', newUser.id);  
  res.redirect('/user/login');
});

// After login attempt
app.post('/user/login', (req, res) => {
  console.log('req', req.body.email);
  let isUser = findUserByEmail(req.body.email, users);
  let isEmpty = ( req.body.email.length === 0 || req.body.password.length === 0 ); 
  if(isEmpty) {
    return res.status(400).send('you need to fill both fields');
  }
  console.log('user', isUser);
  if (isUser && bcrypt.compareSync(req.body.password, isUser.password)) {
    console.log('login success');
    req.session.user_id = isUser.id;
    return res.redirect('/urls');
  } else {
    return res.status(400).send('password doesnt match');
  }
});

//Shorten URL then add to database, redirect to page to view it
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  let whichUser = req.session.user_id;
  if (!longURL.startsWith('http:') && !longURL.startsWith('https:')) {
    longURL = 'http://' + longURL;
  }

  urlDatabase[shortURL] = {
    longURL,
    userID: whichUser
  }

  let templateVars = { urls: urlDatabase, user: whichUser};
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`, 200, templateVars);
});

//Delete URL from current database
app.post("/urls/:shortURL/delete", (req, res) => {
  let tempDelete = req.params.shortURL;
  console.log('trying to delete ', req.params.shortURL);
  if(urlDatabase[tempDelete].userID === req.session.user_id){
    delete urlDatabase[tempDelete];
    let templateVars = { user: users }
    res.redirect("/urls", 200, templateVars);
  } else {
    res.send('you must be logged in');
  }
})

//Edit long URL for specific short URL
app.post("/urls/:shortURL", (req, res) => {
  let userID = req.session.user_id;
  console.log('editing');
  if (!userID) {
    res.redirect('/urls');
  } else if (userID !== urlDatabase[req.params.shortURL].userID){
    res.send('your are not supposed to be here');
  } else {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect('/urls');
  }

  let templateVars = { user: userID, longURl: urlDatabase[shortURL].longURL };
  res.redirect(`/urls/${shortURL}`, templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});




module.exports = { users };
