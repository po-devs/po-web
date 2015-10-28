var express = require('express');
var path = require('path');
var bodyParser = require('body-parser')

var config = require('./serverconfig.js');

var app = express();

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

console.log(__dirname + '/public');
app.use("/public", express.static(__dirname + '/public'));

app.get("/", function(req, res) {
  res.render("index.kiwi", {postData: "null"});
});

app.post("/", function(req, res) {
  res.render("index.kiwi", {postData: JSON.stringify(req.body)});
});

app.post("/podata.json", function(req, res) {
  res.set('Content-Type', 'text/podata');
  res.send(req.body.data);
});

app.get("/battle-canvas.html", function(req, res) {
  res.render("battle-canvas.kiwi");
});

app.get("/settings.html", function(req, res) {
  res.render("settings.kiwi");
});

app.get("/teambuilder.html", function(req, res) {
	res.render("teambuilder.kiwi", {load: req.query.load == "true" ? true : false});
});

app.listen(config.web.port);
