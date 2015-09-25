function BaseTab(/* id */) {
    $.observable(this);
}

BaseTab.prototype.isCurrent = function () {
    //return this === webclient.channel;
    return this === webclient.currentTab;
};

BaseTab.prototype.activateTab = function () {
    if (!this.isCurrent()) {
        $("#channel-tabs > ul li a[href='#" + this.shortHand + "-" + this.id + "']").addClass("tab-active");
    }
};

BaseTab.makeName = function(name) {
    return "<span class='channel-title'>"+name+"</span>" + '<i class="fa fa-times-circle"></i>'
};

BaseTab.prototype.setCurrentTab = function() {
	if (this.tab) {
        $(".tab").removeClass("current");
        this.tab.addClass("current");
    }

    if (this.isCurrent()) {
		return;
	}

	webclient.currentTab = this;

	webclientUI.players.setPlayers(this.getPlayers());
};

BaseTab.prototype.addTab = function(element) {
    var tab = $("<div class='tab'></div>");
    //tab.append(element);

    tab.appendTo($("#tabs"));
    element.appendTo(tab);

    this.tab = tab;

    if (this.isCurrent()) {
        $(".tab").removeClass("current");
        tab.addClass("current");
    }
};