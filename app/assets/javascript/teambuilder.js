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

Poke.prototype.load = function(num) {
    this.num = pokeinfo.species(num);
    this.forme = pokeinfo.forme(num);

    this.types = pokeinfo.types(this);
    this.abilities = pokeinfo.abilities(this);
    this.ability = this.abilities[0];
    this.moves = [0,0,0,0];
    this.allMoves = pokeinfo.allMoves(this);
};

Poke.prototype.evSurplus = function() {
    var sum = 0;
    for (var i = 0; i < 6; i++) {
        sum = sum + this.evs[i];
    }
    return sum-512;
};

Poke.prototype.setElement = function(element) {
    var self = this;

    this.$sprite = element.find(".tb-sprite");
    this.$type1  = element.find(".tb-type1");
    this.$type2  = element.find(".tb-type2");
    this.$evs = [];
    this.$evVals = [];
    for (var i = 0; i < 6; i++) {
        this.$evs[i] = element.find(".tb-ev-row-" + i + " .tb-ev-slider");
        this.$evVals[i] = element.find(".tb-ev-row-" + i + " .tb-ev-value");
        this.$evs[i].slider({
            // formatter: function(value) {
            //     return 'Current EV: ' + value;
            // }
        }).data("slot", i).on("change", function(event) {
            var i = $(this).data("slot");
            //console.log(arguments);
            self.evs[i] = event.value.newValue;
            var surplus = self.evSurplus();
            if (surplus > 0) {
                self.evs[i] -= surplus;
                $(this).slider("setValue", self.evs[i]);
            }
            self.$evVals[i].val(self.evs[i]);
        });
        this.$evVals[i].data("slot", i).on("change", function() {
            var i = $(this).data("slot");
            self.evs[i] = +$(this).val();
            var surplus = self.evSurplus();
            
            if (surplus > 0) {
                self.evs[i] -= surplus;
                $(this).val(self.evs[i]);
            }
            self.$evs[i].slider("setValue", self.evs[i]);
        });
    }
};

Poke.prototype.updateGui = function() 
{
    this.$sprite.attr("src", pokeinfo.sprite(this));
    this.$type1.attr("src", typeinfo.sprite(this.types[0]));

    if (1 in this.types) {
        this.$type2.attr("src", typeinfo.sprite(this.types[1]));
        this.$type2.show();
    } else {
        this.$type2.hide();
    }
};

function Teambuilder (content) {
    this.content = content;
    var team = this.team = webclient.team;
    for (var poke in team) {
        team[poke].setElement(content.find("#tb-poke-" + poke));
    }
    console.log("Teambuilder constructor");

    content.find(".tb-poke-selection").typeahead({
      hint: true,
      highlight: true,
    },
    {
      name: 'pokes',
      source: substringMatcher(pokenames)
    }).on("typeahead:select", function(event, sugg) {
        var poke = team[$(this).attr("slot")];
        poke.load(pokesByName[sugg]);
        poke.updateGui();
    });
}

console.log("loading teambuilder js file");