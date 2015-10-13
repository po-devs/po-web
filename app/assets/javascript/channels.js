function ChannelData(id, name) {
    $.observable(this);

    this.players = {};
    this.name = name || "";
    this.id = id;
};

var channeldata = ChannelData.prototype;

channeldata.setPlayers = function(ids) {
    
    this.loadingPlayers = true;
    for (x in ids) {
        this.newPlayer(ids[x]);
    }
    this.loadingPlayers = false;

    this.trigger("setplayers", ids)
};

channeldata.newPlayer = function(id) {
    if (id in this.players) {
        return;
    }

    this.players[id] = true;
    this.trigger("playeradd", id);
};

channeldata.removePlayer = function(id) {
    if (! (id in this.players)) {
        return;
    }

    delete this.players[id];
    this.trigger("playerremove", id);

    if (id == webclient.ownId) {
        webclient.channels.leaveChannel(this.id);
    }
};

channeldata.changeName = function(name) {
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

var channelholder = ChannelHolder.prototype;

channelholder.channel = function (id) {
    var chan;
    if (id === -1 || !(id in this.channels)) {
        return null;
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
    for (var i in this.joinedChannels) {
        var id = this.joinedChannels[i];

        if (id != 0) {
            names.push(this.name(id));
        }
    }

    poStorage.set("auto-join-"+ webclient.serverIP, names);
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

    for (i in this.names) {
        if (!(i in this.channels)) {
            this.newChannel(i, this.names[i]);
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

    this.trigger("changename", id);
};

channelholder.newChannel = function (id, name) {
    this.channels[id] = new ChannelData(id, name);
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

channelholder.joinChannel = function(id) {
    if (this.joinedChannels.indexOf(id) == -1) {
        //code to update
        this.joinedChannels.push(id);

        if (id != 0) {
             this.updateAutoJoin();
        }

        this.trigger("joinchannel", id);
    } else {
        console.log("Channel already joined: " + id);
    }
}

channelholder.channelsByName = function (lowercase) {
    var o = [],
        name;

    for (name in this.byName) {
        o.push(lowercase ? name.toLowerCase() : name);
    }

    return o;
};

channelholder.leaveChannel = function (id) {
    id = +id;
    var index = this.joinedChannels.indexOf(id);
    if (index !== -1) {
        //code to update
        this.joinedChannels.splice(index, 1);
        this.updateAutoJoin();

        this.trigger("leavechannel", id);
        console.log("left channel " + id);
    } else {
        console.log("Channel not joined: " + id);
    }
};
