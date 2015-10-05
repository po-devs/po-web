function BaseTab(/* id */) {
    $.observable(this);
}

BaseTab.prototype.isCurrent = function () {
    //return this === webclient.channel;
    return this === webclient.currentTab;
};

BaseTab.prototype.activateTab = function () {
    if (!this.isCurrent()) {
        $("#" + this.shortHand + "-" + this.id).addClass("tab-active");
    }
};

BaseTab.prototype.flashTab = function () {
    if (!this.isCurrent()) {
        $("#" + this.shortHand + "-" + this.id).addClass("tab-flash");
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

	$("#" + this.shortHand + "-" + this.id).removeClass("tab-active tab-flash");

	webclient.currentTab = this;

	webclientUI.players.setPlayers(this.getPlayers());

    this.onSetCurrent();
};

BaseTab.prototype.addTab = function(element) {
    var tab = $("<div class='tab'></div>");
    //tab.append(element);

    tab.appendTo($("#tabs"));
    element.appendTo(tab);

    this.tab = tab;

    webclientUI.tabs.push(this);

    if (this.isCurrent()) {
        $(".tab").removeClass("current");
        tab.addClass("current");
    }
};


BaseTab.prototype.removeTab = function() {
    this.tab.remove();

    webclientUI.tabs.splice(webclientUI.tabs.indexOf(this), 1);

    if (webclientUI.tabs.length > 0) {
        webclientUI.tabs[0].setCurrentTab();
    }
};


BaseTab.prototype.onSetCurrent = function() {

};