const router = require("express").Router();

router.get("/:battleid", function(req, res) {
  res.render("replay", {"battleid": req.params.battleid});
});

module.exports = router;