const express = require('express');
const app = express();
const PORT = 8080; //default port
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const bcrypt = require('bcrypt');

const password = "purple-monkey-dinosaur"; // found in the req.params object
// const hashedPassword = bcrypt.hashSync(password, 10);

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

let urlsForUser = function (userID) {
  let filteredURLS = {};
  for (let url in urlDatabase) {
    if (userID === urlDatabase[url].userID) {
      filteredURLS[url] = urlDatabase[url];
    }
  }
  return filteredURLS;
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

// Redirect to url page after login
// app.post('/login', (req, res) => {
//   // let useremail= req.body.email;
//   // res.cookie('username', users[]);



//   let templateVars = { urls: urlDatabase, user: users[user]};
//   res.redirect('/urls', 200,  templateVars);
// });

// app.get('/', (req, res) => {
//   let templateVars = { urls: urlDatabase, user: users }; 
//   console.log(templateVars);
//   res.render('urls_index', templateVars);
// });

app.get('/user/login', (req, res) => {
  let templateVars = { user: users }
  res.render('user_login', templateVars);
})

app.get('/user/logout', (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.clearCookie('user_id');
  res.redirect('/urls', 200, templateVars);
});

// app.get('/user/register')

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
  let whichUser = req.cookies['user_id'];
  tempDatabase = urlsForUser(req.cookies['user_id']);
  let templateVars = { urls: tempDatabase, user: users[whichUser] }; 
  
  console.log('new user after redirect', users[whichUser]);
  res.render('urls_index', templateVars);
});



app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => { 
  if(req.cookies["user_id"]){
    let templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] };
    res.render("urls_new", templateVars);
  } else {
    res.send("you must be signed in to create new url");
  }
});


app.get("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL].longURL;
  // console.log(urlDatabase);
  
  let templateVars = { shortURL: shortURL, longURL: longURL, user: users };
  res.render("urls_show", templateVars);
});

app.get('/hello', (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


// -------------------------POST REQUESTS----------------------------------


// Login page, sent here after registration
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
  // console.log('pword', hashedPassword);

  res.cookie('user_id', users[newUser.id].id);
  res.redirect('/user/login');
});

// After login attempt
app.post('/user/login', (req, res) => {
  let isUser = findUserByEmail(req.body.email, users);
  let isEmpty = ( req.body.email.length === 0 || req.body.password.length === 0 ); 
  if(isEmpty) {
    res.status(400).send('you need to fill both fields');
  }

  if (isUser && bcrypt.compareSync(req.body.password, isUser.password)) {
    console.log('login success');
    res.cookie('user_id', isUser.id);
    res.redirect('/urls');
  } else {
    res.status(400).send('password doesnt match');
  }

  res.redirect('/urls');
});

//Shorten URL then add to database, redirect to page to view it
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  let whichUser = req.cookies['user_id'];
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
  if(urlDatabase[tempDelete].userID === req.cookies['user_id']){
    delete urlDatabase[tempDelete];
    let templateVars = { user: users }
    res.redirect("/urls", 200, templateVars);
  } else {
    res.send('you must be logged in');
  }
})

//Edit long URL for specific short URL
app.post("/urls/:shortURL", (req, res) => {
  console.log('editing');

  let shortURL = req.params.shortURL;
  urlDatabase[shortURL] = req.body.longURL;

  let templateVars = { user: users, longURl: urlDatabase[shortURL].longURL };
  res.redirect(`/urls/${shortURL}`, templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});





module.exports = urlDatabase;