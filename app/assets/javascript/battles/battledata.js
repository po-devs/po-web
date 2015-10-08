function BattleData(data) {
	$.observable(this);

	this.addData(data);
};

var battledata = BattleData.prototype;

battledata.addData = function(data) {
	$.extend(this, data);
};

battledata.print = function(msg, args) {
    this.trigger("print", msg, args);
};

battledata.start = function(data) {
	this.addData(data);

	var conf = this.conf;
	var team = this.team;

    this.paused = false;

    this.queue = [];//Queues of message not yet processed

    /* Pokemon on the field */
    this.pokes = {};
    /* teams */
    this.teams = [[{},{},{},{},{},{}], [{},{},{},{},{},{}]];
    this.choices = {};
    this.spectators = {};
    this.timers = [{'value':300, 'ticking': false}, {'value':300, 'ticking': false}];
    /* player names */
    this.players = [webclient.players.name(conf.players[0]), webclient.players.name(conf.players[1])];

/*    this.timer = setInterval(function() {
        self.updateTimers()
    }, 1000);
*/
    if (team) {
        this.myself = conf.players[1] === webclient.ownId ? 1 : 0;
        //ugly way to clone, better way at http://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object
        this.teams[this.myself] = JSON.parse(JSON.stringify(team));
        //this.updateTeamPokes(this.myself);
    } else {
    }
};

battledata.isBattle = function() {
    return this.team ? true : false;
};


battledata.name = function(player) {
    return this.players[this.player(player)];
};

battledata.rnick = function(spot) {
    return this.pokes[spot].name;
};

battledata.nick = function(spot) {
    if (this.isBattle()) {
        return this.rnick(spot);
    } else {
        return this.name(this.player(spot)) + "'s " + this.pokes[spot].name;
    }
};

battledata.player = function(spot) {
    return spot % 2;
};


battledata.updateClock = function(player, time, ticking) {
    this.timers[player] = {"time": time, "ticking": ticking, "lastupdate": new Date().getTime()};
    this.updateTimers();
};

battledata.updateTimers = function() {
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

battledata.slot = function(spot) {
    return spot >> 1;
};

battledata.tpoke = function(spot) {
    return this.teams[this.player(spot)][this.slot(spot)];
};

battledata.updateFieldPoke = function(spot) {
};

battledata.updateTeamPokes = function(player, pokes) {
    this.trigger("updateteampokes", player, pokes);
};

battledata.pause = function() {
    this.paused = true;
};

battledata.unpause = function() {
    this.paused = false;
    this.readQueue();
};

battledata.readQueue = function() {
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

/* Receives a battle command - a battle message.

   Calls the appropriate function from battle/commandshandling.js to handle it.
 */
battledata.dealWithCommand = function(params) {
    if (this.paused && !(params.command in BattleData.immediateCommands)) {
        this.queue.push(params);
        return;
    }
    var funcName = "dealWith"+params.command[0].toUpperCase() + params.command.slice(1);
    if (funcName in BattleData.prototype) {
        this[funcName](params);
    }
};

BattleData.immediateCommands = {
    "clock": true,
    "playerchat": true,
    "spectatorjoin": true,
    "spectatorleave": true,
    "spectatorchat": true,
    "disconnect": true,
    "reconnect" : true
};

battledata.sendMessage = function (message) {
    var lines = message.trim().split('\n'),
        command = (this.isBattle() ? "battlechat": "spectatingchat"),
        line, len, i;

    for (i = 0, len = lines.length; i < len; i += 1) {
        line = lines[i];

        network.command(command, {battle: this.id, message: line});
    }
};