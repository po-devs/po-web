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
};

pmtab.getPlayers = function() {
    return [webclient.ownId, this.id];
};

pmtab.printMessage = function(id, msg) {
    var raw = id === -1,
        auth, pref;

    if (!raw) {
        auth = webclient.players.auth(id);

        msg = utils.escapeHtml(msg);
        msg = "<span class='player-message' style='color: " + webclient.players.color(id) + "'>" + utils.rank(auth) + utils.rankStyle(webclient.players.name(id) + ":", auth) + "</span>"
            + " " + utils.addChannelLinks(msg, webclient.channels.channelsByName(true));

        this.activateTab();
    }

    this.chat.insertMessage(msg, {
        timestamps: true,
        // TODO: pm.timestamps
        timestampCheck: 'chat.timestamps',
        html: raw,
        linebreak: true
    });
};

pmtab.reconnect = function() {

};

pmtab.disconnect = function() {

};
