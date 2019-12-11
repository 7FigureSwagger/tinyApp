const express = require('express');
const app = express();
const PORT = 8080; //default port

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

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get("/u/:shortURL", (req, res) => {
  // const longURL = ...
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  
  res.redirect(`http://${longURL}`);
});

//sends current database
app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

//Shorten URL then redirect to page to view it
app.post("/urls", (req, res) => {
  console.log(req.body.longURL);  // Log the POST request body to the console
  let shortURL = generateRandomString();

  urlDatabase[shortURL] = req.body.longURL
  
  console.log(shortURL);
  res.redirect(`/urls/${shortURL}`);
});

//Delete URL from current database
app.post("/urls/:shortURL/delete", (req, res) => {
  let tempDelete = req.params.shortURL;
  console.log('trying to delete ', req.params.shortURL);
  delete urlDatabase[tempDelete];
  res.redirect("/urls/");
})

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});


app.get("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  console.log(shortURL);
  let templateVars = { shortURL: shortURL, longURL: longURL };
  res.render("urls_show", templateVars);
});

app.get('/hello', (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});





module.exports = urlDatabase;
