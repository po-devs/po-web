function BattleList() {
    this.ids = {};
}

var battlelist = BattleList.prototype;

battlelist.createBattleItem = function (id) {
    var battle = webclient.battles.battle(id);
    var name = battle.tier || "";

    var ret = "<a class='list-group-item battle-list-item' href='po:tab/battle-" + id + "' id='battle-" + id + "'>";
    ret += "<span class='glyphicon glyphicon-fire'></span>&nbsp;";
    ret += "<span class='battle-name'>" + utils.escapeHtml(name) + "</span>";
    ret += "<button type='button' class='close' aria-label='Close' onclick='event.stopPropagation(); event.preventDefault(); webclientUI.battles.quit(" + id + ");'><span aria-hidden='true'>&times;</span></button></a>";
    return ret;
};

battlelist.changeName = function(id, name) {
    if (this.hasBattle(id)) {
        $('#battle-' + id + ">.battle-name").text(utils.escapeHtml(name));
    }
};

battlelist.hasBattle = function(id) {
    return id in this.ids;
};

battlelist.addBattle = function(id) {
    var self = this;
    if (!this.hasBattle(id)) {
        this.element.append(this.createBattleItem(id));
        var battle = new BattleTab(id);
        this.ids[id] = battle;
        battle.on("changename", function(id, name) {
            self.changeName(id, name);
        });
        /* In case already received */
        if (battle.battle.tier) {
            this.changeName(id, battle.battle.tier);
        }

        webclientUI.switchToTab("battle-"+id);
    }
};

battlelist.quit = function(id) {
    if (this.hasBattle(id)) {
        this.element.find("#battle-" + id).remove();
        this.battle(id).close();
        webclient.battles.leaveBattle(id);
        delete this.ids[id];
    }
};

battlelist.battle = function(id) {
    return this.ids[id];
};

battlelist.battles = function() {
    return this.ids;
};

battlelist.startObserving = function(battles) {
    var self = this;

    battles.on("activebattle", function(id) {
        self.addBattle(id);
    });
};

$(function() {
    webclientUI.battles.startObserving(webclient.battles);
    webclientUI.battles.element = $("#battlelist");
});
