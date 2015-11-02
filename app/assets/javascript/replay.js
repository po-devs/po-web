function ReplayBattles () {
	var self = this;
	this.commandStack = [];
	this.time = 0;
	this.mode = "turns";
	this.paused = false;
	this.forceNext = false;

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

        var media= '\
        	<div class="btn-toolbar btn-group replay-btns" role="toolbar" data-toggle="buttons">\
                <button class="btn btn-default replay-pause" type="button" aria-label="Pause">\
                    <span class="glyphicon glyphicon-pause"></span></button>\
                <button class="btn btn-default replay-next" type="button" aria-label="Next">\
                    <span class="glyphicon glyphicon-forward"></span></button>\
            </div>';
        battleView.append(media);

        battleView.find(".replay-turned").on("click", function() {
        	self.mode = "turns";
        });
        battleView.find(".replay-timed").on("click", function() {
        	self.mode= "timed";
        });
        battleView.find(".replay-pause").on("click", function() {
        	if (!self.paused) {
        		$(this).attr("aria-label", "Play");
        		$(this).html('<span class="glyphicon glyphicon-play">');
        	} else {
        		$(this).attr("aria-label", "Pause");
        		$(this).html('<span class="glyphicon glyphicon-pause">');
        	}
        	self.paused = !self.paused;
        	$(this).blur();
        });
        battleView.find(".replay-next").on("click", function(){
        	self.forceNext = 2;
        	$(this).blur();
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
		if (this.forceNext == 1 && this.commandStack.length > 0 && 
			this.commandStack[0].command.command == "turn") {
			this.forceNext = false;
		}
		if (this.forceNext > 1) {
			this.forceNext -= 1;
		}

		if (this.paused && !this.forceNext) {
			return;
		}

		var now = +(new Date());
		var diff = now - this.refTime;
		this.time += diff;
		this.refTime = now;

		if (this.commandStack.length > 0) {
			if (this.forceNext || this.mode == "turns" && !this._battle.paused || this.mode=="timed" && this.commandStack[0].time < this.time) {
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
	players: {setPlayers: function(){}, addPlayer: function(){}, removePlayer:function(){}}
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