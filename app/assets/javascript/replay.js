function ReplayBattles () {
	var self = this;
	this.commandStack = [];
	this.time = 0;
	this.mode = "turns";

	this.watchBattle = function(id, params) {
		console.log("battle started");
		console.log(params);
		this.time = 0;
		this.refTime = +(new Date());

		this._battle = new BattleData({"conf":params});
		this._battle.start({"conf":params});
		this.battleTab = new BattleTab(0);
		this.battleTab.setCurrentTab();

		var battleView = this.battleTab.layout.find(".battle-view");

		var tabs = '\
            <div class="btn-group" data-toggle="buttons">\
                <span class="btn btn-default active replay-turned" data-toggle="tab">\
                    <input type="radio">Turn-based</span>\
                <span class="btn btn-default replay-timed" data-toggle="tab">\
                    <input type="radio">Time-based</span>\
            </div>';
        battleView.append(tabs);

        battleView.find(".replay-turned").on("click", function() {
        	self.mode = "turns";
        });
        battleView.find(".replay-timed").on("click", function() {
        	self.mode= "timed";
        });
	}

	this.battle = function(id) {
		return this._battle;
	};

	this.serverStopWatching = function(id) {
		console.log("battle end");
	};

	this.dealWithCommand = function(time, params) {
		this.commandStack.push({"time":time, "command": params});
		//console.log(params);
	};

	this.unloadCommand = function() {
		var now = +(new Date());
		var diff = now - this.refTime;
		this.time += diff;
		this.refTime = now;

		if (this.commandStack.length > 0) {
			if (this.mode == "turns" && !this._battle.paused || this.mode=="timed" && this.commandStack[0].time < this.time) {
				var obj = this.commandStack.splice(0, 1)[0];
				this.time = obj.time;
				var command = obj.command;
				console.log(command);
				this._battle.dealWithCommand(command);
			}
		}
	};
}

var webclientUI = {
	tabs: [],
	players: {setPlayers: function(){}, addPlayer: function(){}}
};

var webclient = {
	players: {
		on: function(){},
		hasPlayer: function(){return true;},
		color: function(){return "black";}
	},
	battles: new ReplayBattles(),
	channels: {
		channelsByName: function(){return [];}
	},
	print: console.log.bind(console),
};


vex.defaultOptions.className = 'vex-theme-os';

$(function() {
	var relayGiven = utils.queryField('relay');
    var portGiven = utils.queryField('port');

	serverConnect({"onconnect": function() {
			console.log("connected callback");

			network.command("replay", {battle: battleToReplay});

			setInterval(function(){
				webclient.battles.unloadCommand();
			}, 20);
		},
		"relay": relayGiven,
		"port": portGiven
	});
})