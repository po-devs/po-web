const router = require("express").Router();

router.get("/:gen/:animated(animated/|):back(back/|):shiny(shiny/|):female(female/|):num([\\d-]+).:ext(png|gif)", function (req, res, next) {
  //console.log(req.params);
  var par = req.params;

  var reconstructUrl = () => `/images/`+par.gen+"/"+par.animated+par.back + par.shiny + par.female + par.num + "." + par.ext;

  /* Remove possible factors making the sprite unreachable */
  if (par.female) {
    par.female = '';
  } else if (par.shiny) {
    par.shiny = '';
  } else if (par.num.includes('-')) {
    /* Remove forme */
    par.num = par.num.substr(0, par.num.indexOf('-'));
  } else {
    // no luck
    return next();
  }

  return res.redirect(reconstructUrl());
});

module.exports = router;