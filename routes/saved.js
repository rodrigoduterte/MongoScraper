var express = require("express");
var router = express.Router();
var db = require("../models");
var getArticles = require("./home")[1];
var path = require("path");

router.use(
  "/js/saved.js",
  express.static(path.join(__dirname, "../public/js/saved.js"))
);
console.log(path.join(__dirname, "../public/js/saved.js"));

/* GET saved articles. */
router.get("/saved", function(req, res, next) {
  // app.use('public',express.static(path.join(__dirname, '../publicTwo')));
  // res.render('saved',{ title: "Mongo Scrapper Saved Articles", home: false });
  getArticles(req, res);
});

router.get("/api/notes/:id", function(req, res) {
  db.Article.findOne({ _id: req.params.id })
    .populate("notes")
    .then(function(article) {
      res.json(article.notes);
      console.log(JSON.stringify(article.notes));
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

router.post("/api/notes", function(req, res) {
  db.Note.create({ body: req.body.noteText })
    .then(function(note) {
      return db.Article.findOneAndUpdate(
        { _id: req.body.headlineId },
        { $push: { notes: note._id } },
        { new: true }
      );
    })
    .then(function(article) {
      res.json(article);
    })
    .catch(function(error) {
      res.json(error);
    });
});

router.delete("/api/:type/:id", function(req, res) {
  console.log(req.params.type);
  console.log(req.params.id);
  if (req.params.type === "article") {
    db.Article.findOneAndRemove({ _id: req.params.id }, function(err,article) {
      res.json({});
      console.log("Saved article deleted");
      console.log(article.notes.map(note => note._id));
      var notes = article.notes.map(note => note._id);
      db.Note.deleteMany({_id: { $in: notes }}, function(err,result){
        console.log(result);
        console.log("Notes associated with the deleted article are deleted as well");
      });
    });
  } else if (req.params.type === "note") {
    db.Note.findOneAndRemove({ _id: req.params.id }, function() {
      res.json({});
      console.log('One note deleted');
    });
  }
});

router.delete("/api/clear", function(req, res) {
  db.Article.remove({}, function() {
    console.log("Articles deleted");
  });
  db.Note.remove({}, function() {
    console.log("Notes deleted");
  });
});

module.exports = router;
