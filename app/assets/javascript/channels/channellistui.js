import $ from "jquery";

import webclient from "../webclient";
import ChannelTab from "./channeltab";
import webclientUI from "../frontend";
import poStorage from "../postorage";
import {escapeHtml} from "../utils";
import  "bootstrap-3-typeahead";

export default function ChannelList() {
    this.ids = {};
    this.chanevents = {};
    this.channotifs = {};
}

ChannelList.prototype.createChannelItem = function (id) {
    var name = webclient.channels.name(id);
    return "<a class='list-group-item channel-list-item' href='po:tab/channel-" + id + "' " +
        "id='channel-" + id + "'><span class='channel-name'>#" + escapeHtml(name) +
        "</span><button type='button' class='close' aria-label='Close' " +
        "onclick='event.stopPropagation(); event.preventDefault(); webclient.leaveChannel(" + id + ");'>" +
        "<span aria-hidden='true'>&times;</span></button></a>";
};

ChannelList.prototype.countActive = function() {
    var cnt = 0;
    for (var id in this.ids) {
        if (webclient.channels.name(id).toLowerCase() in this.channotifs) {
            if ($("#channel-" + id).hasClass("tab-active")) {
                cnt ++;
            }
        }
    }

    return cnt;
};

ChannelList.prototype.updateChannelName = function(id) {
    if (this.hasChannel(id)) {
        $('#channel-' + id + ">.channel-name").text('#' + escapeHtml(webclient.channels.name(id)));
    }
};

ChannelList.prototype.hasChannel = function(id) {
    return id in this.ids;
};

ChannelList.prototype.addChannel = function(id) {
    console.log("Adding channel", id, "...");
    if (!this.hasChannel(id)) {
        this.element.append(this.createChannelItem(id));
        this.ids[id] = new ChannelTab(id, webclient.channels.name(id));
    }
};

ChannelList.prototype.removeChannel = function(id) {
    if (this.hasChannel(id)) {
        this.element.find("#channel-" + id).remove();
        this.channel(id).close();
        delete this.ids[id];
    }
};

ChannelList.prototype.channel = function(id) {
    return this.ids[id];
};

ChannelList.prototype.channels = function() {
    return this.ids;
};

ChannelList.prototype.toggleChanEvents = function (id) {
    var chan = webclient.channels.name(id).toLowerCase();
    if (chan in this.chanevents) {
        delete this.chanevents[chan];
    } else {
        this.chanevents[chan] = true;
    }

    poStorage.set("chanevents-" + webclient.serverIP, this.chanevents);
};

ChannelList.prototype.toggleChanNotifs = function (id) {
    var chan = webclient.channels.name(id).toLowerCase();
    if (chan in this.channotifs) {
        delete this.channotifs[chan];
    } else {
        this.channotifs[chan] = true;
    }

    poStorage.set("channotifs-" + webclient.serverIP, this.channotifs);
};

ChannelList.prototype.chanEventsEnabled = function (id) {
    return webclient.channels.name(id).toLowerCase() in this.chanevents;
};

ChannelList.prototype.chanNotifsEnabled = function (id) {
    return webclient.channels.name(id).toLowerCase() in this.channotifs;
};

ChannelList.prototype.startObserving = function(channels) {
    console.log("observing channel events...");

    channels.on("joinchannel", id => {
        this.addChannel(id);
    });

    channels.on("leavechannel", id => {
        this.removeChannel(id);
    });

    channels.on("changename", id => {
        this.updateChannelName(id);
    });

    channels.on("nameslist", ids => {
        for (var i in ids) {
            this.updateChannelName(ids[i]);
        }
    });
};

ChannelList.prototype.findMatches = function(query, callback) {
    //console.log(arguments);
    if (!query.startsWith("#")) {
        callback([]);
        return;
    }

    query = query.substr(1).toLowerCase();
    var matches = [];

    var names = Object.keys(webclient.channels.byName);
    names.sort();

    names.forEach(function(elem) {
        if (elem.toLowerCase().startsWith(query)) {
            matches.push({
                "value": "#" + elem,
                "id": elem
            });
        }
    });

    callback(matches);
};

export function afterLoad() {
    webclientUI.channels.startObserving(webclient.channels);
    webclientUI.channels.element = $("#channellist");

    $("#player-filter").typeahead({
         hint: true,
         highlight: false,
         minLength: 1
    },
    {
        name: "channels",
        display: "value",
        limit: 200,
        source: webclientUI.channels.findMatches.bind(webclientUI.channels)
    }).on("typeahead:select", function(event, sugg) {
        webclient.joinChannel(sugg.id);
    });

    webclientUI.channels.element.contextmenu({
        target: "#channel-context-menu",
        before: function(event/* , context */) {
            /* the name of the channel was right clicked instead of the li */
            var channel;
            if (event.target.tagName.toLowerCase() == "span") {
                channel = $(event.target.parentElement);
            } else {
                channel = $(event.target);
            }

            var id = channel.attr("id");
            id = id.substr(id.indexOf("-") + 1);
            var menu = this.getMenu();

            /* Add this once, handler of links on context menu */
            if (!menu.attr("weaned")) {
                menu.attr("weaned", true);
                menu.on("click", "a", webclientUI.linkClickHandler);
            }

            menu.find("a").each(function() {
                this.href = this.href.substr(0, this.href.lastIndexOf("/") + 1) + id;
            });

            menu.find("#channels-chanevents-menu").find("a").text(webclientUI.channels.chanEventsEnabled(id) ? "Disable channel events" : "Enable channel events");
            menu.find("#channels-channotifs-menu").find("a").text(webclientUI.channels.chanNotifsEnabled(id) ? "Disable notifications" : "Enable notifications");
        },
        onItem: function(context, event) {
            event.preventDefault();
            //var item = $(event.target);
        }
    });
}
