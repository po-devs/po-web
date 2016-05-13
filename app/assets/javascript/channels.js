function ChannelData(id, name) {
    $.observable(this);

    this.players = {};
    this.name = name || "";
    this.id = id;
}

ChannelData.prototype.setPlayers = function(ids) {
    this.loadingPlayers = true;

    for (var x in ids) {
        this.newPlayer(ids[x]);
    }

    this.loadingPlayers = false;
    this.trigger("setplayers", ids);
};

ChannelData.prototype.newPlayer = function(id) {
    if (id in this.players) {
        return;
    }

    this.players[id] = true;
    this.trigger("playeradd", id);
};

ChannelData.prototype.removePlayer = function(id) {
    if (! (id in this.players)) {
        return;
    }

    delete this.players[id];
    this.trigger("playerremove", id);

    if (id === webclient.ownId) {
        webclient.channels.leaveChannel(this.id);
    }
};

ChannelData.prototype.changeName = function(name) {
    this.name = name;
    this.trigger("changename", name);
};

function ChannelHolder() {
    $.observable(this);

    this.joinedChannels = [];
    this.channels = {};
    this.channelCount = 0;
    this.names = {}; // id -> name
    this.byName = {}; // name -> id

    this.newChannel(0, 'Main Channel');
}

ChannelHolder.prototype.channel = function (id) {
    if (id === -1 || !(id in this.channels)) {
        return null;
    }
    return this.channels[id];
};

ChannelHolder.prototype.name = function(id) {
    return this.names[id];
};

ChannelHolder.prototype.hasChannel = function (id) {
    return id in this.channels;
};

ChannelHolder.prototype.updateAutoJoin = function() {
    var names = [];
    for (var i in this.joinedChannels) {
        var id = this.joinedChannels[i];
        if (id !== 0) {
            names.push(this.name(id));
        }
    }

    poStorage.set("auto-join-"+ webclient.serverIP, names);
};

ChannelHolder.prototype.setNames = function (names) {
    var i;

    this.names = names;
    this.byName = {};
    for (i in this.names) {
        this.byName[this.names[i]] = i;
    }

    // Updating already existing channels if needed
    for (i in this.channels) {
        if ((i in names) && this.channel(i).name !== names[i]) {
            this.channel(i).changeName(names[i]);
        }
    }

    for (i in this.names) {
        if (!(i in this.channels)) {
            this.newChannel(i, this.names[i]);
        }
    }

    this.trigger("nameslist", Object.keys(names));
    //webclient.ui.channellist.setChannels(Object.keys(names));
};

ChannelHolder.prototype.changeChannelName = function (id, name) {
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

    this.trigger("changename", id);
};

ChannelHolder.prototype.newChannel = function (id, name) {
    this.channels[id] = new ChannelData(id, name);
    this.names[id] = name;
    this.byName[name] = id;

    this.channelCount += 1;

    this.trigger("newchannel", id);
    //webclient.ui.channellist.addChannel(id);
};

ChannelHolder.prototype.removeChannel = function(id) {
    if (!(id in this.channels)) {
        console.log("Cannot destroy nonexistent channel: " + id);
        return;
    }

    delete this.channels[id];
    delete this.byName[this.names[id]];
    delete this.names[id];

    this.trigger("channeldestroyed", id);
    //webclient.ui.channellist.removeChannel(id);
};

ChannelHolder.prototype.joinChannel = function(id) {
    if (this.joinedChannels.indexOf(id) < 0) {
        this.joinedChannels.push(id);
        if (id !== 0) {
             this.updateAutoJoin();
        }
        this.trigger("joinchannel", id);
    } else {
        console.log("Channel already joined: " + id);
    }
};

ChannelHolder.prototype.channelsByName = function(lowercase) {
    var o = [];
    for (var name in this.byName) {
        o.push(lowercase ? name.toLowerCase() : name);
    }
    return o;
};

ChannelHolder.prototype.leaveChannel = function(id) {
    id = +id;
    var index = this.joinedChannels.indexOf(id);
    if (index > -1) {
        this.joinedChannels.splice(index, 1);
        this.updateAutoJoin();
        this.trigger("leavechannel", id);
    } else {
        console.log("Channel not joined: " + id);
    }
};
