var webclient = {
    players : new PlayerHolder(),
    channels : new ChannelHolder(),
    pms: new PMHolder(),
    battles: new Battles(),
    ownTiers: [],
    team: {"tier": "", "pokes":[new Poke(),new Poke(),new Poke(),new Poke(),new Poke(),new Poke()]},

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

        loginInfo.ladder = poStorage.get('player.ladder', 'boolean');
        if (loginInfo.ladder == null) {
            loginInfo.ladder = true;
        }

        loginInfo.idle = poStorage.get('player.idle', 'boolean');
        if (loginInfo.idle == null) {
            loginInfo.idle = true;
        }

        loginInfo.color = poStorage.get('player.color') || "";
        loginInfo.info = {"avatar": poStorage.get("player.avatar") || 167, "info": poStorage.get('player.info')};

        if (webclient.team) {
            webclient.cacheTeam();
            loginInfo.teams = [webclient.getTeamData(webclient.team)];
        }
        
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

    cancelFindBattle: function() {
        network.send("challengeplayer", {"id": 0});
    },

    dealWithChallenge: function(params) {
        if (params.desc == "sent") {
            if (webclient.players.isIgnored(params.id) || params.mode != 0) {
                webclient.declineChallenge(params);
            } else if (webclientUI.teambuilderOpen) {
                webclient.declineChallenge(params, "busy");
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

    declineChallenge: function(params, reason) {
        console.log("declining " + JSON.stringify(params));
        network.send("challengeplayer", $.extend({}, params, {"desc": reason || "refused"}));
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
    },

    getTeamData: function(orTeam) {
        orTeam = orTeam || this.team;
        var team = {};
        team.tier = orTeam.tier;
        team.gen = orTeam.gen;
        team.pokes = [{},{},{},{},{},{}];
        team.illegal = orTeam.illegal || false;
        team.name = orTeam.name || "";
        for (var i in orTeam.pokes) {
            $.extend(team.pokes[i], orTeam.pokes[i]);
            delete team.pokes[i]["ui"];
            delete team.pokes[i]["data"];
        }

        console.log(team);

        return team;
    },

    cacheTeam: function() {
        var newTeam = JSON.stringify($.extend({}, this.getTeamData(), {"tier":""}));
        var oldCache = this.cachedTeam;
        this.cachedTeam = newTeam;

        return !oldCache || newTeam != oldCache;
    },

    sendTeam: function() {
        if (!webclient.team.tier || webclient.cacheTeam()) {
            network.command("teamchange", {"teams":[webclient.getTeamData()]});
        } else {
            network.command("changetier", {"0":webclient.team.tier});
        }
    },

    saveTeam: function() {
        poStorage.set("team", webclient.getTeamData());
    },

    loadTeam: function() {
        var team = poStorage.get("team", "object");
        console.log(team);

        if (team) {
            webclient.team = team;
            for (var i in team.pokes) {
                webclient.team.pokes[i] = $.extend(new Poke(), team.pokes[i]);
            }
        }
        console.log(webclient.team);
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
    webclient.loadTeam();

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

    serverConnect({"relay": poStorage.get("relay"), "port": poStorage.get("port")});
});

window.webclient = webclient;
