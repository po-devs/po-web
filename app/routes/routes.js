const router = require("express").Router();

router.get("/", function(req, res) {
  res.render("index", {config, postData: "null"});
});

router.post("/", function(req, res) {
  res.render("index", {config, postData: JSON.stringify(req.body)});
});

router.post("/podata.json", function(req, res) {
  res.set('Content-Type', 'text/podata');
  res.send(req.body.data);
});

router.get("/battle-canvas", function(req, res) {
  res.render("battle-canvas");
});

router.get("/simple-battle-canvas", function(req, res) {
  res.render("simple-battle-canvas");
});

router.get("/settings", function(req, res) {
  res.render("settings");
});

router.get("/teambuilder", function(req, res) {
  res.render("teambuilder", {load: req.query.load == "true" ? true : false});
});

router.use("/sets", require("./sets"));
router.use("/replay", require("./replay"));
router.use("/images", require("./images"));

module.exports = router;