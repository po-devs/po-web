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

    this.moves = [0,0,0,0];
    this.data = {};
    this.data.allMoves = pokeinfo.allMoves(this);
    this.data.moveNames = [];
    this.data.types = pokeinfo.types(this);
    this.data.abilities = pokeinfo.abilities(this);
    this.ability = this.abilities[0];
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

    this.ui = {};
    this.ui.sprite = element.find(".tb-sprite");
    this.ui.type1  = element.find(".tb-type1");
    this.ui.type2  = element.find(".tb-type2");
    this.ui.evs = [];
    this.ui.evVals = [];
    for (var i = 0; i < 6; i++) {
        this.ui.evs[i] = element.find(".tb-ev-row-" + i + " .tb-ev-slider");
        this.ui.evVals[i] = element.find(".tb-ev-row-" + i + " .tb-ev-value");
        this.ui.evs[i].slider({
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
            self.ui.evVals[i].val(self.evs[i]);
        });
        this.ui.evVals[i].data("slot", i).on("change", function() {
            var i = $(this).data("slot");
            self.evs[i] = +$(this).val();
            var surplus = self.evSurplus();
            
            if (surplus > 0) {
                self.evs[i] -= surplus;
                $(this).val(self.evs[i]);
            }
            self.ui.evs[i].slider("setValue", self.evs[i]);
        });
    }
    this.ui.moves = element.find(".tb-move-selection");
};

Poke.prototype.loadGui = function()
{
    if (this.ui.guiLoaded) {
        return;
    }
    if (!this.data) {
        this.load();
    }

    this.updateGui();
};

Poke.prototype.updateGui = function() 
{
    var self = this;
    this.ui.guiLoaded = true;

    if (this.data.moveNames.length == 0) {
        for (var i in this.data.allMoves) {
            this.data.moveNames.push({value: moveinfo.name(this.data.allMoves[i]), id: this.data.allMoves[i]});
        }
        this.data.moveNames.sort(function(a,b) {return a.value > b.value});
    }

    this.ui.sprite.attr("src", pokeinfo.sprite(this));
    this.ui.type1.attr("src", typeinfo.sprite(this.data.types[0]));

    for (var i = 0; i < 4; i++) {
        //this.$moves.eq(i).val(this.moves[i] == 0 ? "" : moveinfo.name(this.moves[i]));
    }

    if (1 in this.data.types) {
        this.ui.type2.attr("src", typeinfo.sprite(this.data.types[1]));
        this.ui.type2.show();
    } else {
        this.ui.type2.hide();
    }

    this.ui.moves.typeahead("destroy").typeahead({
         hint: true,
         highlight: false
    },
    {
        name: "moves",
        display: "value",
        limit: 15,
        source: substringMatcher(this.data.moveNames)
    }).on("typeahead:select", function(event, sugg) {
        self.moves[$(this).attr("slot")] = sugg.id;
    });
};

function Teambuilder (content) {
    var self = this;

    this.content = content;
    var team = this.team = webclient.team;
    for (var poke in team.pokes) {
        team.pokes[poke].setElement(content.find("#tb-poke-" + poke));
    }
    setTimeout(function(){team.pokes[0].loadGui()});

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
        var poke = team.pokes[$(this).attr("slot")];
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

        self.team.pokes[$(this).attr("slot")].loadGui();
    });

    content.find(".tb-move-selection").typeahead();
}

console.log("loading teambuilder js file");