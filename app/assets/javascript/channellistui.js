function ChannelList() {
	this.ids = {};
}

var channellist = ChannelList.prototype;

channellist.createChannelItem = function (id) {
    var name = webclient.channels.name(id),
        ret;

    ret = "<li class='list-group-item channel-list-item' ";
    ret += "onclick='webclientUI.switchToTab(this.id)' "
    ret += "id='channel-"+id+"'>#" + utils.escapeHtml(name) + "</li>";
    return ret;
};


channellist.updateChannelName = function(id) {
	if (this.hasChannel(id)) {
		$('#channel-'+id).text('#' + utils.escapeHtml(webclient.channels.name(id)));
	}
};

channellist.hasChannel = function(id) {
	return id in this.ids;
};

channellist.addChannel = function(id) {
	if (!this.hasChannel(id)) {
		this.element.append(this.createChannelItem(id));
		this.ids[id] = new ChannelTab(id, webclient.channels.name(id));
	}
};

channellist.channel = function(id) {
	return this.ids[id];
};

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