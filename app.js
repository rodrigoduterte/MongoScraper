var createError = require('http-errors');
var express = require('express');
var path = require('path');


var mongoose = require('mongoose');
require("./models");
// connection to mongodb
mongoose.connect("mongodb://localhost/mongoscraper", { useNewUrlParser: true });


var app = express();
var exphbs = require("express-handlebars");
// var hbs = exphbs.create();

var home = require('./routes/home')[0];
var saved = require('./routes/saved');

// view engine setup
app.engine(".handlebars", exphbs({ defaultLayout: "main", extname: '.handlebars' }));
console.log(path.join(__dirname, 'views'));
app.set('views', path.join(__dirname, 'views'));
app.set("view engine", ".handlebars");

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use('/css',express.static(path.join(__dirname, 'public/css')));
app.use('/images',express.static(path.join(__dirname, 'public/images')));
// app.use('/js',express.static(path.join(__dirname, 'public/js')));
app.use('/',home);
app.use('/',saved);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
