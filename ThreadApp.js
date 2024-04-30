const { MongoClient, ObjectId } = require("mongodb");
const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");

const uri =
  "mongodb+srv://Kadazzle:kadizzleinthehizzle@cluster0.xgaaecl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

class Database {
  constructor() {
    if (!Database.instance) {
      this.client = new MongoClient(uri);
      Database.instance = this;
    }
    return Database.instance;
  }

  async connect() {
    try {
      await this.client.connect();
      console.log("Connected to MongoDB Atlas");
    } catch (error) {
      console.error("Error connecting to MongoDB Atlas", error);
    }
  }

  getClient() {
    return this.client;
  }
}

class Observer {
  notify(data) {
    this.Observer.forEach((observer) => observer(data));
  }
}

class Topic {
  constructor() {
    this.observers = [];
  }

  addObserver(observer) {
    this.observers.push(observer);
  }

  removeObserver(observer) {
    this.observers = this.observers.filter((obs) => obs !== observer);
  }

  notifyObservers() {
    this.observers.forEach((observer) => observer.notify());
  }
}

const databaseInstance = new Database();

const topicObserver = new Observer();
const topicInstance = new Topic();
topicInstance.addObserver(topicObserver);

const app = express();
const port = 3000;

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

app.get("/", function (req, res) {
  var mycookies = req.cookies;

  var outstring = "<h1>HOMEPAGE</h1>";
  outstring += '<p><a href="./register">Go to register</a></p>';
  outstring += '<p><a href="./login">Go to login</a></p><br><br>';

  res.send(outstring);
});

app.all("/login", function (req, res) {
  var loginString = "<style>";
  loginString +=
    "body { font-size: 18px; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif; }";
  loginString += "form { text-align: center; }";
  loginString +=
    'input[type="text"], input[type="submit"] { margin-top: 10px; padding: 10px; width: 200px; font-size: 16px; }';
  loginString +=
    "a { display: inline-block; margin-top: 20px; font-size: 16px; }";
  loginString += "</style>";

  loginString += '<form action="/afterLoginSubmit" method="POST">';
  loginString += "<h1>LOGIN</h1>";
  loginString += "<label>Username: </label>";
  loginString += '<input type="text" id="username" name="username"><br>';
  loginString += "<label>Password: </label>";
  loginString += '<input type="text" id="password" name="password">';
  loginString += '<br><input type="submit" value="Submit"><br>';
  loginString += '<a href="/">Go back to homepage</a><br><br>';
  loginString += "</form>";

  res.send(loginString);
});

app.all("/afterLoginSubmit", function (req, res) {
  const username = req.body.username;
  const password = req.body.password;
  const client = databaseInstance.getClient();

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

      const allTopics = await topics.find({}).toArray(); // Fetch all topics
      let topicsHtml = allTopics
        .map(
          (topic) => `
          <h1>${topic.TitleOfTopic} Topic</h1>
          <div style="margin-bottom: 20px;">
              <a href="/topic/${topic._id}">
              <img src="${
                topic.TitleOfTopic === "Coding"
                  ? "https://wallpapers.com/images/hd/coding-background-9izlympnd0ovmpli.jpg"
                  : "https://www.hartz.com/wp-content/uploads/2020/03/3270011244_Hartz_Disposable_Dog_Diapers_large_dogs_1300x1300.jpg"
              }" alt="${
            topic.TitleOfTopic
          }" style="max-width: 20%; height: auto; margin-right: 20px; border: 2px solid #000; padding: 5px;">
              </a>
          </div>
      `
        )
        .join("");

      const addTopicForm = `
      <div style="text-align: center;">
          <h2>Add a New Topic</h2>
          <form action="/addTopic" method="POST" style="display: inline-block;">
              <input type="text" name="TitleOfTopic" placeholder="Enter new topic title" style="padding: 10px; width: 300px; font-size: 16px;" required>
              <input type="submit" value="Add Topic" style="padding: 10px 20px; background-color: #007BFF; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;">
          </form>
      </div>
  `;

      res.cookie("user", username, { maxAge: 86400000, httpOnly: true });
      res.send(
        `<h1>Welcome ${username}</h1>` +
          `${topicsHtml}` +
          `${addTopicForm}` +
          '<p style="text-align: center;"><a href="/" style="display: inline-block; padding: 10px 20px; background-color: #007BFF; color: white; text-decoration: none; border-radius: 5px;">Go back to homepage</a></p>'
      );
    } catch (error) {
      console.error("Error during database operation", error);
      res.status(500).send("Internal Server Error: " + error.message);
    }
  }

  run().catch(console.dir);
});

app.post("/addTopic", function (req, res) {
  const newTopicTitle = req.body.TitleOfTopic;
  const client = databaseInstance.getClient();

  async function run() {
    try {
      const database = client.db("MongoTestPub");
      const topics = database.collection("Topics");

      // Insert the new topic into the database
      await topics.insertOne({ TitleOfTopic: newTopicTitle });
      res.redirect("/afterLoginSubmit"); // Redirect back to the topics page
    } catch (error) {
      console.error("Failed to add new topic", error);
      res.status(500).send("Error adding new topic");
    }
  }

  run().catch(console.dir);
});

app.get("/topic/:topicId", function (req, res) {
  const topicObjectId = req.params.topicId;
  const client = databaseInstance.getClient();

  async function run() {
    try {
      await client.connect();
      const database = client.db("MongoTestPub");
      const topics = database.collection("Topics");
      const topicMessages = database.collection("TopicMessages");

      const topic = await topics.findOne({ _id: new ObjectId(topicObjectId) });
      if (!topic) {
        res.send(
          "Topic not found <br><a href='/afterLoginSubmit'>Back to topics</a>"
        );
        return;
      }

      // Fetch messages that match the topicId
      const allTopicMessages = await topicMessages
        .find({ TopicId: new ObjectId(topicObjectId) })
        .toArray();
      let topicMessagesHtml = allTopicMessages
        .map((topicMessage) => `<p>${topicMessage.Message}</p>`)
        .join("");

      // Display the topic and its messages

      var topicPageContent = `<h1 style="text-align:center; font-size:50px;">${topic.TitleOfTopic}</h1>`;
      topicPageContent += `<div style="text-align:center; margin:20px;">`;
      topicPageContent += `<button style="padding:10px 20px; font-size:30px;" onclick="showTextBox()">Post</button>`;
      topicPageContent += `</div>`;
      topicPageContent += `<div id="textBoxDiv" style="display:none; text-align:center; margin:20px;">`;
      topicPageContent += `<input type='text' id='textBox' placeholder='Enter something to post on the forum' style="padding:5px; width:50%; font-size:30px;">`;
      topicPageContent += `<button style="padding:10px 20px; font-size:30px;" onclick="submitText()">Submit</button>`;
      topicPageContent += `<div style="text-align:center;">${topicMessagesHtml}</div>`;
      topicPageContent += `<div id="submittedText" style="margin-top:20px;"></div>`;
      topicPageContent += `</div>`;

      topicPageContent += "<script>";
      topicPageContent += "function showTextBox() {";
      topicPageContent +=
        "document.getElementById('textBoxDiv').style.display = 'block';";
      topicPageContent += "}";
      topicPageContent += "function submitText() {";
      topicPageContent +=
        "var submittedText = document.getElementById('textBox').value;";
      topicPageContent +=
        "var submittedTextDiv = document.getElementById('submittedText');";
      topicPageContent +=
        "submittedTextDiv.innerHTML += '<p style=\"font-size: 20px; margin: 5px 0;\">' + submittedText + '</p>';"; // Increased font size here
      topicPageContent += "}";
      topicPageContent += "</script>";

      topicPageContent += `<p style="text-align:center;"><a href="/afterLoginSubmit" style="background-color: #4CAF50; color: white; padding: 15px 30px; text-align: center; text-decoration: none; display: inline-block; font-size: 20px; border-radius: 5px; cursor: pointer;">Back to topics</a></p>`;

      topicObserver.notify("user is now on topic page");

      res.send(topicPageContent);
    } catch (error) {
      console.error("Failed during topic detail fetch", error);
      res.status(500).send("Server error: " + error.message);
    }
  }

  run().catch(console.dir);
});

app.all("/topic/:topicId/messageSubmit", function (req, res) {
  const topicObjectId = req.params.topicId;
  const messageInserted = req.params.message;
  const client = databaseInstance.getClient();

  async function run() {
    try {
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
  const username = req.body.username;
  const password = req.body.password;
  const client = databaseInstance.getClient();

  async function run() {
    try {
      const database = client.db("MongoTestPub");
      const parts = database.collection("Data");

      const doc = {
        username: username,
        password: password,
      };

      await parts.insertOne(doc);
      res.send(
        "<p>You are now registered into the database!</p><a href='/'>Go back to homepage</a>"
      );
    } finally {
      await client.close();
    }
  }

  run().catch(console.dir);
});
