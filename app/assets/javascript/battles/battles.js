function Battles() {
    $.observable(this);

    this.battles = {};
    this.battleList = {};
    this.battlesByPlayer = {};
}

Battles.prototype.isBattling = function(pid) {
    return (pid in this.battlesByPlayer);
};

Battles.prototype.battleOfPlayer = function(pid) {
    if (this.isBattling(pid)) {
        for (var x in this.battlesByPlayer[pid]) {
            return this.battlesByPlayer[pid][x].id;
        }
    }
};

Battles.prototype.battlesOfPlayer = function(pid) {
    return this.battlesByPlayer[pid];
};

Battles.prototype.addBattle = function (battles) {
    for (var id in battles) {
        var battle = battles[id];
        battle.id = id;
        this.battleList[id] = new BattleData(battle);
        if (!(battle.ids[0] in this.battlesByPlayer)) {
            this.battlesByPlayer[battle.ids[0]] = {};
        }
        this.battlesByPlayer[battle.ids[0]][id] = battle;
        if (!(battle.ids[1] in this.battlesByPlayer)) {
            this.battlesByPlayer[battle.ids[1]] = {};
        }
        this.battlesByPlayer[battle.ids[1]][id] = battle;

        webclientUI.players.updatePlayer(battle.ids[0]);
        webclientUI.players.updatePlayer(battle.ids[1]);

        /* Is it a battle we're taking part in ? */
        if (battle.team) {
            this.startBattle(battle);
        }
    }
};

Battles.prototype.dealWithCommand = function(battleid, command) {
    if (battleid in this.battles) {
        this.battles[battleid].dealWithCommand(command);
    } else {
        console.log("battle command for battle " + battleid + " not found");
        console.log(command);
    }
};

Battles.results = [
    "forfeit",
    "win",
    "tie",
    "close"
];

Battles.prototype.battleEnded = function(battleid, result) {

    result = Battles.results[result.result];

    if (!this.battleList.hasOwnProperty(battleid)) {
        this.leaveBattle(battleid, result);
        return;
    }

    var ids = this.battleList[battleid].ids;
    this.removeBattle(battleid,result);

    /* We do nothing with result yet... no printing channel events?! */
    webclientUI.players.updatePlayer(ids[0]);
    webclientUI.players.updatePlayer(ids[1]);
};

Battles.prototype.serverStopWatching = function(battleid) {
    this.leaveBattle(battleid, "close");
};

/* Maybe instead of a direct call from players it should be bound by some kind of event listener and
    called that way. */
Battles.prototype.removePlayer = function(pid) {
    /* If both players are not in memory for a battle, removes the battle from memory */
    for (var battleid in this.battlesByPlayer[pid]) {
        var battle = this.battlesByPlayer[pid][battleid];
        var ids = battle.ids;
        if (!webclient.players.hasPlayer(ids[0] == pid ? ids[1] : ids[0])) {
            this.removeBattle(battleid, "forfeit");
        }
    }
};

Battles.prototype.removeBattle = function(battleid,result) {
    var ids = this.battleList[battleid].ids;
    delete this.battlesByPlayer[ids[0]][battleid];
    delete this.battlesByPlayer[ids[1]][battleid];
    delete this.battleList[battleid];
    /* If a player has no more battles, useless to keep them in memory */
    if (!Object.keys(this.battlesByPlayer[ids[0]]).length) {
        delete this.battlesByPlayer[ids[0]];
    }
    if (!Object.keys(this.battlesByPlayer[ids[1]]).length) {
        delete this.battlesByPlayer[ids[1]];
    }

    this.leaveBattle(battleid, result);
};

Battles.prototype.battle = function(pid) {
    if (pid in this.battles) {
        return this.battles[pid];
    }
    console.log("no battle with id " + pid + " found, current ids: " + JSON.stringify(Object.keys(this.battles)));
};

Battles.prototype.watchBattle = function(bid, conf) {
    if (bid in this.battles) {
        console.log("Already watching battle " + bid + " with conf " + JSON.stringify(conf));
        return;
    }

    this.startBattle({id: bid, conf: conf});
};

Battles.prototype.startBattle = function(battle) {
    /* The battle isn't always in the list - if the 2 players don't share channels with you */
    this.battles[battle.id] = this.battleList[battle.id] || new BattleData(battle);
    this.battles[battle.id].start(battle);

    this.trigger("activebattle", battle.id);
};

Battles.prototype.leaveBattle = function(id, result) {
    if (id in this.battles) {
        if (result == "close" || result == "forfeit") {
            this.battles[id].finished(result);
            delete this.battles[id];
        }
    }
};

Battles.prototype.updateInfo = function(id, player) {
    for (var bid in this.battles) {
        this.battles[bid].updateInfo(id, player);
    }
};

$(function() {
    webclient.players.on("playerremove", function(id) {
        this.removePlayer(id);
    });
});
