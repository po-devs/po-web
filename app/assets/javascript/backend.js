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

    ownPlayer: function() {
        return webclient.players.player(webclient.ownId);
    },

    requestInfo: function(id) {
        network.command("player", {"id": id});
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

    challenge: function(id, params) {
        //network.send("challengeplayer", {"id": id, "team": 0, "clauses": clauses, "tier": tier });
        network.send("challengeplayer", $.extend({"id": id}, params));
    },

    dealWithChallenge: function(params) {
        if (params.desc == "sent") {
            if (webclient.players.isIgnored(params.id) || params.mode != 0) {
                webclient.declineChallenge(params);
            } else {
                webclientUI.showChallenge(params);
            }
        } else if (params.desc == "cancelled") {
            webclientUI.cancelChallenge(params);
        } else {
            console.log(params);
            var messages = {
                "busy": "#player is busy.",
                "refused": "#player refused your challenge.",
                "invalidtier": "You can't challenge #player in " + params.tier + ".",
                "invalidgen": "You can't challenge #player, generation is invalid.",
                "invalidteam": "You can't challenge #player by selecting this team."
            };

            if (params.desc in messages) {
                webclientUI.printHtml($("<div>").append($("<span>").addClass("challenge-"+params.desc).text(messages[params.desc].replace("#player", webclient.players.name(params.id)))).html());
            } else {
                console.log("unknown challenge type received");
                console.log(payload);
            }
        }
    },

    declineChallenge: function(params) {
        console.log("declining " + JSON.stringify(params));
        network.send("challengeplayer", $.extend({}, params, {"desc": "refused"}));
    },

    acceptChallenge: function(params) {
        console.log("accepting " + JSON.stringify(params));
        network.send("challengeplayer", $.extend({}, params, {"desc": "accepted"}));
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
