const { MongoClient } = require("mongodb");


const uri =
  "mongodb+srv://Kadazzle:kadizzleinthehizzle@cluster0.xgaaecl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// --- This is the standard stuff to get it to work on the browser
const express = require("express");
const app = express();
const port = 3000;
const cookieParser = require("cookie-parser");
app.listen(port);
console.log("Server started at http://localhost:" + port);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", function (req, res) {
  var mycookies = req.cookies;

  if (Object.keys(mycookies).length === 0) {
    // No cookies exist
    var outstring = "<h1>HOMEPAGE</h1>";
    outstring += '<p><a href="./register">Go to register</a></p>';
    outstring += '<p><a href="./login">Go to login</a></p><br><br>';

    res.send(outstring);
  } else {
    // Cookies exist
    var cookieString =
      "<h1>A cookie/cookies already exists. Here are the cookies: </h1>";
    let cookiesHtml = "<ul>";
    for (const [name, value] of Object.entries(mycookies)) {
      cookiesHtml += `<li>${name}: ${value}</li>`;
    }
    cookiesHtml += "</ul>";

    res.send(cookieString + cookiesHtml);
  }
});

//T3
app.all("/login", function (req, res) {
  var loginString = '<form action="/afterLoginSubmit" method="POST">';
  loginString += "<h1>LOGIN</h1>";
  loginString += "<label>Username: </label>";
  loginString += '<input type="text" id="username" name="username"><br>';
  loginString += "<label>Password: </label>";
  loginString += '<input type="text" id="password" name="password">';
  loginString += '<input type="submit" value="Submit"><br>';
  loginString += '<a href="/">Go back to homepage</a><br><br>';

  loginString += "</form>";
  res.send(loginString);
});

app.all("/afterLoginSubmit", function (req, res) {
  const client = new MongoClient(uri);
  const username = req.body.username;
  const password = req.body.password;

  async function run() {
    try {
      await client.connect();
      const database = client.db("MongoTestPub");
      const data = database.collection("Data");

      const cookieHelper = await data.findOne({
        username: username,
        password: password,
      });

      if (cookieHelper) {
        res.cookie("user", username, { maxAge: 30000, httpOnly: true });
        res.send(
          "You are now logged in :)" +
            '<br><a href="/">Go back to homepage</a><br>'
        );
      } else {
        res.send(
          "The username or password is wrong. Click the link to go back and try again" +
            '<a href="/login">Go back to login</a><br><br>' +
            '<a href="/">Click to go back to homepage</a><br><br>'

        );
      }
    } finally {
      await client.close();
    }
  }

  run().catch(console.dir);
});

//T2
app.all("/register", function (req, res) {
  var registerString = '<form action="/afterRegisterSubmit" method="POST">';
  registerString += "<h1>REGISTER</h1>";
  registerString += "<label>Username: </label>";
  registerString += '<input type="text" id="username" name="username"><br>';
  registerString += "<label>Password: </label>";
  registerString += '<input type="text" id="password" name="password">';
  registerString += '<input type="submit" value="Submit"><br>';
  registerString += '<a href="/">Go back to homepage</a>';

  registerString += "</form>";
  res.send(registerString);
});

app.all("/afterRegisterSubmit", function (req, res) {
  const client = new MongoClient(uri);
  var databaseString = "<p>You are now registered into the database!</p>";
  databaseString += '<a href="/">Go back to homepage</a>';
  res.send(databaseString);
  const username = req.body.username;
  const password = req.body.password;

  async function run() {
    try {
      await client.connect();
      const database = client.db("MongoTestPub");
      const parts = database.collection("Data");

      const doc = {
        username: username,
        password: password,
      };

      await parts.insertOne(doc);
    } finally {
      await client.close();
    }
  }

  run().catch(console.dir);
});

app.all("/codingtopicpage", function (req, res) {
  var codingtopicpage = "<h1>Coding Topics</h1>";
  codingtopicpage += "<br>";
  codingtopicpage += "<h2>What's a language you would like to learn today?</h2>";
  codingtopicpage += "<img src='https://www.google.com/imgres?q=c%2B%2B%20image&imgurl=https%3A%2F%2Fimages.pexels.com%2Fphotos%2F276452%2Fpexels-photo-276452.jpeg&imgrefurl=https%3A%2F%2Fwww.pexels.com%2Fphoto%2Fcomputer-c-code-276452%2F&docid=tT04H85vNtV0mM&tbnid=Oqp72-z7c53fFM&vet=12ahUKEwiHtsnqwOaFAxXgTTABHT4lAjEQM3oECGQQAA..i&w=1920&h=1024&hcb=2&ved=2ahUKEwiHtsnqwOaFAxXgTTABHT4lAjEQM3oECGQQAA>";
  codingtopicpage += "<button onclick='showTextBox()'>Post</button>"; // Add a post button
  
  // Add a div to contain the text box (initially hidden) and the submitted text
  codingtopicpage += "<div id='textBoxDiv' style='display:none;'>";
  codingtopicpage += "<input type='text' id='textBox' placeholder='Enter your text'>";
  codingtopicpage += "<button onclick='submitText()'>Submit</button>";
  codingtopicpage += "<div id='submittedText'></div>"; // Div to display submitted text
  codingtopicpage += "</div>";

  // JavaScript functions to show/hide the text box and handle text submission
  codingtopicpage += "<script>";
  codingtopicpage += "function showTextBox() {";
  codingtopicpage += "  document.getElementById('textBoxDiv').style.display = 'block';";
  codingtopicpage += "}";
  codingtopicpage += "function submitText() {";
  codingtopicpage += "  var submittedText = document.getElementById('textBox').value;";
  codingtopicpage += "  var submittedTextDiv = document.getElementById('submittedText');";
  codingtopicpage += "  submittedTextDiv.innerHTML += '<p>' + submittedText + '</p>';"; // Display submitted text
  codingtopicpage += "}";
  codingtopicpage += "</script>";
  
  res.send(codingtopicpage);
});





// Route to write to the database:
// Access like this:  https://.....app.github.dev/api/mongowrite/partID&54321
// References:
// https://www.mongodb.com/docs/drivers/node/current/usage-examples/insertOne
// https://www.mongodb.com/docs/drivers/node/current/usage-examples/insertMany

