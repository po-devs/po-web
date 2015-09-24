var webclient = {
  players : new PlayerHolder(),
  channels : new ChannelHolder(),

	onConnected: function() {
        webclientUI.printHtml("<timestamp/> Connected to server!");

        var loginInfo = {version:1, idle: true};

        loginInfo.name = poStorage.get("user");

        if (!loginInfo.name) {
            delete loginInfo.name;
            webclientUI.printHtml("<timestamp/> <strong>No name set. Do so on the <a href=http://registry.pokemon-online.eu>main page</a>.</strong>");
        }

        network.command('login', loginInfo);

        // var data = {version: 1};
        // data.default = utils.queryField("channel");
        // data.autojoin = poStorage("auto-join-"+webclient.serverIp(), "array");

        // data.ladder = poStorage.get('player.ladder', 'boolean');
        // if (data.ladder == null) {
        //     data.ladder = true;
        // }

        // data.idle = poStorage.get('player.idle', 'boolean');
        // if (data.idle == null) {
        //     data.idle = false;
        // }

        // data.color = poStorage.get('player.color');
        // webclient.connectedToServer = true;
	},

	onChat: function(params) {
		webclientUI.printMessage(params.message, params.html);
		// var chan = webclient.channels.channel(params.channel);

  //       if ((params.channel == -1 && params.message.charAt(0) != "~") || !chan) {
  //           webclient.print(params.message, params.html);
  //       } else {
  //           chan.print(params.message, params.html);
  //       }
	},

	print: function(msg) {
		console.log(msg);
	},

	sendMessage: function (message, id) {
		network.command('chat', {channel: 0, message: message});
	    // if (!network.isOpen()) {
	    //     webclient.printRaw("ERROR: Connect to the relay station before sending a message.");
	    //     return;
	    // }

	    // if (/^send-channel-/.test(id)) {
	    //     webclient.channels.channel(+id.replace('send-channel-', '')).sendMessage(message);
	    // } else if (/^send-pm-/.test(id)) {
	    //     webclient.pms.pm(+id.replace('send-pm-', '')).sendMessage(message);
	    // } else if(/^send-battle-/.test(id)) {
	    //     battles.battles[(+id.replace('send-battle-', ''))].sendMessage(message);
	    // }
	}
};

$(function() {
    var userGiven = utils.queryField('user');
    var relayGiven = utils.queryField('relay');
    var portGiven = utils.queryField('port');

    if (userGiven) {
        poStorage.set("user", userGiven);
    }
    if (relayGiven){
        poStorage.set("relay", relayGiven);
    }
    if (portGiven) {
        poStorage.set("port", portGiven);
    }

	serverConnect();
});