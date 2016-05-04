function PMTab(id) {
    $.observable(this);
    var self = this;

    this.shortHand = "pm";
    this.id = id;
    webclient.players.addFriend(id);

    this.chat = new Chat();
    this.addTab(this.chat.element);

    this.chat.on("chat", this.sendMessage.bind(this));
}

utils.inherits(PMTab, BaseTab);

var pmtab = PMTab.prototype;

pmtab.sendMessage = function(msg) {
    webclient.sendPM(msg, this.id);
};

pmtab.onSetCurrent = function() {
    this.chat.scrollDown();
};

pmtab.name = function() {
    return webclient.players.name(this.id);
};

pmtab.close = function() {
    this.trigger("close");
    this.removeTab();
};

pmtab.getPlayers = function() {
    return [webclient.ownId, this.id];
};

pmtab.printMessage = function(id, msg) {
    this.activateTab();

    var raw = id === -1,
        auth, pref;
    var orMsg = msg;

    if (!raw) {
        auth = webclient.players.auth(id);

        msg = utils.escapeHtml(msg);
        msg = "<span class='player-message' style='color: " + webclient.players.color(id) + "'>" + utils.rank(auth) + utils.rankStyle(webclient.players.name(id) + ":", auth) + "</span>"
            + " " + utils.addChannelLinks(msg, webclient.channels.channelsByName(true));

        this.activateTab();
    }

    this.chat.insertMessage(msg, {
        timestamps: webclientUI.timestamps,
        html: raw,
        linebreak: true
    });

    if (id == this.id && !window.isActive) {
        if ("Notification" in window) {
            var notification = new window.Notification(this.name() + " says: ", {body: orMsg});
            setTimeout(function() {notification.close();}, 4000);
        }
    }
};

pmtab.reconnect = function() {
    msg = "<span class='text-center pm-disconnect'><em>The player reconnected.</em></span>";
    this.chat.insertMessage(msg, {
        timestamps: webclientUI.timestamps,
        html: true,
        linebreak: true
    });
};

pmtab.disconnect = function() {
    msg = "<span class='text-center pm-disconnect'><em>The player was disconnected.</em></span>";
    this.chat.insertMessage(msg, {
        timestamps: webclientUI.timestamps,
        html: true,
        linebreak: true
    });
};

$(function() {
    if ("Notification" in window) {
        window.Notification.requestPermission(function(result) {
          if (result === 'denied') {
            return;
          } else if (result === 'default') {
            return;
          }
          // Do something with the granted permission.
        });
    }
});
