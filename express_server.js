const express = require('express');
const app = express();
const PORT = 8080; //default port
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

app.use(cookieParser());
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

const findUserByEmail = function (email, users) {
    for (const userID in users) {
      if (users[userID].email === email) {
        return users[userID];
      }
    }
    return undefined;
};

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

const users = {
  'guest': {
    id: 000000,
    email: 'example@gmail.com',
    password: 'xxx'
  },
  'test':{
    id:'rohit@gmail.com',
    password: "1"
  }
};

const userData = {
  1: 'default'
}

app.get('/', (req, res) => {
  let templateVars = { urls: urlDatabase, user: users }; 
  console.log(templateVars);
  res.render('urls_index', templateVars);
});

// Redirect to url page after login
// app.post('/login', (req, res) => {
//   // let useremail= req.body.email;
//   // res.cookie('username', users[]);



//   let templateVars = { urls: urlDatabase, user: users[user]};
//   res.redirect('/urls', 200,  templateVars);
// });

app.get('/user/logout', (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.clearCookie('user_id');
  res.redirect('/urls', 200, templateVars);
});

//Registration page
app.post('/user/register', (req, res) => {
  res.render('user_regs'); 
});

app.get('/user/register', (req, res) => {
  let templateVars = { user: users };
  res.render('user_regs', templateVars);
});


// Login page, sent here after registration
app.post('/login', (req, res) => {
  // let isUser = findUserByEmail(req.body.email, users);
  let isEmpty = ( req.body.email.length === 0 || req.body.password.length === 0 ); 
  if(isEmpty) {
    res.status(400).send('you need to fill both fields');
  }
  for (key in users) {
    if (users[key].email === req.body.email) {
      res.status(400).send("You're already in the database!");
    }
  }
  let newUser = {
    email: req.body.email,
    password: req.body.password,
    id: generateRandomString()
  }
  users[newUser.id] = newUser;
  res.cookie('user_id', users[newUser.id]);
  res.redirect('/urls');
});


app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];

  res.redirect(`${longURL}`);
});

//sends current database
app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase, user: req.cookies["user_id"] }; 
  res.render('urls_index', templateVars);
});

//Shorten URL then add to database, redirect to page to view it
app.post("/urls", (req, res) => {
  console.log(req.body.longURL);  // Log the POST request body to the console
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  if (!longURL.startsWith('http:') && !longURL.startsWith('https:')) {
    longURL = 'http://' + longURL;
  }

  urlDatabase[shortURL] = longURL;

  let templateVars = users;

  console.log(users);
  console.log(shortURL);
  res.redirect(`/urls/${shortURL}`, 200, templateVars);
});

//Delete URL from current database
app.post("/urls/:shortURL/delete", (req, res) => {
  let tempDelete = req.params.shortURL;
  console.log('trying to delete ', req.params.shortURL);
  delete urlDatabase[tempDelete];
  let templateVars = { user: users }
  res.redirect("/urls", 200, templateVars);
})

//Edit long URL for specific short URL
app.post("/urls/:shortURL", (req, res) => {
  console.log('editing');

  let shortURL = req.params.shortURL;
  urlDatabase[shortURL] = req.body.longURL;

  let templateVars = { user: users };
  res.redirect(`/urls/${shortURL}`, templateVars);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  console.log(users);
  let templateVars = { urls: urlDatabase, user: users };
  res.render("urls_new", templateVars);
});


app.get("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  console.log(shortURL);
  
  let templateVars = { shortURL: shortURL, longURL: longURL, user: users };
  res.render("urls_show", templateVars);
});

app.get('/hello', (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});





module.exports = urlDatabase;