function ChannelList() {
	this.ids = [];
}

var channellist = ChannelList.prototype;

channellist.createChannelItem = function (id) {
    var name = webclient.channels.name(id),
        ret;

    ret = "<li class='list-group-item channel-list-item";

    ret += "' id='channel-"+id+"'>#" + utils.escapeHtml(name) + "</li>";
    return ret;
};


channellist.updateChannelName = function(id) {
	if (this.hasChannel(id)) {
		$('#channel-'+id).text('#' + utils.escapeHtml(webclient.channels.name(id)));
	}
};

channellist.hasChannel = function(id) {
	return this.ids.indexOf(+id) != -1;
};

channellist.addChannel = function(id) {
	id = +id;

	if (!this.hasChannel(id)) {
		this.ids.push(id);
		this.element.append(this.createChannelItem(id));
	}
}

channellist.startObserving = function(channels) {
	var self = this;

	channels.on("joinchannel", function(id) {
		self.addChannel(id);
	});

	channels.on("changename", function(id) {
		self.updateChannelName(id);
	});

	channels.on("nameslist", function(ids) {
		for (var i in ids) {
			self.updateChannelName(ids[i]);
		}
	});
};

$(function() {
	webclientUI.channels.startObserving(webclient.channels);
    webclientUI.channels.element = $("#channellist");
});