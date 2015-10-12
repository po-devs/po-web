function ChannelTab(id, name) {
    $.observable(this);
    this.shortHand = "channel";
    this.id = id;
    this.name = name;
    this.players = {};

    var self = this;

    /* We can close a channel tab only if the client decided to close the channel,
      and the server kicked us out of the channel / destroyed the channel.

      We keep track with this variable. */
    this.closable = 0; // 1 = Server close, 2=Player close

    this.channel = webclient.channels.channel(id);

    if (!webclient.currentTab) {
        webclient.currentTab = this;
    }

    this.channel.off("*");
    this.channel.on("setplayers", function(ids) {self.setPlayers(ids);});
    this.channel.on("playeradd", function(id) {self.newPlayer(id);});
    this.channel.on("playerremove", function(id) {self.removePlayer(id);});
    this.channel.on("changename", function(name) {self.changeName(name);});
    // var $chan = $("#channel-" + id);
    // if ($chan.length === 0 || $chan.data('initialized') === false) {
    //     /* Create new tab */
    //     if ($chan.length === 0) {
    //         $('#channel-tabs').tabs("add", "#channel-" + id, webclient.classes.BaseTab.makeName(name || ("channel " + id)));
    //     }

    //     this.chat = new webclient.classes.Chat('send-channel-' + id);
    //     this.chat.appendTo($("#channel-" + id));
    //     $chan.data('initialized', true);
    // }
    this.chat = new Chat();
    this.addTab(this.chat.element);

    this.chat.on("chat", function(msg) {
        webclient.sendMessage(msg, self.id);
    });
}

utils.inherits(ChannelTab, BaseTab);

var channeltab = ChannelTab.prototype;

channeltab.onSetCurrent = function() {
    this.chat.scrollDown();
};

channeltab.close = function() {
    this.trigger("close");
    this.removeTab();
};

channeltab.getPlayers = function() {
    return Object.keys(this.channel.players);
};

channeltab.setPlayers = function (players) {
    // var len, id, i;

    // /* The server 'unclosed' us, so removing server close if there */
    // this.closable &= ~1;

    // this.players = {};

    // for (i = 0, len = players.length; i < len; i += 1) {
    //     id = players[i];
    //     this.players[id] = true;
    // }

    // this.trigger("setplayers");

    if (this.isCurrent()) {
        webclientUI.players.setPlayers(players);
    }
};

channeltab.newPlayer = function (player) {
    //this.players[player] = true;

    if (webclientUI.channels.chanEventsEnabled(this.channel.id) && !this.channel.loadingPlayers) {
        this.printHtml('<span class="player-join">' + utils.escapeHtml(webclient.players.name(player)) + ' joined the channel.');
    }

    if (this.isCurrent()) {
        webclientUI.players.addPlayer(player);
    }
};

channeltab.removePlayer = function (player) {
    // delete this.players[player];

    // if (player === webclient.ownId) {
    //     if (this.closable & 2) {
    //         this.remove();
    //     } else {
    //         this.closable |= 1;
    //         this.print("<i>You were removed from this channel</i>", true);
    //     }
    // }
    
    if (webclientUI.channels.chanEventsEnabled(this.channel.id) && !this.channel.loadingPlayers) {
        this.printHtml('<span class="player-leave">' + utils.escapeHtml(webclient.players.name(player)) + ' left the channel.');
    }

    if (this.isCurrent()) {
        webclientUI.players.removePlayer(player);
    }
};

channeltab.hasPlayer = function(player) {
//    return player in this.players;
};

channeltab.print = function (msg, html, raw) {
    // var pref, id, auth;

    // if (raw !== true) {
    //     if (html) {
    //         msg = webclient.convertImages($("<div>").html(msg)).html();
    //     } else {
    //         msg = utils.escapeHtml(msg);

    //         if (msg.substr(0, 3) === "***") {
    //             msg = "<span class='action'>" + msg + "</span>";
    //         } else if (msg.indexOf(":") !== -1) {
    //             pref = msg.substr(0, msg.indexOf(":"));
    //             id = webclient.players.id(pref);
    //             auth = webclient.players.auth(id);

    //             if (webclient.players.isIgnored(id)) {
    //                 return;
    //             }

    //             if (pref === "~~Server~~") {
    //                 pref = "<span class='server-message'>" + pref + ":</span>";
    //             } else if (pref === "Welcome Message") {
    //                 pref = "<span class='welcome-message'>" + pref + ":</span>";
    //             } else if (id === -1) {
    //                 pref = "<span class='script-message'>" + pref + ":</span>";
    //             } else {
    //                 pref = "<span class='player-message' style='color: " + webclient.players.color(id) + "'>" + utils.rank(auth) + utils.rankStyle(pref + ":", auth) + "</span>";
    //                 this.activateTab();
    //             }

    //             msg = pref + utils.addChannelLinks(msg.slice(msg.indexOf(":") + 1), webclient.channels.channelsByName(true));
    //         }
    //     }
    // }

    // this.chat.insertMessage(msg, {
    //     timestamps: true,
    //     timestampCheck: 'chat.timestamps',
    //     html: html,
    //     linebreak: true
    //  });
};

channeltab.printHtml = function(html) {
    this.printMessage(html, true);
};

channeltab.printMessage = function(msg, html) {
    var flash = false;
    if (!msg.startsWith(webclient.ownName()) && msg.indexOf(webclient.ownName()) != -1) {
        this.flashTab();
        flash = true;

        /* When flashed, also display a notification */
        if (!window.isActive) {
            if ("Notification" in window) {
                //console.log("spawning notification");
                var notification = new window.Notification("In #"+this.name + ": ", {body: html ? utils.stripHtml(msg): msg});
            }
        }
    }
    if (html) {
        msg = webclientUI.convertImages($("<div>").html(msg)).html();
    } else {
        msg = utils.escapeHtml(msg);

        if (msg.substr(0, 3) === "***") {
            msg = "<span class='action'>" + msg + "</span>";
        } else if (msg.indexOf(":") !== -1) {
            var pref = msg.substr(0, msg.indexOf(":"));
            var id = webclient.players.id(pref);

            var auth = webclient.players.auth(id);

            if (webclient.players.isIgnored(id)) {
                return;
            }

            if (pref === "~~Server~~") {
                pref = "<span class='server-message'>" + pref + ":</span>";
            } else if (pref === "Welcome Message") {
                pref = "<span class='welcome-message'>" + pref + ":</span>";
            } else if (id === -1) {
                pref = "<span class='script-message'>" + pref + ":</span>";
            } else {
                pref = "<span class='player-message' style='color: " + webclient.players.color(id) + "'>" + utils.rank(auth) + utils.rankStyle(pref + ":", auth) + "</span>";
                this.activateTab();
            }

            msg = pref + utils.addChannelLinks(msg.slice(msg.indexOf(":") + 1), webclient.channels.channelsByName(true));
            //msg = pref + msg.slice(msg.indexOf(":") + 1);
        }
    }

    if (flash) {
        msg = "<mark>" + msg + "</mark>";
    }

    this.chat.insertMessage(msg, {timestamps: webclientUI.timestamps});
    //$(".chat").html($(".chat").html() + utils.stripHtml(msg) + "<br>");
};

channeltab.sendMessage = function (message) {
    // var lines = message.trim().split('\n'),
    //     line, pid, len, i;

    // for (i = 0, len = lines.length; i < len; i += 1) {
    //     line = lines[i];
    //     // Temporary
    //     if (/^\/pm/i.test(line)) {
    //         pid = webclient.players.id(line.slice(4));
    //         if (pid !== -1) {
    //             webclient.pms.pm(pid).activateTab();
    //             return;
    //         }
    //     }

    //     network.command('chat', {channel: this.id, message: line});
    // }
};

channeltab.changeName = function (name) {
    this.name = name;

    // $("#channel-tabs > ul a[href=\"#channel-" + this.id + "\"]").html("<span>" + webclient.classes.BaseTab.makeName(name) + '</span>');
};

channeltab.disconnect = function() {
    // this.trigger("disconnect");
    // this.players = {};
};

channeltab.remove = function () {
    //this.trigger("remove");
};

