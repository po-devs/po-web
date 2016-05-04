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
        self.trigger("changename", id, tier);
    });
    this.battle.on("timerupdated", function(i, time) {
        time = Math.floor(time);
        self.timers[i].text(Math.floor(time/60) + ":" + ("0" + (time%60)).substr(-2));
        if (time <= 30) {
            self.timers[i].addClass("time-critical");
        } else {
            self.timers[i].removeClass("time-critical");
        }
    });
    this.battle.on("disable", function() {
        self.chat.disable();
    });

    //new BattleAnimator(this);

    this.battle.data.background = Math.floor(37 * Math.random());

    this.shortHand = "battle";

    this.chat = new Chat();
    var layout = $("<div>");
    layout.addClass("flex-row battle-tab-layout");

    var rows = [0,0];
    rows[this.opponent] = $("<div>").addClass("status-row").html("<span class='trainer-name'>" + utils.escapeHtml(this.players[this.opponent]) +
        "</span><span class='stretchX'></span><span class='timer-text'>5:00</span>"+pokeballrowHtml);
    rows[this.opponent].find('[data-toggle="tooltip"]').attr("data-placement", "top");
    rows[this.myself] = $("<div>").addClass("status-row").html(pokeballrowHtml + "<span class='timer-text'>5:00</span><span class='stretchX'></span><span class='trainer-name'>" + utils.escapeHtml(this.players[this.myself]) + "</span>");
    rows[this.myself].find('[data-toggle="tooltip"]').attr("data-placement", "bottom");
    layout.append($("<div>").addClass("battle-view").append(rows[this.opponent]).append($("<div>").addClass("battle-canvas")
        .append("<iframe src='/battle-canvas.html?battle=" + id + "' seamless='seamless'></iframe>")
        .append("<img src='/public/battle/background/" + this.battle.data.background  + ".png'>")).append(rows[this.myself]));
    layout.append(this.chat.element);
    this.layout = layout;
    this.addTab(layout);
    this.timers=[rows[0].find(".timer-text"), rows[1].find(".timer-text")];

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

        var onMoveClicked = function(event) {
            if (!self.battle.choicesAvailable || $(this).attr("disabled")) {
                return false;
            }

            self.onControlsChooseMove(+$(this).attr("slot"));
        };

        var moveRow = $("<div>").addClass("battle-attackrow btn-group-justified").attr("data-toggle", "buttons");
        for (var i in this.battle.teams[this.myself][0].moves) {
            var item = $("<span>").addClass("btn btn-default battle-move").append($("<input type='radio'>")).append($("<span>").addClass("battle-move-text")).attr("slot", i);
            item.append($("<span class='battle-move-pp'>"));
            moveRow.append(item);

            item.on("click", onMoveClicked);

            this.addMovePopover(item);
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
                <span class="btn btn-default battle-struggle" slot="-1" disabled>\
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
        this.struggleButton.on("click", onMoveClicked);

        this.cancelButton.on("click", function(event) {
            if ($(this).attr("disabled")) {
                return false;
            }

            self.choose({"type": "cancel", "slot": self.myself});
        });
    }

    this.pokes = [this.teampokes[0].find(".status:eq(0)"), this.teampokes[1].find(".status:eq(0)")];

    this.addFieldPopover(this.pokes[0], 0);
    this.addFieldPopover(this.pokes[1], 1);

    this.updateTeamPokes(this.myself);
    this.updateTeamPokes(this.opponent);

    self.fieldPopover = -1;

    this.battle.on("updateteampokes", function(player, pokes) {
        self.updateTeamPokes(player, pokes);
    }).on("playernameupdated", function(spot, name) {
        rows[spot].find(".trainer-name").text(name);
    }).on("choicesavailable", function() {
        self.enableChoices();
    }).on("teampreview", function(team1, team2) {
        self.showTeamPreview(team1, team2);
    }).on("battle-hover", function(spot) {
        if (spot == self.fieldPopover) {
            return;
        }
        if (spot == -1) {
            self.pokes[0].popover("hide");
            self.pokes[1].popover("hide");
        } else {
            self.pokes[1-spot].popover("hide");
            self.pokes[spot].popover("show");
        }
        self.fieldPopover = spot;
    });

    this.canvas = layout.find(".battle-canvas");
    this.tab.on("mousemove", function(event) {
        var pos = {"top": event.pageY, "left": event.pageX};
        var cpos = self.canvas.offset();
        cpos.width = self.canvas.width();
        cpos.height = self.canvas.height();

        if (pos.top < cpos.top || pos.left < cpos.left || pos.top > cpos.top + cpos.height || pos.left > cpos.left + cpos.width) {
            self.battle.trigger("battle-hover", -1);
        }
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
            var html = "Item: " + ItemInfo.name(poke.item||0) + "<br>";
            if (poke.ability) html += "Ability: " + AbilityInfo.name(poke.ability||0) + "<br>";
            html += "<br>Moves:<br>";
            for (var i in poke.moves) {
                var move = poke.moves[i];
                var name = MoveInfo.name(move.move);
                if (name.toLowerCase() == "hidden power") {
                    name = name + " [" + TypeInfo.name(self.getMoveType(poke, i)) + "]";
                }
                html += "-- " + name + " - " + move.pp + "/" + move.totalpp + " PP<br>";
            }

            return html;
        },
        title: function() {
            var slot = $(this).attr("slot");

            var poke = self.battle.teams[self.myself][slot];
            return PokeInfo.name(poke) + " lv. " + (poke.level ||0);
        },
        "placement": "top",
        container: "body"
    }, options);

    item.popover(options);
};

BattleTab.prototype.addMovePopover = function(item) {
    var battle = this.battle;
    item.popover({
        html: true,
        trigger: "hover",
        content: function() {
            var move = battle.teams[battle.myself][0].moves[item.attr("slot")].move;
            var cat = MoveInfo.category(move);
            var str = "";
            if (cat) {
                str += "<strong>Power: </strong>" + (MoveInfo.power(move) == 1 ? "???" : MoveInfo.power(move)) + "<br/> ";
            }
            var acc = MoveInfo.accuracy(move);
            if (acc == 0 || acc == 101) {
                acc = "---";
            }
            str += "<strong>Accuracy: </strong>" + acc + "<br/> ";
            str += "<strong>Category: </strong>" + CategoryInfo.name(cat);

            if (MoveInfo.effect(move)) {
                str += "<br/><strong>Effect: </strong>" + MoveInfo.effect(move);
            }
            return str;
        },
        "placement": "top",
        "container": "body"
    });
};

BattleTab.prototype.addFieldPopover = function(item, spot) {
    var battle = this.battle;
    item.popover({
        "html": true,
        content: function() {
            var poke = battle.pokes[spot];
            var types = PokeInfo.types(poke);
            for (var i in types) {
                types[i] = TypeInfo.name(types[i]);
            }

            var ret = [types.join(" / ")];
            ret.push("");

            var table = "<table class='table table-condensed table-bordered'>";
            for (var i = 0; i < 6; i++) {
                var stat = "<tr><td>"+StatInfo.name(i) + "</td><td>";
                if (poke.stats) {
                    if (i == 0) {
                        stat += poke.totalLife;
                    } else {
                        stat += poke.stats[i];
                    }
                } else {
                    var boost = poke.boosts && i > 0 && poke.boosts[i] ? poke.boosts[i] : 0;

                    stat += PokeInfo.minStat($.extend({}, poke, {"boost": boost}), i) + " - " +
                        PokeInfo.maxStat($.extend({}, poke, {"boost": boost}), i);
                }
                stat += "</td><td>";
                if (i > 0 && poke.boosts && poke.boosts[i]) {
                    stat += " " + (poke.boosts[i] > 0 ? "+" + poke.boosts[i] : poke.boosts[i]);
                } else if (i > 0) {
                    stat += " +0";
                }
                stat += "</td></tr>";
                table += stat;
            }
            ret.push(table + "</table>");
            var state = poke.fieldState || 0;
            var states = ["Spikes", "Spikes (2)", "Spikes (3)", "Stealth Rock", "Toxic Spikes", "Toxic Spikes (2)", "Sticky Web"];
            var actStates = [];
            for (var i in states) {
                if (state & (1 << i)) {
                    actStates.push(states[i]);
                }
            }
            if (actStates.length > 0) {
                ret.push(actStates.join(", "));
            }

            return ret.join("<br/>");
        },
        placement: this.battle.player(spot) == this.myself ? "top": "bottom"
    });
}

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

    var available = this.battle.choices[this.myself];
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
                if (this.myTeam()[i].life == 0 || this.myTeam()[i].status == 31) {
                    this.switchRow.find(".battle-poke:eq("+i+")").attr("disabled", "disabled");
                }
            }
        }
    }

    this.updateMoveChoices();
};

BattleTab.prototype.showTeamPreview = function(team1, team2) {
    while (team2.length < 6) {
        team2.push({"num":0, "level":0});
    }

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
        var poke = $("<span>").addClass("btn btn-default btn-sm team-preview-poke").append("<input type='checkbox'>").append($("<img>").attr("src", PokeInfo.icon(team1[i]))).attr("slot", i);
        if (team1[i].item) {
            poke.append($("<img>").addClass("team-preview-poke-held-item").attr("src", PokeInfo.heldItemSprite()));
        }
        if(team1[i].gender) {
            poke.append($("<img>").addClass("team-preview-poke-gender").attr("src", PokeInfo.genderSprite(team1[i].gender)));
        }
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
        var poke = $("<span>").addClass("btn btn-default btn-sm team-preview-poke").attr("disabled", "disabled").append($("<img>").attr("src", PokeInfo.icon(team2[i])));
        if (team2[i].heldItem) {
            poke.append($("<img>").addClass("team-preview-poke-held-item").attr("src", PokeInfo.heldItemSprite()));
        }
        if(team2[i].gender) {
            poke.append($("<img>").addClass("team-preview-poke-gender").attr("src", PokeInfo.genderSprite(team2[i].gender)));
        }
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
    msg = msg || "";
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
            var pref = "<span class='player-message' style='color: " + (args.player == this.myself ? "darkcyan": "darkgoldenrod")+ "'>" + this.players[args.player] + ":</span>";
            msg = pref + " " + utils.addChannelLinks(msg, webclient.channels.channelsByName(true));
        } else if ("css" in args && args.css == "turn") {
            this.blankMessage = true;
            linebreak = false;
        }
    }

    this.chat.insertMessage(msg, {linebreak: linebreak});
    this.activateTab();

    if(!window.isActive && this.hadFocus && webclientUI.battleNotifications) {
        this.hadFocus = false;
        if ("Notification" in window) {
            if (this.notification) {
                this.notification.close();
            }
            this.notification = new window.Notification(this.battle.name(0) + ' vs ' + this.battle.name(1), {body: utils.stripHtml(msg)});
        }
    } else if (window.isActive) {
        this.hadFocus = true;
    }
};

BattleTab.prototype.onSetCurrent = function() {
    this.chat.scrollDown();
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
            $img.html("");
            $img.addClass("status status"+(tpok.status || 0));
            if (!tpok.num) {
                $img.addClass("status-hidden")
            } else {
                $img.append('<img src="' + PokeInfo.icon(tpok) + '">');
            }

            var tooltip = "";
            if (tpok.num) tooltip += PokeInfo.name(tpok);
            if (tpok.gender) tooltip += " " + GenderInfo.shorthand(tpok.gender);
            if (tpok.level && tpok.level != 100) tooltip += " lv. " + tpok.level;
            if (tpok.percent !== undefined) {
                if (tpok.totalLife != undefined) {
                    tooltip += " - " + tpok.life + "/" + tpok.totalLife + " HP (" + tpok.percent + "%)";
                } else {
                    tooltip += " - " + tpok.percent + "%";
                }
            }
            //tooltip+= JSON.stringify(tpok);
            if (!tooltip)  tooltip="No Info";
            $img.attr("title", tooltip).tooltip("fixTitle");

            if (this.isBattle() && player == this.myself) {
                var $ct = this.switchRow.find(".battle-poke:eq("+pokes[i]+")");
                $ct.find("img").attr("src", PokeInfo.icon(tpok));
                var text = (tpok.name||"") + "<br/>" + (tpok.life||0) + "/" + (tpok.totalLife||0);
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
    var type = MoveInfo.type(move.tempmove || move.move);
    if (MoveInfo.name(move.tempmove || move.move).toLowerCase() == "hidden power") {
        type = MoveInfo.getHiddenPowerType(poke.ivs, this.battle.conf.gen);
    }
    return type;
}

BattleTab.prototype.updateMoveChoices = function() {
    var poke = this.battle.teams[this.myself][0];
    var moves = poke.moves;
    for (var i in moves) {
        var move = moves[i];
        var movename = MoveInfo.name(move.tempmove || move.move);
        var $move = this.attackRow.find(".battle-move:eq("+i+")");
        $move.find(".battle-move-text").text(movename);
        $move.find(".battle-move-pp").text(move.pp + "/" + (move.temppp || move.totalpp) + " PP");
        $move.removeClass($move.attr("typeclass") || "");

        var cl = "type-" + TypeInfo.css(this.getMoveType(poke, i)).toLowerCase();
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
    this.battle.choicesAvailable = false;
    this.disableChoices();
    network.command('battlechoice', {id: this.id, choice: choice});
};

BattleTab.prototype.isBattle = function() {
    return this.battle.conf.players[0] == webclient.ownId || this.battle.conf.players[1] == webclient.ownId;
};

BattleTab.prototype.close = function() {
    this.battle.close();
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
    4: "sunnyday",
    5: "strongsun",
    6: "strongrain",
    7: "strongwinds"
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

BattleTab.clauseTexts = [
    "Sleep Clause prevented the sleep inducing effect of the move from working.",
    "Freeze Clause prevented the freezing effect of the move from working.",
    "",
    "",
    "",
    "The battle ended by timeout.",
    "",
    "",
    "The Self-KO Clause acted as a tiebreaker.",
    ""
];

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
    $move.addClass("type_"+MoveInfo.type(move.move));
    $move.find(".battle-move-name").text(MoveInfo.name(move.move));
    $move.find(".battle_move_pp").text(move.pp + "/" + move.totalpp + " PP");
};

BattleTab.prototype.effects = function(spot, effect) {
    if (typeof effect == "object") {
        return PokeInfo.spriteData(effect, {"back":spot==0});
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
