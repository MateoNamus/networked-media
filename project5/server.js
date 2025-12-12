const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const Datastore = require("@seald-io/nedb");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = 9001;

const dialogdb = new Datastore({
  filename: "dialogs.txt",
  autoload: true
});

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "ejs");
app.set("views", [
  path.join(__dirname, "public"),
  path.join(__dirname, "views")
]);

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/form", (req, res) => {
  res.render("form");
});

app.get("/api/script/:branchId", (req, res) => {
  const branchId = req.params.branchId;

  dialogdb
    .find({ branch: branchId })
    .sort({ order: 1 })
    .exec((err, docs) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "database error" });
      }
      console.log("Loaded dialog lines:", docs.length, "for branch:", branchId);
      res.json(docs);
    });
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
