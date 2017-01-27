const router = require("express").Router();

var sets = {
  "1": require("../../db/sets/setdex_rby.js"),
  "2": require("../../db/sets/setdex_gsc.js"),
  "3": require("../../db/sets/setdex_rse.js"),
  "4": require("../../db/sets/setdex_dpp.js"),
  "5": require("../../db/sets/setdex_bw.js"),
  "6": require("../../db/sets/setdex_xy.js")
};

router.get("/:gen/:pokemon",function(req,res){
  if (! (req.params.gen in sets)) {
    res.json({"error" : "Gen not found: " + req.params.gen});
  } else if (! (req.params.pokemon in sets[req.params.gen])) {
    res.json({"error" : "Pokemon not found in gen " + req.params.gen + ": " + req.params.pokemon});
  } else {
    res.json(sets[req.params.gen][req.params.pokemon]);
  }
});

module.exports = router;