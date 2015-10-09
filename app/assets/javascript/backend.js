var webclient = {
    players : new PlayerHolder(),
    channels : new ChannelHolder(),
    pms: new PMHolder(),
    battles: new Battles(),

    ownName: function() {
        return webclient.players.name(webclient.ownId);
    },

    ownAuth: function() {
        return webclient.players.auth(webclient.ownId);
    },

	onConnected: function() {
        webclientUI.printHtml("<timestamp/> Connected to server!");

        var loginInfo = {version:1};

        loginInfo.name = poStorage.get("user");

        // var data = {version: 1};
        // data.default = utils.queryField("channel");
        loginInfo.autojoin = poStorage("auto-join-"+webclient.serverIP, "array");

        // data.ladder = poStorage.get('player.ladder', 'boolean');
        // if (data.ladder == null) {
        //     data.ladder = true;
        // }

        loginInfo.idle = poStorage.get('player.idle', 'boolean');
        if (loginInfo.idle == null) {
            loginInfo.idle = true;
        }

        // data.color = poStorage.get('player.color');
        
        if (loginInfo.name) {
            network.command('login', loginInfo);
        } else {
            vex.dialog.open({
                message: 'Enter your username:',
                input: '<input name="username" type="text" placeholder="Username"/>',
                buttons: [
                    $.extend({}, vex.dialog.buttons.YES, {text: 'Login'}),
                    $.extend({}, vex.dialog.buttons.NO, {text: 'Login as Guest'})
                ],
                callback: function (res) {
                    if (res && res.username) {
                        loginInfo.name = res.username;
                        poStorage.set("user", res.username);
                    } else {
                        delete loginInfo.name;
                    }

                    network.command('login', loginInfo);
                }
            });
        }
	},

	onChat: function(params) {
		var chan = webclientUI.channels.channel(params.channel);

        if ((params.channel == -1 && params.message.charAt(0) != "~") || !chan) {
            webclientUI.printMessage(params.message, params.html);
        } else {
            chan.printMessage(params.message, params.html);
        }
	},

	print: function(msg) {
		console.log(msg);
	},

	sendMessage: function (message, id) {
		network.command('chat', {channel: id, message: message});
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
	},

    sendPM: function (message, id) {
        var lines = message.trim().split('\n'),
            line, len, i;

        for (i = 0, len = lines.length; i < len; i += 1) {
            line = lines[i];

            this.pms.pm(id).printMessage(webclient.ownId, line);
            network.command('pm', {to: id, message: line});
        }
    },

    joinChannel: function(id) {
        network.command('joinchannel', {channel: id});
    },

    leaveChannel: function(id) {
        network.command('leavechannel', {channel: id});
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

    webclient.channels.joinChannel(0);

	serverConnect();
});

window.webclient = webclient;
