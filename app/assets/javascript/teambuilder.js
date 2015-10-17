webclient.teambuilderLoaded = true;

var substringMatcher = function(strs) {
  return function findMatches(q, cb) {
    var matches, substringRegex;

    // an array that will be populated with substring matches
    matches = [];

    // regex used to determine if a string contains the substring `q`
    substrRegex = new RegExp("^"+q, 'i');

    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    $.each(strs, function(i, str) {
      if (substrRegex.test(str)) {
        matches.push(str);
      }
    });

    cb(matches);
  };
};

var pokesByName = {

};

for (var num in pokedex.pokes.pokemons) {
	pokesByName[pokedex.pokes.pokemons[num]] = num;
}

var pokenames = Object.keys(pokesByName).sort();

function Teambuilder (content) {
	this.content = content;
	console.log("Teambuilder constructor");

	content.find(".tb-poke-selection").typeahead({
	  hint: true,
	  highlight: true,
	},
	{
	  name: 'states',
	  source: substringMatcher(pokenames)
	}).on("typeahead:select", function(event, sugg) {
		$(this).closest(".tb-poke").find(".tb-sprite").attr("src",pokeinfo.sprite(pokesByName[sugg]));
	});
}

console.log("loading teambuilder js file");