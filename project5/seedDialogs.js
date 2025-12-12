const Datastore = require("@seald-io/nedb");
const path = require("path");

// Load all dialogs from the JSON seed file
const seedData = require("./dialogs_seed.json");

// Use the same filename as in server.js
const dialogdb = new Datastore({
  filename: path.join(__dirname, "dialogs.txt"),
  autoload: true
});

// Clear old data, then insert new data
dialogdb.remove({}, { multi: true }, (err, numRemoved) => {
  if (err) {
    console.error("Error clearing dialogs:", err);
    process.exit(1);
  }

  console.log("Removed old dialogs:", numRemoved);

  dialogdb.insert(seedData, (err2, newDocs) => {
    if (err2) {
      console.error("Error inserting dialogs:", err2);
      process.exit(1);
    }

    console.log("Inserted dialogs:", newDocs.length);
    process.exit(0);
  });
});
