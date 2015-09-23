var express = require('express');
var path = require('path');

var app = express();

console.log(__dirname + '/public');
app.use("/public", express.static(__dirname + '/public'));

app.get("/", function(req, res) {
    res.sendFile("index.html", {root: path.join(__dirname, '/')});
}) ;

app.listen(80);
