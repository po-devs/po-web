var webclient = {
	players: {
		on: function(){}
	},
	print: console.log.bind(console)
};

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