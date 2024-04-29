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

      //T3.2
      if (cookieHelper) {
        res.cookie("user", username, { maxAge: 30000, httpOnly: true });
        res.send(
          "You are now logged in :)" +
            '<br><a href="/">Go back to homepage</a><br>' +
            '<a href="/cookiesCookiesCookies">Click to see all the cookies</a>'
        );
        //T3.1
      } else {
        res.send(
          "The username or password is wrong. Click the link to go back and try again" +
            '<a href="/login">Go back to login</a><br><br>' +
            '<a href="/">Click to go back to homepage</a><br><br>' +
            '<a href="/cookiesCookiesCookies">Click to see all the cookies</a>'
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
  registerString +=
    '<a href="/cookiesCookiesCookies">Click to see all the cookies</a>';

  registerString += "</form>";
  res.send(registerString);
});

app.all("/afterRegisterSubmit", function (req, res) {
  const client = new MongoClient(uri);
  var databaseString = "<p>You are now registered into the database!</p>";
  databaseString += '<a href="/">Go back to homepage</a>';
  databaseString +=
    '<a href="/cookiesCookiesCookies">Click to see all the cookies</a>';
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

//T4
app.all("/cookiesCookiesCookies", function (req, res) {
  const mycookies = req.cookies;
  const cookieString =
    JSON.stringify(mycookies) +
    '<br><br><a href="/terminateCookies">Click to go to the cookie termination page</a><br><br>';
  res.send(cookieString);
});

//T5
app.all("/terminateCookies", function (req, res) {
  if (req.cookies) {
    for (var cookie in req.cookies) {
      res.clearCookie(cookie);
    }
  }
  res.send(
    '<a href="/cookiesCookiesCookies">Click here to see all the cookies</a><br><br><a href="/">Click here to go to the homepage</a>'
  );
});

// Access Example-2
// Route to access database using two parameters:
app.get("/api/mongo2/:inpkey&:item", function (req, res) {
  // access as ...app.github.dev/api/mongo2/partID&12345
  console.log("inpkey: " + req.params.inpkey + " item: " + req.params.item);

  const client = new MongoClient(uri);

  async function run() {
    try {
      const database = client.db("ckmdb");
      const where2look = database.collection("cmps415");

      // Here we will make a query object using the parameters provided with the route
      // as they key:value pairs
      const query = {};
      query[req.params.inpkey] = req.params.item;

      console.log("Looking for: " + JSON.stringify(query));

      const part = await where2look.findOne(query);
      console.log("Found this entry: ", part);
      res.send("Found this: " + JSON.stringify(part)); //Use stringify to print a json
    } finally {
      // Ensures that the client will close when you finish/error
      await client.close();
    }
  }
  run().catch(console.dir);
});

// Route to write to the database:
// Access like this:  https://.....app.github.dev/api/mongowrite/partID&54321
// References:
// https://www.mongodb.com/docs/drivers/node/current/usage-examples/insertOne
// https://www.mongodb.com/docs/drivers/node/current/usage-examples/insertMany

