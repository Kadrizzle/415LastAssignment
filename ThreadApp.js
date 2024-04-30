const { MongoClient } = require("mongodb");


const uri =
  "mongodb+srv://Kadazzle:kadizzleinthehizzle@cluster0.xgaaecl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// --- This is the standard stuff to get it to work on the browser
const express = require("express");
const app = express();
const port = 3000;
const cookieParser = require("cookie-parser");
const session = require('express-session');
app.listen(port);
console.log("Server started at http://localhost:" + port);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: false,
}));

app.get("/", function (req, res) {
  var mycookies = req.cookies;

  var outstring = "<h1>HOMEPAGE</h1>";
  outstring += '<p><a href="./register">Go to register</a></p>';
  outstring += '<p><a href="./login">Go to login</a></p><br><br>';

  res.send(outstring);

});

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

          if (!user) {
              res.status(401).send("Unauthorized: Username or password is incorrect");
              return;
          }

          const allTopics = await topics.find({}).toArray(); // Fetch all topics
          let topicsHtml = allTopics.map(topic => `
              <h1>${topic.TitleOfTopic} Topic</h1>
              <div style="margin-bottom: 20px;">
                  <a href="/topic/${topic._id}">
                      <img src="${topic.TitleOfTopic === 'Coding' ? 'https://wallpapers.com/images/hd/coding-background-9izlympnd0ovmpli.jpg' : 'https://www.hartz.com/wp-content/uploads/2020/03/3270011244_Hartz_Disposable_Dog_Diapers_large_dogs_1300x1300.jpg'}" alt="${topic.TitleOfTopic}" style="max-width: 50%; height: auto; margin-right: 20px;">
                  </a>
              </div>
          `).join('');

          res.cookie("user", username, { maxAge: 86400000, httpOnly: true });
          res.send(
              `<h1>Topics</h1>` +
              `${topicsHtml}` +
              '<p><a href="/">Go back to homepage</a></p>'
          );
      } catch (error) {
          console.error("Error during database operation", error);
          res.status(500).send("Internal Server Error: " + error.message);
      } finally {
          await client.close();
      }
  }

  run().catch(console.dir);
});



  const { ObjectId } = require("mongodb");


  app.get("/topic/:topicId", function(req, res) {
    const topicObjectId = req.params.topicId;
    const client = new MongoClient(uri);
  
    async function run() {
      try {
        await client.connect();
        const database = client.db("MongoTestPub");
        const topics = database.collection("Topics");
        const topicMessages = database.collection("TopicMessages");
        

        const topic = await topics.findOne({_id: new ObjectId(topicObjectId)}); 
        if (!topic) {
          res.send("Topic not found <br><a href='/afterLoginSubmit'>Back to topics</a>");
          return;
        }
  
        // Fetch messages that match the topicId
        const allTopicMessages = await topicMessages.find({ TopicId: new ObjectId(topicObjectId) }).toArray();
        let topicMessagesHtml = allTopicMessages.map(topicMessage => `<p>${topicMessage.Message}</p>`).join('');
    
        // Display the topic and its messages


        var topicPageContent = `<h1 style="text-align:center; font-size:50px;">${topic.TitleOfTopic}</h1>`;
        topicPageContent += `<div style="text-align:center;">${topicMessagesHtml}</div>`;
        topicPageContent += `<div style="text-align:center; margin:20px;">`;
        topicPageContent += `<button style="padding:10px 20px; font-size:30px;" onclick="showTextBox()">Post</button>`;
        topicPageContent += `</div>`;
        topicPageContent += `<div id="textBoxDiv" style="display:none; text-align:center; margin:20px;">`;
        topicPageContent += `<input type='text' id='textBox' placeholder='Enter your text' style="padding:5px; width:50%; font-size:30px;">`;
        topicPageContent += `<button style="padding:10px 20px; font-size:30px;" onclick="submitText()">Submit</button>`;
        topicPageContent += `<div id="submittedText" style="margin-top:20px;"></div>`;
        topicPageContent += `</div>`;
        
        topicPageContent += "<script>";
        topicPageContent += "function showTextBox() {";
        topicPageContent += "document.getElementById('textBoxDiv').style.display = 'block';";
        topicPageContent += "}";
        topicPageContent += "function submitText() {";
        topicPageContent += "var submittedText = document.getElementById('textBox').value;";
        topicPageContent += "var submittedTextDiv = document.getElementById('submittedText');";
        topicPageContent += "submittedTextDiv.innerHTML += '<p style=\"font-size: 20px; margin: 5px 0;\">' + submittedText + '</p>';";  // Increased font size here
        topicPageContent += "}";
        topicPageContent += "</script>";
        
        
        topicPageContent += `<p style="text-align:center;"><a href="/afterLoginSubmit" style="background-color: #4CAF50; color: white; padding: 15px 30px; text-align: center; text-decoration: none; display: inline-block; font-size: 20px; border-radius: 5px; cursor: pointer;">Back to topics</a></p>`;

        

        res.send(topicPageContent);

      } catch (error) {
        console.error("Failed during topic detail fetch", error);
        res.status(500).send("Server error: " + error.message);
      } finally {
        await client.close();
      }
    }
  
    run().catch(console.dir);
  });

app.all("/topic/:topicId/messageSubmit", function(res, req){
  const topicObjectId = req.params.topicId;
  const messageInserted = req.params.message;

  async function run(){
    try{
      await client.connect();
      const database = client.db("MongoTestPub");
      const message = database.collection("TopicMessages");

      const messageToEnterInDatabase = {
        Message: messageInserted,
        TopicId: topicObjectId,
      };

      await message.insertOne(messageToEnterInDatabase);
    } finally {
      await client.close();
    }
  }
  run().catch(console.dir);
  // res.redirect("/topic/${topicObjectId}");
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
  codingtopicpage += "<img src='https://wallpapers.com/images/hd/coding-background-9izlympnd0ovmpli.jpg' style='max-width: 50%;'>"; 
  codingtopicpage += "<br>"
  codingtopicpage += "<br>"

  codingtopicpage +="<button onclick='showTextBox()'>Post</button>"; 
  codingtopicpage += "<div id='textBoxDiv' style='display:none;'>";
  codingtopicpage += "<input type='text' id='textBox' placeholder='Enter your text'>";
  codingtopicpage += "<button onclick='submitText()'>Submit</button>";
  codingtopicpage += "<div id='submittedText'></div>"; 
  codingtopicpage += "</div>";

  codingtopicpage += "<script>";
  codingtopicpage += "function showTextBox() {";
  codingtopicpage += "document.getElementById('textBoxDiv').style.display = 'block';";
  codingtopicpage += "}";
  codingtopicpage += "function submitText() {";
  codingtopicpage += "var submittedText = document.getElementById('textBox').value;";
  codingtopicpage += "var submittedTextDiv = document.getElementById('submittedText');";
  codingtopicpage += "submittedTextDiv.innerHTML += '<p>' + submittedText + '</p>';";
  codingtopicpage += "}";
  codingtopicpage += "</script>";

  res.send(codingtopicpage);
});

app.all("/dogs", function (req, res) {
  var dogs = "<h1>Dogs</h1>";
  dogs += "<br>";
  dogs += "<p>What's your favorite type of dog?</p>";
  dogs += "<img src='https://www.hartz.com/wp-content/uploads/2020/03/3270011244_Hartz_Disposable_Dog_Diapers_large_dogs_1300x1300.jpg' style='max-width: 50%;'>"; 
  dogs += "<br>"
  dogs += "<br>"

  dogs +="<button onclick='showTextBox()'>Post</button>"; 
  dogs += "<div id='textBoxDiv' style='display:none;'>";
  dogs += "<input type='text' id='textBox' placeholder='Enter your text'>";
  dogs += "<button onclick='submitText()'>Submit</button>";
  dogs += "<div id='submittedText'></div>"; 
  dogs += "</div>";

  dogs += "<script>";
  dogs += "function showTextBox() {";
  dogs += "document.getElementById('textBoxDiv').style.display = 'block';";
  dogs += "}";
  dogs += "function submitText() {";
  dogs += "var submittedText = document.getElementById('textBox').value;";
  dogs += "var submittedTextDiv = document.getElementById('submittedText');";
  dogs += "submittedTextDiv.innerHTML += '<p>' + submittedText + '</p>';";
  dogs += "}";
  dogs += "</script>";

  res.send(dogs);
});





// Route to write to the database:
// Access like this:  https://.....app.github.dev/api/mongowrite/partID&54321
// References:
// https://www.mongodb.com/docs/drivers/node/current/usage-examples/insertOne
// https://www.mongodb.com/docs/drivers/node/current/usage-examples/insertMany

