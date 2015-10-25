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
    if (!q || q.length == 0) {
        matches = strs;
    } else {
        $.each(strs, function(i, str) {
            if (substrRegex.test(str.value)) {
                matches.push(str);
             }
        });    
    }
    
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

var itemnames = [];

for (var num in Object.keys(iteminfo.usefulList())) {
    itemnames.push({"value": iteminfo.name(num), "num": num});
}

Poke.prototype.load = function(poke) {
    var alreadySet = false;

    if (this.num && pokeinfo.toNum(this) == pokeinfo.toNum(poke)) {
        alreadySet = true;
    } else {
        this.reset();
    }
    poke = pokeinfo.toObject(poke);
    this.num = poke.num;
    this.forme = poke.forme;

    this.data = {};
    this.data.allMoves = pokeinfo.allMoves(this);
    this.data.moveNames = [];
    this.data.types = pokeinfo.types(this);
    this.data.abilities = pokeinfo.abilities(this);
    this.data.gender = pokeinfo.gender(this);

    if (!this.data.abilities[2] || this.data.abilities[2] == this.data.abilities[0]) {
        this.data.abilities.splice(2, 1);
    }
    if (!this.data.abilities[1] || this.data.abilities[1] == this.data.abilities[0]) {
        this.data.abilities.splice(1, 1);
    }

    if (!alreadySet) {
        this.nick = this.num == 0 ? "" : pokeinfo.name(this);
        this.ability = this.data.abilities[0];
        this.gender = this.data.gender == 3 ? (1 + Math.floor(2*Math.random())) : this.data.gender;
    }
};

Poke.prototype.evSurplus = function() {
    var sum = 0;
    for (var i = 0; i < 6; i++) {
        sum = sum + this.evs[i];
    }
    return sum-510;
};

Poke.prototype.setElement = function(element) {
    var self = this;

    this.ui = {};
    this.ui.sprite = element.find(".tb-sprite");
    this.ui.type1  = element.find(".tb-type1");
    this.ui.type2  = element.find(".tb-type2");
    this.ui.evs = [];
    this.ui.evVals = [];
    this.ui.stats = [];
    for (var i = 0; i < 6; i++) {
        this.ui.evs[i] = element.find(".tb-ev-row-" + i + " .tb-ev-slider");
        this.ui.evVals[i] = element.find(".tb-ev-row-" + i + " .tb-ev-value");
        this.ui.stats[i] = element.find(".tb-ev-row-" + i + " .tb-stat");
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
            self.updateStatGui(i);
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
            self.updateStatGui(i);
        });
    }
    this.ui.moves = element.find(".tb-move-selection");
    this.ui.poke = element.find(".tb-poke-selection");
    this.ui.item = element.find(".tb-item-selection");
    this.ui.ability = element.find(".tb-ability-selection");
    this.ui.genders = element.find(".tb-genders");

    this.ui.genders.on("click", ".tb-gender", function() {
        if ($(this).hasClass("tb-gender-1")) {
            self.gender = 1;
        } else if ($(this).hasClass("tb-gender-2")) {
            self.gender = 2;
        } else {
            self.gender = 0;
        }
    });
};

Poke.prototype.updateStatGui = function(stat) {
    var calced = pokeinfo.calculateStat(this, stat);
    this.ui.stats[stat].text(calced);
};

Poke.prototype.loadGui = function()
{
    if (this.ui.guiLoaded) {
        return;
    }
    if (!this.data) {
        this.load(this);
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

    for (var i = 0; i < 6; i++) {
        self.ui.evs[i].slider("setValue", self.evs[i]);
        self.ui.evVals[i].val(self.evs[i]);
        this.updateStatGui(i);
    }

    this.ui.sprite.attr("src", pokeinfo.sprite(this));
    this.ui.type1.attr("src", typeinfo.sprite(this.data.types[0]));

    for (var i = 0; i < 4; i++) {
        this.ui.moves.eq(i).val(this.moves[i] == 0 ? "" : moveinfo.name(this.moves[i]));
    }

    this.ui.item.val(this.item ? iteminfo.name(this.item) : "");

    if (1 in this.data.types) {
        this.ui.type2.attr("src", typeinfo.sprite(this.data.types[1]));
        this.ui.type2.show();
    } else {
        this.ui.type2.hide();
    }

    this.ui.poke.val(this.nick);

    this.ui.ability.html("");
    for (var x in this.data.abilities) {
        var ab = this.data.abilities[x];
        this.ui.ability.append("<option value='" + ab + "'>" + abilityinfo.name(ab) + "</option>");
    }
    this.ui.ability.val(this.ability);
    this.ui.ability.on("change", function() {
        self.ability = $(this).val();
    });

    var genderButtons = ['<span class="btn btn-default btn-sm tb-gender tb-gender-0"><input type="radio"><i class="fa fa-mercury"></i></span>',
            '<span class="btn btn-default btn-sm tb-gender tb-gender-1"><input type="radio"><i class="fa fa-mars"></i></span>',
            '<span class="btn btn-default btn-sm tb-gender tb-gender-2"><input type="radio"><i class="fa fa-venus"></i></span>'];
    if (this.data.gender <= 2) {
        this.ui.genders.html(genderButtons[this.data.gender]);
    } else {
        this.ui.genders.html(genderButtons[1]+genderButtons[2]);
    }

    this.ui.genders.find(".tb-gender-"+this.gender).addClass("active");

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
    console.log("Teambuilder constructor");

    var self = this;

    this.content = content;
    var team = this.team = webclient.team;
    console.log(team);
    for (var poke in team.pokes) {
        team.pokes[poke].setElement(content.find("#tb-poke-" + poke));
    }

    //setTimeout(function(){team.pokes[0].loadGui()});

    setTimeout(function() {
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

        content.find(".tb-item-selection").typeahead({
          hint: true,
          highlight: false,
        },
        {
          name: 'items',
          source: substringMatcher(itemnames),
          display: 'value',
          limit: 30
        }).on("typeahead:select", function(event, sugg) {
            var poke = team.pokes[$(this).attr("slot")];
            poke.item = sugg.num;
            $(this).typeahead('close');
        });
    });
    

    content.find(".tb-poke-link").on("click", function(event) {
        event.stopPropagation();
        event.preventDefault();

        content.find(".tab").removeClass("current");
        content.find($(this).attr("href")).addClass("current");
        content.find(".tb-poke-pill").removeClass("active");
        $(this).closest(".tb-poke-pill").addClass("active");

        var slot = $(this).attr("slot");
        if (slot >= 0) {
            self.team.pokes[$(this).attr("slot")].loadGui();
        }
    });

    var tiers = webclient.tiersList;
    
    //console.log(tiers);

    var addTiersToList = function(parent, tiers) {
        var retS = [];
        var retC = [];
        for (var x in tiers) {
            if (typeof (tiers[x]) == "string") {
                retS.push({"value": tiers[x], "category": parent});
            } else {
                var tmp = addTiersToList(tiers[x].name, tiers[x].tiers);
                retC = tmp.concat(retC);
            }
        }
        return retS.concat(retC);
    };
    var list = addTiersToList("All", tiers);
    //console.log(list);

    content.find("#tb-tier").typeahead({
        hint: true,
        minLength: 0,
        highlight: false
    }, {
        name: 'tiers',
        source: substringMatcher(list),
        display: 'value',
        limit: 30,
        templates: {
          suggestion: Handlebars.compile('<div>{{value}} - <span class="tb-tier-category">{{category}}</span></div>')
        }
    }).on("typeahead:select", function(event, sugg) {
        sugg = sugg.value;
        team.tier = sugg;
        $(this).typeahead('close');
    }).val(team.tier || "");
}

console.log("loading teambuilder js file");