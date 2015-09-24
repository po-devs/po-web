function createNetwork(WebSocket) {
    var states = {
        Connecting: 0,
        Open: 1,
        Closing: 2,
        Closed: 3,
        '0': 'Connecting',
        '1': 'Open',
        '2': 'Closing',
        '3': 'Closed'
    };

    // TODO: Organize this
    var transformers = {
        register: function () {
            return 'register|';
        },
        registry: function () {
            return 'registry';
        },
        // ?
        teamchange: function (payload) {
            return 'teamChange|' + JSON.stringify(payload);
        },
        // battle: number
        watch: function (payload) {
            return 'watch|' + payload.battle;
        },
        // battle: number
        stopwatching: function (payload) {
            return 'stopwatching|' + payload.battle;
        },
        // sameTier: boolean, range: number
        findbattle: function (payload) {
            return 'findbattle|' + JSON.stringify(payload);
        },
        // ?
        battlechoice: function (payload) {
            return 'battlechoice|' + payload.id + '|' + JSON.stringify(payload.choice);
        },
        // battle: number
        forfeit: function (payload) {
            return 'forfeit|' + payload.battle;
        },
        // id: number
        player: function (payload) {
            return 'player|' + payload.id;
        },
        // ip: string
        connect: function (payload) {
            return 'connect|' + payload.ip;
        },
        // channel: string
        joinchannel: function (payload) {
            return 'join|' + payload.channel;
        },
        // channel: number
        leavechannel: function (payload) {
            return 'leave|' + payload.channel;
        },
        // message: string, channel: number
        chat: function (payload) {
            return 'chat|' + JSON.stringify(payload);
        },
        // to: number, message: string
        pm: function (payload) {
            return 'pm|' + JSON.stringify(payload);
        },
        // battle: number, message: string
        battlechat: function (payload) {
            return 'battlechat|' + payload.battle + '|' + payload.message;
        },
        // battle: number, message: string
        spectatingchat: function (payload) {
            return 'spectatingchat|' + payload.battle + '|' + payload.message;
        },
        // version: number, name: string, default: string, autojoin: string, ladder: boolean, idle: boolean, color: string
        login: function (payload) {
            return 'login|' + JSON.stringify(payload);
        },
        // hash: string
        auth: function (payload) {
            return 'auth|' + payload.hash;
        },
        // id: number
        getrankings: function (payload) {
            return 'getrankings|' + payload.id;
        },
        //id: number, tier: string, team: number (of own team slot), clauses: number
        challengeplayer : function(payload) {
            /* Convert clauses as an array to a number */
            var copy = $.extend({}, payload, {"clauses": 0});
            var mult = 1;
            for (var i in payload.clauses) {
                copy.clauses += mult * payload.clauses[i];
                mult *= 2;
            }
            return 'challenge|' + JSON.stringify(copy);
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
                this.command('registry');
            }
        },
        servers: function (payload) {
            var servers = JSON.parse(payload),
                html = "",
                server, len, i;

            for (i = 0, len = servers.length; i < len; i += 1) {
                server = servers[i];
                html += "<tr><td class='server-name'>" + server.name + "</td><td>" + server.num + ("max" in server ? " / " + server.max : "") + "</td>" + "<td class='server-ip'>" + server.ip + ":" + server.port + "</td></tr>";
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
            webclientUI.printHtml("<b>Disconnected from Server! If the disconnect is due to an internet problem, try to <a href='po:reconnect'>reconnect</a> once the issue is solved.</b>");
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
            var params = JSON.parse(payload);
            webclient.onChat(params);
        },
        challenge: function (payload) {
            var net = this;

            //var password = $("#password").val();
            var password = '';

            var hash;

            if (password) {
                hash = MD5(MD5(password) + payload);
                net.send('auth', {hash: hash});
            } else {
                vex.dialog.open({
                    message: 'Enter your password:',
                    input: '<input name="password" type="password" placeholder="Password" required />',
                    callback: function (res) {
                        if (res && res.password) {
                            // after clicking OK
                            // res.password is the value from the textbox
                            hash = MD5(MD5(res.password) + payload);
                            net.send('auth', {hash: hash});
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

            if (params.desc == "sent") {
                showChallenge(params);
            } else {
                webclient.print("<b>info on challenge with " + webclient.players.name(params.id) + ": " + params.desc
                    + "</b>", true);
            }
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
        },
        login: function (payload) {
            var params = JSON.parse(payload);
            webclient.players.login(params.id, params.info);

            this.command('getrankings', {id: params.id});
        },
        unregistered: function (payload) {
            $("#register").attr("disabled", false);
        },
        pm: function (payload) {
            var params = JSON.parse(payload),
                src = params.src;
            webclient.pms.pm(src).print(src, params.message);
        },
        watchbattle: function (payload) {
            var id = payload.split("|")[0];
            var params = JSON.parse(payload.slice(id.length + 1));
            battles.watchBattle(+id, params);
        },
        battlecommand: function (payload) {
            var battleid = payload.split("|")[0];
            if (battleid in battles.battles) {
                battles.battle(battleid).dealWithCommand(JSON.parse(payload.slice(battleid.length + 1)));
            }
        },
        battlestarted: function (payload) {
            var battleid = payload.split("|")[0],
                battle = JSON.parse(payload.slice(battleid.length + 1)),
                obj = {};

            obj[battleid] = battle;
            battles.addBattle(obj);
        },
        channelbattle: function (payload) {
            var chanid = payload.split("|")[0],
                params = JSON.parse(payload.slice(chanid.length + 1)),
                obj = {};

            obj[params.battleid] = params.battle;
            battles.addBattle(obj);
        },
        channelbattlelist: function (payload) {
            var chanid = payload.split("|")[0],
                battle = JSON.parse(payload.slice(chanid.length + 1));

            battles.addBattle(battle);

            /* Update whole player list */
            if (chanid === webclient.currentChannel()) {
                webclient.ui.playerList.setPlayers(webclient.channel.playerIds());
            }
        },
        battlefinished: function (payload) {
            var battleid = payload.split("|")[0],
                result = JSON.parse(payload.slice(battleid.length + 1));

            battles.battleEnded(battleid, result);
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
            window.tiersList = JSON.parse(payload);
        }
    };

    //actual working commands:
    parsers = {
        connected: parsers.connected,
        disconnected: parsers.disconnected,
        msg: parsers.msg,
        error : parsers.error,
        chat: parsers.chat,
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
        challenge: parsers.challenge
    };

    function Network() {
        $.observable(this);

        this.buffer = [];
        this.socket = null;

        this.relay = '';
        this.ip = '';

        this._opened = false;
    }

    var proto = Network.prototype;
    proto.open = function (ip, onopen, onerror, onclose) {
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

    proto.command = proto.send = function (command, payload) {
        this.sendRaw(transformers[command].call(this, payload));
        return this;
    };

    proto.sendRaw = function (msg) {
        if (!this.isOpen()) {
            this.buffer.push(msg);
            return this;
        }

        try {
            this.socket.send(msg);
        } catch (ex) {} // Ignore potential SYNTAX_ERRs
        return this;
    };

    proto.close = function () {
        if (!this.opened()) {
            return;
        }

        this.socket.close(1000);
        this.socket = null;
        this._opened = false;
        return this;
    };

    // State
    proto.opened = function () {
        var socket = this.socket;
        return socket && (socket.readyState === states.Connecting || socket.readyState === states.Open);
    };

    proto.isOpen = function () {
        var socket = this.socket;
        return socket && (socket.readyState === states.Open);
    };

    // Events
    proto.onopen = function (cb) {
        var net = this;

        return function () {
            var buffer = net.buffer,
                len = buffer.length,
                i;

            for (i = 0; i < len; i += 1) {
                net.sendRaw(buffer[i]);
            }

            if (typeof cb === "function") {
                cb.call(net, net);
            }
        };
    };

    proto.onmessage = function () {
        var net = this;
        return function (evt) {
            var data = evt.data,
                pipe = data.indexOf('|'),
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

    Network.states = proto.states = states;
    Network.transformers = transformers;
    Network.parsers = parsers;

    window.Network = Network;
    window.network = new Network();
};

createNetwork(typeof MozWebSocket === 'function' ? MozWebSocket : WebSocket);
var network = window.network;
