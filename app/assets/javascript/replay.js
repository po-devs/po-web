var webclient = {
	players: {
		on: function(){}
	},
	battles: {
		watchBattle: function(id, params) {
			console.log("battle started");
			console.log(params);
		},
		serverStopWatching: function(id) {
			console.log("battle end");
		},
		dealWithCommand: function(time, params) {
			console.log(params);
		}
	},
	print: console.log.bind(console)
};

vex.defaultOptions.className = 'vex-theme-os';

$(function() {
	var relayGiven = utils.queryField('relay');
    var portGiven = utils.queryField('port');

	serverConnect({"onconnect": function() {
			console.log("connected callback");

			network.command("replay", {battle: battleToReplay});
		},
		"relay": relayGiven,
		"port": portGiven
	});
})