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
        const topics = database.collection("Topics");
  
        const user = await data.findOne({
          username: username,
          password: password,
        });
  
        if (user) {
          const allTopics = await topics.find({}).toArray(); // Fetch all topics
          let topicsHtml = allTopics.map(topic => `<li><a href="/topic/${topic._id}">${topic.TitleOfTopic}</a></li>`).join('');
  
          res.cookie("user", username, { maxAge: 30000, httpOnly: true });
          res.send(
            "You are now logged in :) <br>" +
            `<ul>${topicsHtml}</ul>` +
            '<p><a href="/">Go back to homepage</a></p>'
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


  app.get("/topic/:topicId", function(req, res) {
    const topicId = req.params.topicId;
    const client = new MongoClient(uri);
  
    async function run() {
      try {
        await client.connect();
        const database = client.db("MongoTestPub");
        const topics = database.collection("Topics");
        
        const topic = await topics.findOne({_id: new MongoClient.ObjectId(topicId)});
  
        if (topic) {
          res.send(`<h1>${topic.TitleOfTopic}</h1><a href="/afterLoginSubmit">Back to topics</a>`);
        } else {
          res.send("Topic not found <br><a href='/afterLoginSubmit'>Back to topics</a>");
        }
      } finally {
        await client.close();
      }
    }
  
    run().catch(console.dir);
  });
  
  

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
  codingtopicpage += "<p>What's a language you would like to learn today?</p>";
  codingtopicpage += "<img src='https://wallpapers.com/images/hd/coding-background-9izlympnd0ovmpli.jpg' style='max-width: 50%;'>"; // Set max-width to make the photo smaller

  codingtopicpage +="<br>"
  codingtopicpage +="<br>"
  codingtopicpage +="<button onclick='showTextBox()'>Post</button>"; // Button to show the text box

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
  codingtopicpage += "  submittedTextDiv.innerHTML += '<p>' + submittedText + '</p>';"; // Append submitted text
  codingtopicpage += "}";
  codingtopicpage += "</script>";

  res.send(codingtopicpage);
});





// Route to write to the database:
// Access like this:  https://.....app.github.dev/api/mongowrite/partID&54321
// References:
// https://www.mongodb.com/docs/drivers/node/current/usage-examples/insertOne
// https://www.mongodb.com/docs/drivers/node/current/usage-examples/insertMany

