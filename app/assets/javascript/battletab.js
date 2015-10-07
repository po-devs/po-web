

function BattleTab(id) {
    $.observable(this);

    var databattle = webclient.battles.battle(id);
    var conf = databattle.conf;
    var team = databattle.team;
    var self = this;

    /* me and meIdent are needed by PS stuff */
    this.me = {
        name: webclient.ownName()
    };

    this.meIdent = {
        name: this.me.name,
        named: 'init'
    };

    //new BattleAnimator(this);
    this.paused = false;

    this.queue = [];//Queues of message not yet processed

    /* ui data */
    this.data = {
        sprites: {}
    };

    this.shortHand = "battle";

    this.chat = new Chat();
    this.addTab(this.chat.element);

    this.chat.on("chat", function(msg) {
        //webclient.sendPM(msg, self.id);
    });

    this.id = id;
    this.conf = conf;
    /* pokemons on the fields */
    this.pokes = {};
    /* teams */
    this.teams = [[{},{},{},{},{},{}], [{},{},{},{},{},{}]];
    this.choices = {};
    this.spectators = {};
    this.timers = [{'value':300, 'ticking': false}, {'value':300, 'ticking': false}];
    /* PO separates damage message ("hurt by burn") and damage done. So we remember each damage message so we can give it
        together with the damage done to the Showdown window.
     */
    this.damageCause = {};
    this.players = [webclient.players.name(conf.players[0]), webclient.players.name(conf.players[1])];
    this.timer = setInterval(function() {
        self.updateTimers()
    }, 1000);

    var name = webclient.players.name(conf.players[0]) + " vs " + webclient.players.name(conf.players[1]);

    if ($("#battle-" + id).length === 0 && 0) {
        /* Create new tab */
        $('#channel-tabs').tabs("add", "#battle-" + id, webclient.classes.BaseTab.makeName(name));
        /* Cleaner solution to create the tab would be appreciated */
        this.$content = $("#battle-" + id);
        this.$content.html($("#battle-html").html());
        this.$backgrounds = this.$content.find(".backgrounds");

        battles.battles[id] = this;

        if (team) {
            this.myself = conf.players[1] === webclient.ownId ? 1 : 0;
            this.request = {"team": team};
            //ugly way to clone, better way at http://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object
            this.teams[this.myself] = JSON.parse(JSON.stringify(team));
            this.updateTeamPokes(this.myself);

            this.$content.find(".battle_options").on("click", "span", function(event){self.dealWithControlsClick(event)});
        } else {
            this.$content.find(".battle_options").css("visibility", "hidden");
            this.$content.find(".battle_buttons").css("visibility", "hidden");
        }

        this.$content.find(".p1_name_content").text(this.name(0));
        this.$content.find(".p2_name_content").text(this.name(1));

        this.chat = new webclient.classes.Chat('send-battle-' + this.id);
        this.chat.appendTo(this.$content.find(".battle_chat_content"));

        this.print("<strong>Battle between " + this.name(0) + " and " + this.name(1) + " just started!</strong><br />");
        this.print("<strong>Mode:</strong> " + BattleTab.modes[conf.mode]);

        this.setPos(this.$sprite(0), 0);
        this.setPos(this.$sprite(1), 1);
    }
}

utils.inherits(BattleTab, BaseTab);

BattleTab.prototype.pause = function() {
    this.paused = true;
};

BattleTab.prototype.unpause = function() {
    this.paused = false;
    this.readQueue();
};

BattleTab.prototype.readQueue = function() {
    if (this.queue.length == 0 || this.readingQueue) {
        return;
    }

    this.readingQueue = true;

    var i;

    for (i = 0; i < this.queue.length; i++) {
        if (this.paused) {
            break;
        }
        this.dealWithCommand(this.queue[i]);
    }

    this.queue = this.queue.slice(i);
    this.readingQueue = false;
};

BattleTab.prototype.name = function(player) {
    return this.players[this.player(player)];
};

BattleTab.prototype.rnick = function(spot) {
    return this.pokes[spot].name;
};

BattleTab.prototype.nick = function(spot) {
    if (this.isBattle()) {
        return this.rnick(spot);
    } else {
        return this.name(this.player(spot)) + "'s " + this.pokes[spot].name;
    }
};

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
        if ("player" in args) {
            msg = utils.escapeHtml(msg);
            var pid = this.conf.players[args.player];
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

BattleTab.prototype.sendMessage = function (message) {
    var lines = message.trim().split('\n'),
        command = (this.isBattle() ? "battlechat": "spectatingchat"),
        line, len, i;

    for (i = 0, len = lines.length; i < len; i += 1) {
        line = lines[i];

        network.command(command, {battle: this.id, message: line});
    }
};

BattleTab.prototype.player = function(spot) {
    return spot % 2;
};

BattleTab.prototype.playercss = function(spot) {
    return "p" + ((spot % 2)+1);
};

BattleTab.prototype.updateClock = function(player, time, ticking) {
    this.timers[player] = {"time": time, "ticking": ticking, "lastupdate": new Date().getTime()};
    this.updateTimers();
};

BattleTab.prototype.updateTimers = function() {
    for (var i = 0; i < 2; i++) {
        var time = this.timers[i].time;
        if (this.timers[i].ticking) {
            time -= (((new Date().getTime())-this.timers[i].lastupdate) /1000);
            if (time < 0) {
                time = 0;
            }
        }
        //Full bar is 5 minutes, aka 300 seconds, so time/3 gives the percentage. (time is in seconds)
        //this.$content.find("." + this.playercss(i) + "_name .battler_bg").css("width", time/3 + "%");
    }
};


BattleTab.prototype.slot = function(spot) {
    return spot >> 1;
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

BattleTab.prototype.tpoke = function(spot) {
    return this.teams[this.player(spot)][this.slot(spot)];
};

BattleTab.prototype.updateTeamPokes = function(player, pokes) {
    if (!pokes) {
        pokes = [0,1,2,3,4,5];
    }
    var $pokes = this.$content.find(".p" + (player + 1) + "_pokeballs");

    for (var i = 0; i < pokes.length; i++) {
        var $img = $pokes.find("img:eq("+pokes[i]+")");
        if (this.teams[player][pokes[i]] && this.teams[player][pokes[i]].num) {
            $img.attr("src", "");
            $img.attr("src", pokeinfo.icon(this.teams[player][pokes[i]]));
        } else {
            $img.attr("src", "images/pokeballicon.png");
        }
    }

    if (this.isBattle() && player == this.myself) {
        var $team = this.$content.find(".battle_options_pokemon");
        for (var i = 0; i < pokes.length; i++) {
            var $ct = $team.find(".battle_pokemon_content:eq("+pokes[i]+")");
            var poke = this.request.team[pokes[i]];
            $ct.find("img").attr("src", pokeinfo.icon(poke.num));
            var text = poke.name + "<br/>" + poke.life + "/" + poke.totalLife;
            $ct.find(".battle_pokemon_content_text").html(text);
        }
    }
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
    for (var i = 0; i < this.conf.players.length; i++) {
        array.push(this.conf.players[i]);
    }
    for (var x in this.spectators) {
        array.push(x);
    }

    return array;
};

BattleTab.prototype.choose = function(choice)
{
    network.command('battlechoice', {id: this.id, choice: choice});
};

BattleTab.prototype.isBattle = function() {
    return this.conf.players[0] == webclient.ownId || this.conf.players[1] == webclient.ownId;
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

/* Receives a battle command - a battle message.

   Calls the appropriate function from battle/commandshandling.js to handle it.
 */
BattleTab.prototype.dealWithCommand = function(params) {
    if (this.paused && !(params.command in BattleTab.immediateCommands)) {
        this.queue.push(params);
        return;
    }
    var funcName = "dealWith"+params.command[0].toUpperCase() + params.command.slice(1);
    if (funcName in BattleTab.prototype) {
        this[funcName](params);
    }
};

BattleTab.immediateCommands = {
    "clock": true,
    "playerchat": true,
    "spectatorjoin": true,
    "spectatorleave": true,
    "spectatorchat": true,
    "disconnect": true,
    "reconnect" : true
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
    8: "Self-KO Clause"
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