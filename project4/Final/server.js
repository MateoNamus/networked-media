const express = require("express");
const bodyParser = require("body-parser");
const nedb = require("@seald-io/nedb");
const app = express();
const encodedParser = bodyParser.urlencoded({ extended: true });
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(encodedParser);
app.set("view engine", "ejs");

const database = new nedb({
  filename: "database.txt",
  autoload: true,
});

app.get("/", (req, res) => {
  res.redirect("/add");
});

app.get("/add", (req, res) => {
  let query = {};
  let sortQuery = {
    timestamp: -1,
  };
  database
    .find(query)
    .sort(sortQuery)
    .exec((err, dataInDB) => {
      console.log(dataInDB);
      if (err) {
        res.render("form.ejs", {});
      }
      res.render("form.ejs", { posts: dataInDB });
    });
});

app.post("/post", uploadProcessor.single("image"), (req, res) => {
  let currentTime = new Date();

  console.log("Form body:", req.body);

  let postToBeAddedToDB = {
    date: currentTime.toLocaleString(),
    text: req.body.text,
    timestamp: currentTime.getTime(),
  };

  database.insert(postToBeAddedToDB, (err, dataThatHasBeenAdded) => {
    if (err) {
      console.log("Insert error:", err);
    } else {
      console.log("Inserted:", dataThatHasBeenAdded);
    }
    res.redirect("/add");
  });
});

app.get("/all-posts", (req, res) => {
  let query = {};

  database.find(query).exec((err, data) => {
    if (err) {
      console.log("DB error on /all-posts:", err);
      return res.json({ posts: [] });
    }
    res.json({ posts: data });
  });
});

app.get("/posts", (req, res) => {
  let query = {};

  database.find(query).exec((err, data) => {
    if (err) {
      console.log("DB error on /posts:", err);
      return res.json({ posts: [] });
    }
    res.json({ posts: data });
  });
});

app.listen(7001, () => {
  console.log("server running on http://127.0.0.1:7001");
});
