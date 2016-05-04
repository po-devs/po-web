function createNetwork(WebSocket) {
    var states = {
        Connecting: 0,
        Open: 1,
        Closing: 2,
        Closed: 3,
        "0": "Connecting",
        "1": "Open",
        "2": "Closing",
        "3": "Closed"
    };

    // TODO: Organize this
    var transformers = {
        register: function () {
            return "register|";
        },
        registry: function () {
            return "registry";
        },
        // ?
        teamchange: function (payload) {
            return "teamchange|" + JSON.stringify(payload);
        },
        changetier: function (payload) {
            return "changetier|" + JSON.stringify(payload);
        },
        // battle: number
        watch: function (payload) {
            return "watch|" + payload.battle;
        },
        // battle: number
        stopwatching: function (payload) {
            return "stopwatching|" + payload.battle;
        },
        // sameTier: boolean, range: number
        findbattle: function (payload) {
            return "findbattle|" + JSON.stringify(payload);
        },
        // ?
        battlechoice: function (payload) {
            return "battlechoice|" + payload.id + "|" + JSON.stringify(payload.choice);
        },
        // battle: number
        forfeit: function (payload) {
            return "forfeit|" + payload.battle;
        },
        // id: number
        player: function (payload) {
            return "player|" + payload.id;
        },
        // ip: string
        connect: function (payload) {
            return "connect|" + payload.ip;
        },
        replay: function (payload) {
            return "replay|" + payload.battle;
        },
        // channel: string
        joinchannel: function (payload) {
            return "join|" + payload.channel;
        },
        // channel: number
        leavechannel: function (payload) {
            return "leave|" + payload.channel;
        },
        // message: string, channel: number
        chat: function (payload) {
            return "chat|" + JSON.stringify(payload);
        },
        // to: number, message: string
        pm: function (payload) {
            return "pm|" + JSON.stringify(payload);
        },
        // battle: number, message: string
        battlechat: function (payload) {
            return "battlechat|" + payload.battle + "|" + payload.message;
        },
        // battle: number, message: string
        spectatingchat: function (payload) {
            return "spectatingchat|" + payload.battle + "|" + payload.message;
        },
        // version: number, name: string, default: string, autojoin: string, ladder: boolean, idle: boolean, color: string
        login: function (payload) {
            return "login|" + JSON.stringify(payload);
        },
        // hash: string
        auth: function (payload) {
            return "auth|" + payload.hash;
        },
        // id: number
        getrankings: function (payload) {
            return "getrankings|" + payload.id;
        },
        //id: number, tier: string, team: number (of own team slot), clauses: number
        challengeplayer: function (payload) {
            /* Convert clauses as an array to a number */
            var copy = $.extend({}, payload, {"clauses": 0});
            var mult = 1;
            for (var i in payload.clauses) {
                copy.clauses += mult * payload.clauses[i];
                mult *= 2;
            }
            return "challenge|" + JSON.stringify(copy);
        },
        kick: function (payload) {
            return "kick|" + payload.id;
        },
        ban: function (payload) {
            return "ban|" + payload.id;
        },
        idle: function (payload) {
            return "idle|" + (payload.away ? 1 : 0);
        },
        ladder: function (payload) {
            return "ladder|" + (payload.ladder ? 1 : 0);
        }
    };

    var parsers = {
        defaultserver: function (payload) {
            /* If the server is on the same IP as the relay, we display the server IP but
                send localhost */
            var server = payload.replace("localhost", this.relay),
                qserver = utils.queryField("server");

            $("#advanced-connection").val((qserver && qserver !== "default") ? qserver : server);

            if (utils.queryField("autoconnect") === "true") {
                webclient.connectToServer();
            } else {
                this.command("registry");
            }
        },
        servers: function (payload) {
            var servers = JSON.parse(payload),
                html = "",
                server, len, i;

            for (i = 0, len = servers.length; i < len; i += 1) {
                server = servers[i];
                html += "<tr><td class='server-name'>" + server.name + "</td><td>" + server.num + ("max" in server ? " / " + server.max : "") + "</td><td class='server-ip'>" + server.ip + ":" + server.port + "</td></tr>";
                webclient.registry.descriptions[server.name] = server.description;
            }

            $("#servers-list tbody").prepend(html);
            $("#servers-list").tablesorter({
                sortList: [[1, 1]]
            });
        },
        connected: function () {
            webclient.onConnected();
        },
        disconnected: function () {
            webclientUI.printDisconnectionMessage();
            webclient.connectedToServer = false;
            // announcement.hide("slow");
        },
        msg: function (payload) {
            webclient.print(payload);
        },
        error: function (payload) {
            webclient.print(payload);
        },
        chat: function (payload) {
            webclient.onChat(JSON.parse(payload));
        },
        playerkick: function (payload) {
            var params = JSON.parse(payload);
            if (params.source) {
                webclientUI.printHtml("<span class='player-kick'>" + utils.escapeHtml(webclient.players.name(params.source)) + " kicked " +
                    utils.escapeHtml(webclient.players.name(params.target)) + "!</span>");
            } else {
                webclientUI.printHtml("<span class='player-kick'>" + utils.escapeHtml(webclient.players.name(params.target)) +
                    " was kicked by the server!</span>");
            }
        },
        playerban: function (payload) {
            var params = JSON.parse(payload);
            if (params.source) {
                webclientUI.printHtml("<span class='player-ban'>" + utils.escapeHtml(webclient.players.name(params.source)) + " banned " +
                    utils.escapeHtml(webclient.players.name(params.target)) + (params.hasOwnProperty("time") ? " for " + params.time + " minute(s)" : "") + "!</span>");
            } else {
                webclientUI.printHtml("<span class='player-ban'>" + utils.escapeHtml(webclient.players.name(params.target)) +
                    " was banned by the server" + (params.hasOwnProperty("time") ? " for " + params.time + " minute(s)" : "") + "!</span>");
            }
        },
        challenge: function (payload) {
            webclient.registered = true;
            $("#register-dd").addClass("disabled");

            var net = this;

            //var password = $("#password").val();
            var password = '';

            var hash;

            if (password) {
                hash = MD5(MD5(password) + payload);
                net.send("auth", {hash: hash});
            } else {
                vex.dialog.open({
                    message: "Please enter your password, <strong>" + poStorage.get("user") +"</strong> (<small><a href='" + window.location.pathname + "' target='_self' onclick='poStorage.remove(\"user\");'>Not you?</a></small>):",
                    input: "<input name='password' type='password' placeholder='Password' required />",
                    callback: function (res) {
                        if (res && res.password) {
                            // after clicking OK
                            // res.password is the value from the textbox
                            hash = MD5(MD5(res.password) + payload);
                            net.send("auth", {hash: hash});
                        } else {
                            // after clicking Cancel
                            net.close();
                        }
                    }
                });
            }
        },
        battlechallenge: function(payload) {
            var params = JSON.parse(payload);
            var clauses = [];
            for (var i in BattleTab.clauses) {
                if (params.clauses & (1 << i)) {
                    clauses.push(1);
                } else {
                    clauses.push(0);
                }
            }
            params.clauses = clauses;

            webclient.dealWithChallenge(params);
        },
        announcement: function (payload) {
            /*webclient.sandboxHtml(announcement, payload);
            announcement.css("visibility", "visible");*/
        },
        channels: function (payload) {
            webclient.channels.setNames(JSON.parse(payload));
        },
        newchannel: function (payload) {
            var params = JSON.parse(payload);
            webclient.channels.newChannel(params.id, params.name);
        },
        removechannel: function (payload) {
            webclient.channels.removeChannel(payload);
        },
        channelnamechange: function (payload) {
            var params = JSON.parse(payload);
            webclient.channels.changeChannelName(params.id, params.name);
        },
        players: function (payload) {
            var params = JSON.parse(payload);
            webclient.players.addPlayer(params);
        },
        playerlogout: function (payload) {
            webclient.players.removePlayer(payload);
        },
        join: function (payload) {
            var parts = payload.split("|"),
                chan = +parts[0],
                player = +parts[1];

            webclient.channels.channel(chan).newPlayer(player);
        },
        leave: function (payload) {
            var parts = payload.split("|"),
                chan = +parts[0],
                player = +parts[1];

            webclient.channels.channel(chan).removePlayer(player);
            webclient.players.testPlayerOnline(player);
        },
        channelplayers: function (payload) {
            var params = JSON.parse(payload);
            webclient.channels.channel(params.channel).setPlayers(params.players);
            webclient.channels.joinChannel(params.channel);
        },
        login: function (payload) {
            webclient.connectedToServer = true;

            var params = JSON.parse(payload);
            webclient.ownTiers = params.tiers;
            webclient.players.login(params.id, params.info);

            this.command("getrankings", {id: params.id});
        },
        unregistered: function (payload) {
            $("#register-dd").removeClass("disabled");
            webclient.registered = false;
        },
        pm: function (payload) {
            var params = JSON.parse(payload),
                src = params.src;
            if (!webclient.players.isIgnored(src)) {
                webclient.pms.pm(src).printMessage(src, params.message);
            }
        },
        watchbattle: function (payload) {
            var id = payload.split("|")[0];
            var params = JSON.parse(payload.slice(id.length + 1));
            webclient.battles.watchBattle(+id, params);
        },
        battlecommand: function (payload) {
            var battleid = payload.split("|")[0];
            if (battleid in webclient.battles.battles) {
                webclient.battles.dealWithCommand(battleid, JSON.parse(payload.slice(battleid.length + 1)));
            }
        },
        replaycommand: function (payload) {
            var time = payload.split("|")[0];
            webclient.battles.dealWithCommand(+time, JSON.parse(payload.slice(time.length + 1)));
        },
        battlestarted: function (payload) {
            var battleid = payload.split("|")[0],
                battle = JSON.parse(payload.slice(battleid.length + 1)),
                obj = {};

            obj[battleid] = battle;
            webclient.battles.addBattle(obj);
        },
        channelbattle: function (payload) {
            var chanid = payload.split("|")[0],
                params = JSON.parse(payload.slice(chanid.length + 1)),
                obj = {};

            obj[params.battleid] = params.battle;
            webclient.battles.addBattle(obj);
        },
        channelbattlelist: function (payload) {
            var chanid = payload.split("|")[0],
                battle = JSON.parse(payload.slice(chanid.length + 1));

            webclient.battles.addBattle(battle);

            /* Update whole player list */
            // if (chanid === webclient.currentChannel()) {
            //     webclient.ui.playerList.setPlayers(webclient.channel.playerIds());
            // }
        },
        battlefinished: function (payload) {
            var battleid = payload.split("|")[0],
                result = JSON.parse(payload.slice(battleid.length + 1));

            webclient.battles.battleEnded(battleid, result);
        },
        stopwatching: function (payload) {
            webclient.battles.serverStopWatching(+payload);
        },
        rankings: function (payload) {
            var parts = payload.split("|"),
                id = parts[0],
                rankings = JSON.parse(parts[1]), tier, rank,
                html = "";

            for (tier in rankings) {
                rank = rankings[tier];
                if (rank.ranking === -1) {
                    html += "<li><strong>Unranked</strong>";
                } else {
                    html += "<li><strong>#" + rank.ranking + "/" + rank.total + "</strong> <em>(" + rank.rating + ")</em>";
                }

                html += " - <strong>" + tier + "</strong></li>";
            }

            $("#rankings").html(html);
        },
        tiers: function (payload) {
            webclient.tiersList = JSON.parse(payload);
        },
        optionschange: function (payload) {
            webclient.players.optionsChange(JSON.parse(payload));
        },
        teamtiers: function (payload) {
            webclient.ownTiers = JSON.parse(payload);
        }
    };

    //actual working commands:
    parsers = {
        connected: parsers.connected,
        disconnected: parsers.disconnected,
        msg: parsers.msg,
        error : parsers.error,
        chat: parsers.chat,
        playerkick: parsers.playerkick,
        playerban: parsers.playerban,
        players: parsers.players,
        channels: parsers.channels,
        newchannel: parsers.newchannel,
        removechannel: parsers.removechannel,
        channelnamechange: parsers.channelnamechange,
        join: parsers.join,
        leave: parsers.leave,
        playerlogout: parsers.playerlogout,
        login: parsers.login,
        channelplayers: parsers.channelplayers,
        challenge: parsers.challenge,
        pm: parsers.pm,
        watchbattle: parsers.watchbattle,
        battlechallenge: parsers.battlechallenge,
        battlecommand: parsers.battlecommand,
        replaycommand: parsers.replaycommand,
        battlestarted: parsers.battlestarted,
        battlefinished: parsers.battlefinished,
        channelbattle: parsers.channelbattle,
        channelbattlelist: parsers.channelbattlelist,
        optionschange: parsers.optionschange,
        unregistered: parsers.unregistered,
        tiers: parsers.tiers,
        teamtiers: parsers.teamtiers,
        stopwatching: parsers.stopwatching
    };

    function Network() {
        $.observable(this);

        this.buffer = [];
        this.socket = null;

        this.relay = "";
        this.ip = "";

        this._opened = false;
    }

    Network.prototype.open = function (ip, onopen, onerror, onclose) {
        if (this._opened) {
            return;
        }

        try {
            this.socket = new WebSocket("ws://" + ip);
        } catch (ex) {
            vex.dialog.alert("Invalid relay IP.");
            throw ex;
        }

        this.ip = ip;
        this.relay = ip.substr(0, ip.lastIndexOf(":"));

        this._opened = true;
        this.socket.onopen = this.onopen(onopen);
        this.socket.onmessage = this.onmessage();
        if (typeof onerror === "function") {
            this.socket.onerror = onerror;
        }
        if (typeof onerror === "function") {
            this.socket.onclose = onclose;
        }
        return this;
    };

    Network.prototype.command = Network.prototype.send = function (command, payload) {
        this.sendRaw(transformers[command].call(this, payload));
        return this;
    };

    Network.prototype.sendRaw = function (msg) {
        if (!this.isOpen()) {
            this.buffer.push(msg);
            return this;
        }

        try {
            this.socket.send(msg);
        } catch (ex) {} // Ignore potential SYNTAX_ERRs
        return this;
    };

    Network.prototype.close = function () {
        if (!this.opened()) {
            return;
        }

        this.socket.close(1000);
        this.socket = null;
        this._opened = false;
        webclient.connectedToServer = false;
        return this;
    };

    // State
    Network.prototype.opened = function () {
        var socket = this.socket;
        return socket && (socket.readyState === states.Connecting || socket.readyState === states.Open);
    };

    Network.prototype.isOpen = function () {
        var socket = this.socket;
        return socket && (socket.readyState === states.Open);
    };

    // Events
    Network.prototype.onopen = function (cb) {
        var net = this;

        return function () {
            for (var i = 0, len = net.buffer.length; i < len; i++) {
                net.sendRaw(net.buffer[i]);
            }

            if (typeof cb === "function") {
                cb.call(net, net);
            }
        };
    };

    Network.prototype.onmessage = function () {
        var net = this;
        return function (evt) {
            var data = evt.data,
                pipe = data.indexOf("|"),
                cmd, payload;

            if (pipe === -1) {
                console.error("Received raw message, should be changed in the relay station:", data);
            } else {
                cmd = data.substr(0, pipe);
                payload = data.slice(pipe + 1);
                if (parsers.hasOwnProperty(cmd)) {
                    parsers[cmd].call(net, payload);
                } else {
                    net.trigger(cmd, payload);
                }
            }
        };
    };

    Network.states = Network.prototype.states = states;
    Network.transformers = transformers;
    Network.parsers = parsers;

    window.Network = Network;
    window.network = new Network();
}

createNetwork(typeof MozWebSocket === "function" ? MozWebSocket : WebSocket);
var network = window.network;
