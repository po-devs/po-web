function PMTab(id) {
    $.observable(this);
    var self = this;

    this.shortHand = "pm";
    this.id = id;
    webclient.players.addFriend(id);

    this.chat = new Chat();
    this.addTab(this.chat.element);

    this.chat.on("chat", function(msg) {
        webclient.sendPM(msg, self.id);
    });
}

utils.inherits(PMTab, BaseTab);

var pmtab = PMTab.prototype;

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
            //console.log("spawning notification");
            var notification = new window.Notification(this.name() + " says: ", {body: orMsg});
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
        console.log("Requesting notification permission.");
        window.Notification.requestPermission(function(result) {
          if (result === 'denied') {
            console.log('Permission for notifications wasn\'t granted. Allow a retry.');
            return;
          } else if (result === 'default') {
            console.log('The permission request for notifications was dismissed.');
            return;
          }
          console.log("The permission for notifications was accepted");
          // Do something with the granted permission.
        });
    }
});
