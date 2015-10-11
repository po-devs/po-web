var pokeballrowHtml = "<span class='status status0' data-toggle='tooltip' title=''></span>".repeat(6);

function BattleTab(id) {
    $.observable(this);

    var databattle = webclient.battles.battle(id);
    var conf = databattle.conf;
    var team = databattle.team;
    var self = this;

    this.battle = databattle;
    this.players = this.battle.players;

    this.battle.on("print", function(msg, args){self.print(msg, args)});
    this.battle.on("playeradd", function(id) {self.newPlayer(id);});
    this.battle.on("playerremove", function(id) {self.removePlayer(id);});

    //new BattleAnimator(this);

    /* ui data */
    this.data = {
        sprites: {}
    };

    this.shortHand = "battle";

    this.chat = new Chat();
    var layout = $("<div>");
    layout.addClass("flex-row battle-tab-layout");

    var row1 = $("<div>").addClass("status-row").html("<span class='trainer-name'>" + utils.escapeHtml(this.players[0]) + "</span><span class='stretchX'></span>"+pokeballrowHtml);
    row1.find('[data-toggle="tooltip"]').attr("data-placement", "top");
    var row2 = $("<div>").addClass("status-row").html(pokeballrowHtml + "<span class='stretchX'></span><span class='trainer-name'>" + utils.escapeHtml(this.players[1]) + "</span>");
    row2.find('[data-toggle="tooltip"]').attr("data-placement", "bottom");
    layout.append($("<div>").addClass("battle-view").append(row1).append($("<div>").addClass("battle-canvas").append("<iframe src='battle-canvas.html?battle=" + id + "' seamless='seamless'></iframe>")).append(row2));
    layout.append(this.chat.element);
    this.addTab(layout);

    this.teampokes = [row1, row2];

    this.updateTeamPokes(0);
    this.updateTeamPokes(1);
    this.battle.on("updateteampokes", function(player, pokes) {self.updateTeamPokes(player, pokes)});

    this.chat.on("chat", function(msg) {
        self.battle.sendMessage(msg);
    });

    this.id = id;

    this.print("<strong>Battle between " + this.battle.name(0) + " and " + this.battle.name(1) + " just started!</strong><br />");
    this.print("<strong>Mode:</strong> " + BattleTab.modes[conf.mode]);

    //layout.find('[data-toggle="tooltip"]').tooltip();
};

utils.inherits(BattleTab, BaseTab);


BattleTab.prototype.print = function(msg, args) {
    var linebreak = true;

    /* Do not print empty message twice in a row */
    if (msg.length === 0) {
        if (this.blankMessage) {
            return;
        }
        this.blankMessage = true;
    } else {
        this.blankMessage = false;
    }

    if (args) {
        if ("spectator" in args) {
            msg = utils.escapeHtml(msg);
            var name = this.battle.spectators[args.spectator];
            var pref = "<span class='spectator-message'>" + name + ":</span>";
            msg = pref + " " + utils.addChannelLinks(msg, webclient.channels.channelsByName(true));
        } else if ("player" in args) {
            msg = utils.escapeHtml(msg);
            var pid = this.battle.conf.players[args.player];
            var pref = "<span class='player-message' style='color: " + webclient.players.color(pid) + "'>" + webclient.players.name(pid) + ":</span>";
            msg = pref + " " + utils.addChannelLinks(msg, webclient.channels.channelsByName(true));
        } else if ("css" in args && args.css == "turn") {
            this.blankMessage = true;
            linebreak = false;
        }
    }

    this.chat.insertMessage(msg, {linebreak: linebreak});
    this.activateTab();
};

BattleTab.prototype.onSetCurrent = function() {
    this.chat.scrollDown();
};

BattleTab.prototype.playercss = function(spot) {
    return "p" + ((spot % 2)+1);
};

BattleTab.prototype.updateFieldPoke = function(spot) {
    var poke = this.pokes[spot];
    var $poke = this.$poke(spot);
    $poke.find(".pokemon_name").text(poke.name);
    $poke.find(".sprite").attr("src", "");
    $poke.find(".sprite").attr("src", pokeinfo.battlesprite(poke, {"gen": this.conf.gen, "back": this.player(spot) == 0}));
    $poke.find(".battle-stat-value").text(poke.percent + "%");

    var $prog = $poke.find(".battle-stat-progress");
    $prog.removeClass("battle-stat-progress-1x battle-stat-progress-2x battle-stat-progress-3x battle-stat-progress-4x");
    $prog.addClass("battle-stat-progress-" + (Math.floor(poke.percent*4/100.1)+1) + "x");
    $prog.css("width", poke.percent + "%");
};

BattleTab.prototype.$poke = function(spot) {
    return this.$content.find(".p" + (this.player(spot)+1) + "_pokemon" + (this.slot(spot)+1));
};

BattleTab.prototype.$sprite = function(spot) {
    return this.data.sprites[spot] || (this.data.sprites[spot] = this.$poke(spot).find(".sprite"));
};

BattleTab.prototype.updateTeamPokes = function(player, pokes) {
    if (!pokes) {
        pokes = [0,1,2,3,4,5];
    }
    var $pokes = this.teampokes[player];

    for (var i = 0; i < pokes.length; i++) {
        var $img = $pokes.find(".status:eq("+pokes[i]+")");
        var tpok = this.battle.teams[player][pokes[i]]; 
        if (tpok) {
            $img.removeClass();
            $img.addClass("status status"+(tpok.status || 0));

            var tooltip = "";
            if (tpok.num) tooltip += pokeinfo.name(tpok);
            if (tpok.gender) tooltip += " " + genderinfo.shorthand(tpok.gender);
            if (tpok.level && tpok.level != 100) tooltip += " lv. " + tpok.level;
            if (tpok.percent !== undefined) tooltip += " - " + tpok.percent + "%";
            //tooltip+= JSON.stringify(tpok);
            if (!tooltip)  tooltip="No Info";
            $img.attr("title", tooltip).tooltip("fixTitle");
        }
    }

/*    if (this.isBattle() && player == this.myself) {
        var $team = this.$content.find(".battle_options_pokemon");
        for (var i = 0; i < pokes.length; i++) {
            var $ct = $team.find(".battle_pokemon_content:eq("+pokes[i]+")");
            var poke = this.request.team[pokes[i]];
            $ct.find("img").attr("src", pokeinfo.icon(poke.num));
            var text = poke.name + "<br/>" + poke.life + "/" + poke.totalLife;
            $ct.find(".battle_pokemon_content_text").html(text);
        }
    }*/
};

/** Calls the onXxxxXxxx functions where xxxxXxxx is the name attribute of the button
 * in the controls that was clicked
 * @param event the click event
 */
BattleTab.prototype.dealWithControlsClick = function(event) {
    var $obj = $(event.target);
    var battle = event.data;
    while ($obj.length > 0 && $obj != $(this)) {
        var name = $obj.attr("name");
        if (name !== undefined) {
            var funcName = "onControlsChoose"+name[0].toUpperCase()+name.slice(1);
            if (funcName in BattleTab.prototype) {
                this[funcName]($obj);
                return true;
            }
        }
        var oldobj = $obj;
        $obj = $obj.parent();

        if (oldobj == $obj) {
            break;
        }
    }
    return false;
};

/**
 * Called when a chooseMove button is clicked
 * @param $obj The button jquery object
 */
BattleTab.prototype.onControlsChooseMove = function($obj) {
    console.log ("move " + $obj.attr("slot") + " ( " + $obj.attr("value") + ") called");
    var choice = {"type":"attack", "slot":this.myself, "attackSlot": + $obj.attr("slot")};
    this.choose(choice);
};

/**
 * Called when a chooseMove button is clicked
 * @param $obj The button jquery object
 */
BattleTab.prototype.onControlsChooseSwitch = function($obj) {
    console.log ("poke " + $obj.attr("slot") + " ( " + $obj.attr("value") + ") called");
    var choice = {"type":"switch", "slot":this.myself, "pokeSlot": + $obj.attr("slot")};
    this.choose(choice);
};

BattleTab.prototype.onControlsChooseTeamPreview = function($obj) {
    var choice = {"type":"rearrange", "slot":this.myself, "neworder": neworder};
    this.choose(choice);
};

BattleTab.prototype.getPlayers = function() {
    var array = [];
    for (var i = 0; i < this.battle.conf.players.length; i++) {
        array.push(this.battle.conf.players[i]);
    }
    for (var x in this.battle.spectators) {
        array.push(x);
    }

    return array;
};

BattleTab.prototype.choose = function(choice)
{
    network.command('battlechoice', {id: this.id, choice: choice});
};

BattleTab.prototype.isBattle = function() {
    return this.battle.conf.players[0] == webclient.ownId || this.battle.conf.players[1] == webclient.ownId;
};

BattleTab.prototype.close = function() {
    delete webclient.battles.battles[this.id];
    clearInterval(this.timer);

    if (this.isBattle()) {
        network.command('forfeit', {battle: this.id});
    } else {
        network.command('stopwatching', {battle: this.id});
    }

    this.trigger("close");
    this.removeTab();
};


BattleTab.prototype.newPlayer = function (player) {
    if (this.isCurrent()) {
        webclientUI.players.addPlayer(player);
    }
};

BattleTab.prototype.removePlayer = function (player) {
    if (this.isCurrent()) {
        webclientUI.players.removePlayer(player);
    }
};


BattleTab.statuses = {
    0: "",
    1: "par",
    2: "slp",
    3: "frz",
    4: "brn",
    5: "psn",
    6: "confusion",
    31: "fnt"
};

BattleTab.weathers = {
    0: "none",
    1: "hail",
    2: "raindance",
    3: "sandstorm",
    4: "sunnyday"
};

BattleTab.clauses = {
    0: "Sleep Clause",
    1: "Freeze Clause",
    2: "Disallow Spects",
    3: "Item Clause",
    4: "Challenge Cup",
    5: "No Timeout",
    6: "Species Clause",
    7: "Wifi Battle",
    8: "Self-KO Clause",
    9: "Inverted Clause"
};

BattleTab.clauseDescs = {
    0:"You can not put more than one Pokemon of the opposing team to sleep at the same time.",
    1:"You can not freeze more than one Pokemon of the opposing team at the same time.",
    2:"Nobody can watch your battle.",
    3:"No more than one of the same items is allowed per team.",
    4:"Random teams are given to trainers.",
    5:"No time limit for playing.",
    6:"One player cannot have more than one of the same pokemon per team.",
    7:"At the beginning of the battle, you can see the opponent's team and rearrange yours accordingly.",
    8:"The one who causes a tie (Recoil, Explosion, Destinybond, ...) loses the battle.",
    9:"All Type Effectivenesses are inverted (Ex: Water is weak to Fire)"
};

BattleTab.modes = {
    0: "Singles",
    1: "Doubles",
    2: "Triples",
    3: "Rotation"
};

BattleTab.prototype.updatePokeData = function(spot) {
    var $poke = this.$poke(spot);
    var poke = this.pokes[spot];

    $poke.find(".pokemon_name").text(poke.name);
    $poke.find(".battle-stat-value").text(poke.percent + "%");
    var $prog = $poke.find(".battle-stat-progress");
    $prog.removeClass("battle-stat-progress-1x battle-stat-progress-2x battle-stat-progress-3x battle-stat-progress-4x");
    $prog.addClass("battle-stat-progress-" + (Math.floor(poke.percent*4/100.1)+1) + "x");
    $prog.css("width", poke.percent + "%");

    if (this.isBattle() && this.player(spot) == this.myself) {
        for (var i = 0; i < 4; i++) {
            this.updateMove(i, poke.moves[i]);
        }
    }
};

BattleTab.prototype.updateMove = function(num, move) {
    var $move = this.$content.find("#move-"+num);
    $move[0].className = '';
    $move.addClass("click_button");
    $move.addClass("type_"+moveinfo.type(move.move));
    $move.find(".battle-move-name").text(moveinfo.name(move.move));
    $move.find(".battle_move_pp").text(move.pp + "/" + move.totalpp + " PP");
};

BattleTab.prototype.effects = function(spot, effect) {
    if (typeof effect == "object") {
        return pokeinfo.spriteData(effect, {"back":spot==0});
    } else {
        return BattleTab.effects[effect] || BattleTab.effects.none;
    }
};

/* Basic position of the pokemon sprite */
BattleTab.prototype.pos = function(spot, effect) {
    var wh = this.effects(spot, effect);

    if (spot == 0) {
        return {"bottom":"103" - wh.h/2,"left":"105" - wh.w / 2, "transform": "scale(1.5)"};
    } else {
        return {"top":"140" - wh.h/2,"right":"105" - wh.w / 2};
    }
};

BattleTab.prototype.setPos = function(img, spot, effect) {
    var p = this.pos(spot, effect);
    img.css(p);
    img.spot = spot;
    var wh = this.effects(spot, effect);
    img.w = wh.w;
    img.h = wh.h;
};