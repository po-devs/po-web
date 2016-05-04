function BaseTab(/* id */) {
    $.observable(this);
}

BaseTab.prototype.isCurrent = function() {
    //return this === webclient.channel;
    return this === webclient.currentTab;
};

BaseTab.prototype.activateTab = function() {
    if (!this.isCurrent()) {
        $("#" + this.shortHand + "-" + this.id).addClass("tab-active");
    }
};

BaseTab.prototype.flashTab = function() {
    if (!this.isCurrent()) {
        $("#" + this.shortHand + "-" + this.id).addClass("tab-flash");
    }
};

BaseTab.prototype.makeName = function(name) {
    return "<span class='channel-title'>" + name + "</span><i class='fa fa-times-circle'></i>";
};

BaseTab.prototype.setCurrentTab = function() {
    if (this.tab) {
        $(".tab").removeClass("current");
        this.tab.addClass("current");
    }

    if (this.isCurrent()) {
        return;
    }

    //Make tab last so we keep the order of the tabs in memory when closing a tab
    webclientUI.tabs.splice(webclientUI.tabs.indexOf(this), 1);
    webclientUI.tabs.push(this);

    $("#" + this.shortHand + "-" + this.id).removeClass("tab-active tab-flash");
    $("#po-tabs-list a").removeClass("po-tab-current active");
    $("#" + this.shortHand + "-" + this.id).addClass("po-tab-current active").blur();

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
        $("#" + this.shortHand + "-" + this.id).addClass("po-tab-current active");
    }
};


BaseTab.prototype.removeTab = function() {
    this.tab.remove();

    webclientUI.tabs.splice(webclientUI.tabs.indexOf(this), 1);

    if (webclientUI.tabs.length > 0) {
        webclientUI.tabs[webclientUI.tabs.length - 1].setCurrentTab();
    }
};


BaseTab.prototype.onSetCurrent = function() {

};

BaseTab.prototype.sendMessage = function() {

};
