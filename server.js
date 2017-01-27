var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var compression = require('compression');

var config = require('./serverconfig.js');

var app = express();

app.use(compression());

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs'); 

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

app.use("/", express.static(__dirname + '/public'));
app.use("/", require("./app/routes/routes"));

app.on("error", e => {
  console.error(e);
});

if (config.local) {
  app.listen(config.web.port, "localhost");
} else {
  app.listen(config.web.port, () => {
    console.log(`Listening on port ${config.web.port}`);
  });
}

