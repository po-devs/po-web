function ChannelData(name) {
    this.players = {};
    this.name = name || "";
};

var channeldata = ChannelData.prototype;

channeldata.setPlayers = function(ids) {
    for (x in ids) {
        this.newPlayer(ids[x]);
    }
};

channeldata.newPlayer = function(id) {
    this.players[id] = true;
};

channeldata.removePlayer = function(id) {
    delete this.players[id];
};

channeldata.changeName = function(name) {
    this.name = name;
};

function ChannelHolder() {
    $.observable(this);

    this.channels = {};
    this.channelCount = 0;
    this.names = {}; // id -> name
    this.byName = {}; // name -> id

    this.newChannel(0, 'Console');
}

var channelholder = ChannelHolder.prototype;

channelholder.channel = function (id) {
    var chan;
    if (id === -1) {
        return null;
    }

    if (!(id in this.channels)) {
        this.newChannel(id, this.names[id]);
        // if (id != 0) {
        //     this.updateAutoJoin();
        // }
    }

    return this.channels[id];
};

channelholder.name = function(id) {
    return this.names[id];
};

channelholder.hasChannel = function (id) {
    return id in this.channels;
};

channelholder.updateAutoJoin = function() {
    var names = [];
    for (var id in this.channels) {
        if (id != 0) {
            names.push(this.name(id));
        }
    }

    poStorage.set("auto-join-"+ webclient.serverIp(), names);
};

channelholder.setNames = function (names) {
    var chan, i;

    this.names = names;
    for (i in this.names) {
        this.byName[this.names[i]] = i;
    }

    /* Updating already existing channels if needed */
    for (i in this.channels) {
        if ((i in names) && (chan = this.channel(i)).name !== names[i]) {
            chan.changeName(names[i]);
        }
    }

    this.trigger("nameslist", Object.keys(names));
    //webclient.ui.channellist.setChannels(Object.keys(names));
};

channelholder.changeChannelName = function (id, name) {
    if (!(id in this.names)) {
        this.newChannel(id, name);
        return;
    }

    delete this.byName[this.names[id]];
    this.names[id] = name;
    this.byName[name] = id;

    if (id in this.channels) {
        this.channels[id].changeName(name);
    }
};

channelholder.newChannel = function (id, name) {
    this.channels[id] = new ChannelData(name);
    this.names[id] = name;
    this.byName[name] = id;

    this.channelCount += 1;

    this.trigger("newchannel", id);
    //webclient.ui.channellist.addChannel(id);
};

channelholder.removeChannel = function (id) {
    if (!id in this.channels) {
        console.log("error, destroying non existing channel " + id);
        return;
    }

    delete this.channels[id];
    delete this.names[id];

    this.trigger("channeldestroyed", id);
    //webclient.ui.channellist.removeChannel(id);
};

channelholder.current = function () {
    return this.channel(this.currentId());
};

channelholder.currentId = function() {
    return 0;
    //return webclient.currentChannel();
};

channelholder.channelsByName = function (lowercase) {
    var o = [],
        name;

    for (name in this.byName) {
        o.push(lowercase ? name.toLowerCase() : name);
    }

    return o;
};

channelholder.leaveChannel = function (chanid) {
    // if (!this.hasChannel(chanid) || this.channel(chanid).closable & 1) {
    //     $('#channel-tabs').tabs("remove", "#channel-" + chanid);
    // } else {
    //     this.channel(chanid).closable |= 2;
    //     network.command('leavechannel', {channel: chanid});
    // }
};
