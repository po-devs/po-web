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

var sets = {
  "1": require("./db/sets/setdex_rby.js"),
  "2": require("./db/sets/setdex_gsc.js"),
  "3": require("./db/sets/setdex_rse.js"),
  "4": require("./db/sets/setdex_dpp.js"),
  "5": require("./db/sets/setdex_bw.js"),
  "6": require("./db/sets/setdex_xy.js")
};

var setRouter = express.Router();

setRouter.get("/:gen/:pokemon",function(req,res){
  if (! (req.params.gen in sets)) {
    res.json({"error" : "Gen not found: " + req.params.gen});
  } else if (! (req.params.pokemon in sets[req.params.gen])) {
    res.json({"error" : "Pokemon not found in gen " + req.params.gen + ": " + req.params.pokemon});
  } else {
    res.json(sets[req.params.gen][req.params.pokemon]);
  }
});

app.use("/sets", setRouter);

var replayRouter = express.Router();

replayRouter.get("/:battleid", function(req, res) {
  res.render("replay.kiwi", {"battleid": req.params.battleid});
});

app.use("/replay", replayRouter);

app.listen(config.web.port);
