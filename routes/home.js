var express = require("express");
var router = express.Router();
var db = require("../models");
var cheerio = require("cheerio");
var request = require("request");
var path = require("path");
var async = require('async');

// wrapped mongoose operations
var getArticles = function(req, res) {
  console.log("running getArticles for "+ req.path);
  function execFind(page, saved, home, title, res) {
    db.Article.find({ saved: saved }, function(err, data) {
      console.log("unsaved data: " + data);
      page === ""
        ? res.json(data)
        : res.render(page, { title: title, home: home, articles: data });
    });
  }
  if (req.path === "/") {
    execFind("home", false, true, "Mongo Scrapper Homepage", res);
  } else if (req.path === "/saved") {
    execFind("saved", true, false, "Mongo Scrapper Saved Articles", res);
  } else {
    setTimeout(function(){
      execFind("", false, false, "", res);
    },5000);
  }
};

router.use(
  "/js/app.js",
  express.static(path.join(__dirname, "../public/js/app.js"))
);

/* GET home page. */
router.get("/", function(req, res, next) {
  getArticles(req, res);
});

router.get("/api/scrape", function(req, res) {
  var articlesCount = 0;
  var headlines = [];
  request("https://www.cnn.com/articles", function(error, response, body) {
    console.log("statusCode:", response && response.statusCode); // Print the response status code if a response was received
    var $ = cheerio.load(body);
    $("h3.cd__headline").each(function() {
      var link = "https://www.cnn.com" + $(this).find("a").attr("href");
      var title = $(this).find("span.cd__headline-text").text();
      request(link, function(error, response, body) {
        var $$ = cheerio.load(body);
        var summary = $$(".zn-body__paragraph").eq(1).text();
        headlines.push({link:link, title:title, summary:summary, saved:false});
        if (headlines.length === 10) {
          async.each(
            headlines,
            function(headline, callback){
              db.Article.findOne({link: headline.link},
                function(err,found){
                  if(!found) {
                    db.Article.create(
                      {
                        link:headline.link, 
                        title:headline.title, 
                        summary:headline.summary, 
                        saved:false
                      }, function(err,created) {
                        // console.log(created);
                      }
                    );
                  }
              });
              callback();
            },
            function(err) {
              if(err){
                console.log(err);
              }
              else{
                console.log("All pool items have been upserted!");
                getArticles(req,res);
              }
            }
          );
        };
      });
    });
  });
});

router.put("/api/save/:id", function(req, res) {
  console.log(req.params.id);
  console.log("save set to true");
  db.Article.update({ _id: req.params.id }, { saved: true }, function() {
    console.log("saved!");
    res.end();
  });
});

router.delete("/api/clear", function(req, res) {
  db.Article.remove({}, function() {
    console.log("Articles deleted");
  });
  db.Note.remove({}, function() {
    console.log("Notes deleted");
  });
});

// module.exports = router;
module.exports = [router, getArticles];
