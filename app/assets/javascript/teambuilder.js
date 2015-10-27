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

var keys = Object.keys(iteminfo.usefulList());
for (var num in keys) {
    itemnames.push({"value": iteminfo.name(keys[num]), "num": keys[num]});
}

for (var i in pokedex.items.berries) {
    i = +i;
    if (i == 0 ) {
        continue;
    }
    //console.log("Adding berry " + i + ": " + iteminfo.name(i+8000));
    itemnames.push({"value": iteminfo.name(i+8000), "num": i+8000});
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
    this.ui.ivVals = [];
    this.ui.stats = [];
    for (var i = 0; i < 6; i++) {
        this.ui.evs[i] = element.find(".tb-ev-row-" + i + " .tb-ev-slider");
        this.ui.evVals[i] = element.find(".tb-ev-row-" + i + " .tb-ev-value");
        this.ui.ivVals[i] = element.find(".tb-ev-row-" + i + " .tb-iv-value");
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
        this.ui.ivVals[i].data("slot", i).on("change", function() {
            var i = $(this).data("slot");
            self.ivs[i] = +$(this).val();
            self.updateStatGui(i);
        }).on("focusin change", function(){self.updateDescription({"type": "iv"})});
    }
    this.ui.moves = element.find(".tb-move-selection");
    this.ui.poke = element.find(".tb-poke-selection");
    this.ui.item = element.find(".tb-item-selection");
    this.ui.ability = element.find(".tb-ability-selection");
    this.ui.genders = element.find(".tb-genders");
    this.ui.nature = element.find(".tb-nature-selection");
    this.ui.level = element.find(".tb-level-value");
    this.ui.desc = element.find(".tb-description");

    this.ui.ability.on("change", function() {
        self.ability = $(this).val();
    }).on("focusin change", function() {
        self.updateDescription({"type": "ability"});
    });

    this.ui.item.on("focusin", function() {
        self.updateDescription({"type": "item", "item" : self.item});
    });

    this.ui.poke.on("focusin", function() {
        self.updateDescription({"type": "pokemon", "poke": self});
    });

    this.ui.nature.on("change", function() {
        self.nature = $(this).val();
        self.updateStatsGui();
    });

    this.ui.level.on("change", function() {
        self.level = +$(this).val();
        self.updateStatsGui();
    });

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

Poke.prototype.updateDescription = function(what) {
    if (what.type == "iv") {
        this.ui.desc.text("Hidden power: " + 
            typeinfo.name(moveinfo.getHiddenPowerType(this.gen, this.ivs))
            );
    } else if (what.type == "pokemon") {
        var links = [
            " - <a href='http://wiki.pokemon-online.eu/page/" + pokeinfo.name(what.poke.num).toLowerCase() + "'>Wiki</a>",
            " - <a href='http://veekun.com/dex/pokemon/" + pokeinfo.name(what.poke.num).toLowerCase() + "'>Veekun</a>"
        ].join("<br/>");
        this.ui.desc.html(links);
    } else if (what.type == "move") {
        if (what.move == 0) {
            return;
        }
        var desc = "<strong>Type:</strong> <img src='"+typeinfo.sprite(moveinfo.type(what.move))+"'/> - <strong>Category:</strong> " + categoryinfo.name(moveinfo.category(what.move));
        var acc = +moveinfo.accuracy(what.move);
        var pow = moveinfo.power(what.move);
        if (pow > 0) {
            desc += " - <strong>Power:</strong> " + (pow == 1 ? "???" : pow);
        }
        if (acc > 0 && acc <= 100) {
            desc += " - <strong>Accuracy:</strong> " + acc;
        }
        if (moveinfo.effect(what.move)) {
            desc += "<br/><strong>Effect:</strong> " + (moveinfo.effect(what.move)||"");
        }
        this.ui.desc.html(desc);
    } else if (what.type == "item") {
        this.ui.desc.html("<img src='"+iteminfo.itemSprite(what.item)+"'/> - " + iteminfo.desc(what.item));//Todo: add item descriptions to PO!
    } else if (what.type == "ability") {
        this.ui.desc.text(abilityinfo.desc(this.ability));
    }
}

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

Poke.prototype.updateStatsGui = function() {
    for (var i = 0; i < 6; i++) {
        this.updateStatGui(i);
        this.ui.stats[i].removeClass("tb-stat-minus tb-stat-plus");
        var effect = natureinfo.getNatureEffect(this.nature, i);
        if (effect > 1) {
            this.ui.stats[i].addClass("tb-stat-plus");
        } else if (effect < 1) {
            this.ui.stats[i].addClass("tb-stat-minus");
        }
    }
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
        self.ui.ivVals[i].val(self.ivs[i]);
    }
    this.updateStatsGui();

    this.ui.sprite.attr("src", pokeinfo.sprite(this));
    this.ui.type1.attr("src", typeinfo.sprite(this.data.types[0]));

    this.ui.item.typeahead("val", this.item ? iteminfo.name(this.item) : "");

    if (1 in this.data.types) {
        this.ui.type2.attr("src", typeinfo.sprite(this.data.types[1]));
        this.ui.type2.show();
    } else {
        this.ui.type2.hide();
    }

    this.ui.poke.typeahead("val", this.nick);

    this.ui.ability.html("");
    for (var x in this.data.abilities) {
        var ab = this.data.abilities[x];
        this.ui.ability.append("<option value='" + ab + "'>" + abilityinfo.name(ab) + "</option>");
    }
    this.ui.ability.val(this.ability);
    this.ui.nature.val(this.nature);
    this.ui.level.val(this.level);

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
         highlight: false,
         minLength: 0
    },
    {
        name: "moves",
        display: "value",
        limit: 150,
        source: substringMatcher(this.data.moveNames)
    }).on("typeahead:select", function(event, sugg) {
        self.moves[$(this).attr("slot")] = sugg.id;

        if (sugg.value == "Frustration") {
            self.happiness = 0;
        } else if (sugg.value == "Return") {
            self.happiness = 255;
        }
    }).on("typeahead:autocomplete typeahead:select typeahead:cursorchange", function(event, sugg) {
        self.updateDescription({"type":"move", "move":sugg.id});
    }).on("focusin", function() {
        self.updateDescription({"type":"move", "move":self.moves[$(this).attr("slot")]});
    });

    for (var i = 0; i < 4; i++) {
        this.ui.moves.eq(i).typeahead("val", this.moves[i] == 0 ? "" : moveinfo.name(this.moves[i]));
    }

    this.updateDescription({"type": "pokemon", "poke": this});
    this.updatePreview();
};

Poke.prototype.updatePreview = function() {
    this.ui.preview.html("<img src='" + pokeinfo.icon(this) + "' />&nbsp;" + (this.nick || pokeinfo.name(this)));
};

function Teambuilder (content) {
    console.log("Teambuilder constructor");

    var self = this;

    this.content = content;
    this.prevs = [];

    var team = this.team = webclient.team;
    console.log(team);
    for (var poke in team.pokes) {
        team.pokes[poke].setElement(content.find("#tb-poke-" + poke));
        var pokeprev = content.find(".tb-poke-preview-"+poke);
        team.pokes[poke].ui.preview = pokeprev;
        this.prevs[poke] = pokeprev;
        team.pokes[poke].updatePreview();
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
        }).on("typeahead:select typeahead:autocomplete typeahead:cursorchange", function(event, sugg) {
            var poke = team.pokes[$(this).attr("slot")];
            poke.updateDescription({"type": "pokemon", "poke": sugg});
        });

        content.find(".tb-item-selection").typeahead({
          hint: true,
          highlight: false,
          minLength: 0
        },
        {
          name: 'items',
          source: substringMatcher(itemnames),
          display: 'value',
          limit: 400
        }).on("typeahead:select", function(event, sugg) {
            var poke = team.pokes[$(this).attr("slot")];
            poke.item = sugg.num;
            $(this).typeahead('close');
        }).on("typeahead:select typeahead:autocomplete typeahead:cursorchange", function(event, sugg) {
            var poke = team.pokes[$(this).attr("slot")];
            poke.updateDescription({"type": "item", "item": sugg.num});
        });
    });
    
    var natures = "";
    for (var i in natureinfo.list()) {
        natures += "<option value='" + i  + "'>" + natureinfo.name(i) + "</option>";
    }
    content.find(".tb-nature-selection").html(natures);

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

    content.find(".tb-poke-preview").on("click", function() {
        $("#link-poke-" + $(this).attr("slot")).trigger("click");
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
    }).typeahead("val", team.tier || "");

    webclientUI.teambuilder = this;
}

Teambuilder.prototype.onImportable = function() {
    if (!this.content.find(".importable").hasClass("current")) {
        this.content.find(".tab").removeClass("current");
        this.content.find(".importable").addClass("current");

        var current = this.currentTab();
        if (current == -1) {
            var exports = [];
            for (var i in this.team.pokes) {
                exports.push(this.team.pokes[i].export());
            }
            this.content.find("#tb-importable-edit").text(exports.join("\n\n"));
        } else {
            this.content.find("#tb-importable-edit").text(this.team.pokes[current].export());
        }
    } else {
        this.content.find(".tb-poke-pill.active .tb-poke-link").trigger("click");
    }
};

Teambuilder.prototype.currentTab = function() {
    return this.content.find(".tb-poke-pill.active .tb-poke-link").attr("slot");
};

console.log("loading teambuilder js file");