var pokeballrowHtml = "<span class='status status0' data-toggle='tooltip' title=''></span>".repeat(6);

function BattleTab(id) {
    $.observable(this);

    var databattle = webclient.battles.battle(id);
    var conf = databattle.conf;
    var team = databattle.team;
    var self = this;

    this.battle = databattle;
    this.players = this.battle.players;
    this.myself = this.battle.myself;
    this.opponent = this.battle.opponent;

    this.battle.on("print", function(msg, args){self.print(msg, args)});
    this.battle.on("playeradd", function(id) {self.newPlayer(id);});
    this.battle.on("playerremove", function(id) {self.removePlayer(id);});
    this.battle.on("tier", function(tier) {
        //console.log("battle tab changing name");
        self.trigger("changename", id, tier);
    });

    //new BattleAnimator(this);

    /* ui data */
    this.data = {
        sprites: {}
    };

    this.shortHand = "battle";

    this.chat = new Chat();
    var layout = $("<div>");
    layout.addClass("flex-row battle-tab-layout");

    var rows = [0,0];
    rows[this.opponent] = $("<div>").addClass("status-row").html("<span class='trainer-name'>" + utils.escapeHtml(this.players[this.opponent]) + "</span><span class='stretchX'></span>"+pokeballrowHtml);
    rows[this.opponent].find('[data-toggle="tooltip"]').attr("data-placement", "top");
    rows[this.myself] = $("<div>").addClass("status-row").html(pokeballrowHtml + "<span class='stretchX'></span><span class='trainer-name'>" + utils.escapeHtml(this.players[this.myself]) + "</span>");
    rows[this.myself].find('[data-toggle="tooltip"]').attr("data-placement", "bottom");
    layout.append($("<div>").addClass("battle-view").append(rows[this.opponent]).append($("<div>").addClass("battle-canvas").append("<iframe src='battle-canvas.html?battle=" + id + "' seamless='seamless'></iframe>")).append(rows[this.myself]));
    layout.append(this.chat.element);
    this.layout = layout;
    this.addTab(layout);

    this.teampokes = rows;

    /* Show switch row */
    if (this.isBattle()) {
        var pokeRow = $("<div>").addClass("battle-switchrow btn-group btn-group-justified").attr("data-toggle", "buttons");
        for (var i in this.battle.teams[this.myself]) {
            var poke = this.battle.teams[this.myself][i];
            var item = $("<span>").addClass("btn btn-default battle-poke").append($("<input type='radio'>")).append($("<img>")).append($("<span>").addClass("battle-poke-text")).attr("slot", i);
            pokeRow.append(item);

            item.on("click", function(event) {
                if (!self.battle.choicesAvailable || $(this).attr("disabled")) {
                    return false;
                }

                self.onControlsChooseSwitch(+$(this).attr("slot"));
            });

            this.addPopover(item);
        }
        this.switchRow = pokeRow;

        var moveRow = $("<div>").addClass("battle-attackrow btn-group-justified").attr("data-toggle", "buttons");
        for (var i in this.battle.teams[this.myself][0].moves) {
            var item = $("<span>").addClass("btn btn-default battle-move").append($("<input type='radio'>")).append($("<span>").addClass("battle-move-text")).attr("slot", i);
            item.append($("<span class='battle-move-pp'>"));
            moveRow.append(item);

            item.on("click", function(event) {
                if (!self.battle.choicesAvailable || $(this).attr("disabled")) {
                    return false;
                }

                self.onControlsChooseMove(+$(this).attr("slot"));
            });
        }
        this.attackRow = moveRow;

        var tabs = '\
            <div class="btn-group" data-toggle="buttons">\
                <a href="#moves-' + id + '" class="btn btn-default active battle-attack" data-toggle="tab">\
                    <input type="radio">Attack</a>\
                <a href="#switch-' + id + '" class="btn btn-default battle-switch" data-toggle="tab">\
                    <input type="radio">Switch</a>\
            </div>';

        var megacancel = '\
            <div class="btn-group pull-right" data-toggle="buttons">\
                <span class="btn btn-default battle-mega">\
                    <input type="checkbox">Mega</span>\
                <span class="btn btn-default battle-struggle" disabled>\
                    <input type="checkbox">Struggle</span>\
                <span class="btn btn-default battle-cancel">\
                    Cancel</span>\
            </div>';

        moveRow.addClass("tab-pane active").attr("id", "moves-" + id);
        pokeRow.addClass("tab-pane").attr("id", "switch-" + id);

        layout.find(".battle-view").append(tabs).append(megacancel).append($("<div>").addClass("tab-content").append(moveRow).append(pokeRow));

        this.attackButton = layout.find(".battle-attack");
        this.switchButton = layout.find(".battle-switch");
        this.megaButton = layout.find(".battle-mega");
        this.cancelButton = layout.find(".battle-cancel");
        this.struggleButton = layout.find(".battle-struggle");

        this.cancelButton.on("click", function(event) {
            if ($(this).attr("disabled")) {
                return false;
            }

            self.choose({"type": "cancel", "slot": self.myself});
        });
    }

    this.updateTeamPokes(this.myself);
    this.updateTeamPokes(this.opponent);
    this.battle.on("updateteampokes", function(player, pokes) {
        self.updateTeamPokes(player, pokes);
    }).on("playernameupdated", function(spot, name) {
        rows[spot].find(".trainer-name").text(name);
    }).on("choicesavailable", function() {
        self.enableChoices();
    }).on("teampreview", function(team1, team2) {
        self.showTeamPreview(team1, team2);
    });

    this.chat.on("chat", function(msg) {
        self.battle.sendMessage(msg);
    });

    this.id = id;

    this.print("<strong>Battle between " + this.battle.name(0) + " and " + this.battle.name(1) + " just started!</strong><br />");
    this.print("<strong>Mode:</strong> " + BattleTab.modes[conf.mode]);

    if (this.isBattle() && !this.battle.choicesAvailable) {
        this.disableChoices();
    }

    this.battle.allowStart();

    //layout.find('[data-toggle="tooltip"]').tooltip();
};

utils.inherits(BattleTab, BaseTab);

BattleTab.prototype.addPopover = function(item, options) {
    options = options || {};

    var self = this;
    options = $.extend({
        trigger: "hover",
        html: true,
        content: function() {
            var slot = $(this).attr("slot");

            var poke = self.battle.teams[self.myself][slot];
            var html = "Item: " + iteminfo.name(poke.item) + "<br>";
            if (poke.ability) html += "Ability: " + abilityinfo.name(poke.ability) + "<br>";
            html += "<br>Moves:<br>";
            for (var i in poke.moves) {
                var move = poke.moves[i];
                var name = moveinfo.name(move.move);
                if (name.toLowerCase() == "hidden power") {
                    name = name + " [" + typeinfo.name(self.getMoveType(poke, i)) + "]";
                }
                html += "-- " + name + " - " + move.pp + "/" + move.totalpp + " PP<br>";
            }

            return html;
        },
        title: function() {
            var slot = $(this).attr("slot");

            var poke = self.battle.teams[self.myself][slot];
            return pokeinfo.name(poke) + " lv. " + poke.level;
        },
        "placement": "top",
        container: "body"
    }, options);

    item.popover(options);
};

BattleTab.prototype.disableChoices = function() {
    this.switchRow.find(".battle-poke").attr("disabled", "disabled");
    this.attackRow.find(".battle-move").attr("disabled", "disabled");
    this.megaButton.attr("disabled", "disabled");
    this.struggleButton.attr("disabled", "disabled");
    this.cancelButton.removeAttr("disabled").removeClass("active");
};

BattleTab.prototype.myTeam = function() {
    return this.battle.teams[this.myself];
}

BattleTab.prototype.enableChoices = function() {
    this.switchRow.find(".battle-poke").removeAttr("disabled").removeClass("active");
    this.attackRow.find(".battle-move").removeAttr("disabled").removeClass("active");
    this.megaButton.removeAttr("disabled").removeClass("active");
    this.struggleButton.attr("disabled", "disabled").removeClass("active");
    this.cancelButton.attr("disabled", "disabled").removeClass("active");

    var available = this.battle.choices[0];
    if (available) {
        if (!available.attack) {
            this.attackRow.find(".battle-move").attr("disabled", "disabled");
            this.megaButton.attr("disabled", "disabled");

            this.switchButton.trigger("click");
        } else {
            //below doesn't work, find out how to set tab
            this.attackButton.trigger("click");
            var allowed = false;
            for (var i in available.attacks) {
                if (available.attacks[i]) {
                    allowed = true;
                } else {
                    this.attackRow.find(".battle-move:eq(" + i + ")").attr("disabled", "disabled");
                }
            }
            if (!allowed) {
                this.struggleButton.removeAttr("disabled");
            }
            if (!available.mega) {
                this.megaButton.attr("disabled", "disabled");
            }
        }
        if (!available.switch) {
            this.switchRow.find(".battle-poke").attr("disabled", "disabled");
        } else {
            for (var i in this.myTeam()) {
                if (this.myTeam()[i].life == 0) {
                    this.switchRow.find(".battle-poke:eq("+i+")").attr("disabled", "disabled");
                }
            } 
        }
    }

    this.updateMoveChoices();
};

BattleTab.prototype.showTeamPreview = function(team1, team2) {
    //Check if we've already changed the order, in which case, we restore it
    if (this.teampreviewOrder) {
        var team = [];
        for (var i in this.battle.teams[this.myself]) {
            team.push(this.battle.teams[this.myself][this.teampreviewOrder.indexOf(i)]);
        }
        this.battle.teams[this.myself] = team;
    }

    var self = this;

    var selected = -1;
    var row = $("<div>").attr("data-toggle", "buttons").addClass("btn-group-justified team-preview-row");
    for (var i  = 0; i < 6; i++) {
        var poke = $("<span>").addClass("btn btn-default btn-sm team-preview-poke").append("<input type='checkbox'>").append($("<img>").attr("src", pokeinfo.icon(team1[i]))).attr("slot", i);
        poke.append("<br/>").append($("<smaller>").text("Lv. " + team1[i].level));
        row.append(poke);

        this.addPopover(poke, {"placement": "bottom"});
    }

    row.on("click", "span.team-preview-poke", function(event) {
        var clicked = $(this).attr("slot");
        var cur = $(this);

        if (clicked == selected) {
            selected = -1;
        } else if (selected == -1) {
            selected = clicked;
        } else {
            row.find("span.team-preview-poke").removeClass("active");

            var sel = row.find("span.team-preview-poke[slot=" + selected + "]");

            cur.popover('hide');
            //sel.popover('destroy');

            var s1 = cur.html();
            var s2 = sel.html();

            var team = self.battle.teams[self.myself];

            cur.html(s2);
            cur.attr("slot", selected);
            sel.html(s1);
            sel.attr("slot", clicked);

            /*setTimeout(function() {
                self.addPopover(sel, {"placement": "bottom"});
                self.addPopover(cur, {"placement": "bottom"});
            });*/

            selected = -1;

            return false;
        }
    });

    var row2 = $("<div>").addClass("btn-group-justified team-preview-row");
    for (var i  = 0; i < 6; i++) {
        var poke = $("<span>").addClass("btn btn-default btn-sm team-preview-poke").attr("disabled", "disabled").append($("<img>").attr("src", pokeinfo.icon(team2[i])));
        poke.append("<br/>").append($("<smaller>").text("Lv. " + team2[i].level));
        row2.append(poke);
    }

    BootstrapDialog.show({
        title: "Team preview",
        message: $("<div>").append(row).append(row2),
        buttons: [
            {
                label: 'Done',
                action: function(dialogItself){
                    dialogItself.close();
                }
            }
        ],
        onhidden: function(dialogItself) {
            //Send team preview
            var order = [];
            for (var i = 0; i < 6; i++) {
                order.push(row.find(".team-preview-poke:eq("+i+")").attr("slot"));
            }

            self.onControlsChooseTeamPreview(order);
        }
    });
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
        //console.log(this.battle.teams);
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

            if (this.isBattle() && player == this.myself) {
                var $ct = this.switchRow.find(".battle-poke:eq("+pokes[i]+")");
                $ct.find("img").attr("src", pokeinfo.icon(tpok));
                var text = tpok.name + "<br/>" + tpok.life + "/" + tpok.totalLife;
                $ct.find(".battle-poke-text").html(text);

                if (pokes[i] == 0) {
                    this.updateMoveChoices();
                }
            }
        }
    }
};

BattleTab.prototype.getMoveType = function(poke, i) {
    var move = poke.moves[i];
    var type = moveinfo.type(move.move);
    if (moveinfo.name(move.move).toLowerCase() == "hidden power") {
        var ivs = poke.ivs;
        type = moveinfo.getHiddenPowerType(this.battle.conf.gen, ivs[0], ivs[1], ivs[2], ivs[3], ivs[4], ivs[5]);
    }
    return type;
}

BattleTab.prototype.updateMoveChoices = function() {
    var poke = this.battle.teams[this.myself][0];
    var moves = poke.moves;
    for (var i in moves) {
        var move = moves[i];
        var movename = moveinfo.name(move.move);
        var $move = this.attackRow.find(".battle-move:eq("+i+")");
        $move.find(".battle-move-text").text(movename);
        $move.find(".battle-move-pp").text(move.pp + "/" + move.totalpp + " PP");
        $move.removeClass($move.attr("typeclass") || "");

        var cl = "type-" + typeinfo.css(this.getMoveType(poke, i)).toLowerCase();
        $move.attr("typeclass", cl);
        $move.addClass(cl);
    }
};

/**
 * Called when a chooseMove button is clicked
 * @param $obj The button jquery object
 */
BattleTab.prototype.onControlsChooseMove = function(slot) {
    var choice = {"type":"attack", "slot":this.myself, "attackSlot": slot};
    if (this.megaButton.hasClass("active")) {
        choice.mega = true;
    }
    this.choose(choice);
};

/**
 * Called when a chooseMove button is clicked
 * @param $obj The button jquery object
 */
BattleTab.prototype.onControlsChooseSwitch = function(slot) {
    //console.log ("poke " + $obj.attr("slot") + " ( " + $obj.attr("value") + ") called");
    var choice = {"type":"switch", "slot":this.myself, "pokeSlot": +slot};
    this.choose(choice);
};

BattleTab.prototype.onControlsChooseTeamPreview = function(neworder) {
    this.teampreviewOrder = neworder;

    var team = [];
    for (var i in this.battle.teams[this.myself]) {
        team.push(this.battle.teams[this.myself][neworder[i]]);
    }
    this.battle.teams[this.myself] = team;

    this.updateTeamPokes(this.myself);

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
    console.log("choose");
    console.log({id: this.id, choice: choice});
    this.battle.choicesAvailable = false;
    this.disableChoices();
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
    7: "Team Preview",
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