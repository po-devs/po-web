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
      if (substrRegex.test(str.value)) {
        matches.push(str);
      }
    });

    cb(matches);
  };
};

var pokesByName = {

};

var pokenames = [];

for (var num in pokedex.pokes.pokemons) {
    pokenames.push({"value": pokedex.pokes.pokemons[num], "num": pokeinfo.species(num), "forme": pokeinfo.forme(num)});
}

pokenames.sort(function(a, b) {return a.value > b.value;});

Poke.prototype.load = function(poke) {
    poke = pokeinfo.toObject(poke);
    this.num = poke.num;
    this.forme = poke.forme;

    this.types = pokeinfo.types(this);
    this.abilities = pokeinfo.abilities(this);
    this.ability = this.abilities[0];
    this.moves = [0,0,0,0];
    this.allMoves = pokeinfo.allMoves(this);
    this.moveNames = [];
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
    this.$moves = element.find(".tb-move-selection");
};

Poke.prototype.updateGui = function() 
{
    var self = this;

    if (this.moveNames.length == 0) {
        for (var i in this.allMoves) {
            this.moveNames.push({value: moveinfo.name(i), id: i});
        }
        this.moveNames.sort(function(a,b) {return a.value > b.value});
    }

    this.$sprite.attr("src", pokeinfo.sprite(this));
    this.$type1.attr("src", typeinfo.sprite(this.types[0]));

    for (var i = 0; i < 4; i++) {
        //this.$moves.eq(i).val(this.moves[i] == 0 ? "" : moveinfo.name(this.moves[i]));
    }

    if (1 in this.types) {
        this.$type2.attr("src", typeinfo.sprite(this.types[1]));
        this.$type2.show();
    } else {
        this.$type2.hide();
    }

    this.$moves.typeahead({
         hint: true,
         highlight: false
    },
    {
        name: "moves",
        display: "value",
        source: substringMatcher(this.moveNames)
    }).on("typeahead:select", function(event, sugg) {
        self.moves[$(this).attr("slot")] = sugg.id;
    });
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
      highlight: false,
    },
    {
      name: 'pokes',
      source: substringMatcher(pokenames),
      display: 'value',
      limit: 30,
      templates: {
        suggestion: Handlebars.compile('<div><strong>#{{num}}</strong> - {{value}}</div>')
      }
    }).on("typeahead:select", function(event, sugg) {
        var poke = team[$(this).attr("slot")];
        poke.load(sugg);
        poke.updateGui();
        $(this).typeahead('close');
    });

    content.find(".tb-poke-link").on("click", function(event) {
        event.stopPropagation();
        event.preventDefault();

        content.find(".tab").removeClass("current");
        content.find($(this).attr("href")).addClass("current");
        content.find(".tb-poke-pill").removeClass("active");
        $(this).closest(".tb-poke-pill").addClass("active");
    });

    content.find(".tb-move-selection").typeahead();
}

console.log("loading teambuilder js file");