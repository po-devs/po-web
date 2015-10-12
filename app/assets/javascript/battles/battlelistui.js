function BattleList() {
    this.ids = {};
}

var battlelist = BattleList.prototype;

battlelist.createBattleItem = function (id) {
    var battle = webclient.battles.battle(id);
    var name = "Gen " + battle.conf.gen.num + "-" + battle.conf.gen.subnum;
    var ret;
    name = battle.tier || ""; //better temporary name!

    ret = "<li class='list-group-item battle-list-item' ";
    ret += "onclick='webclientUI.switchToTab(this.id)' "
    ret += "id='battle-"+id+"'><span class='glyphicon glyphicon-fire'></span>&nbsp;<span class='battle-name'>" + utils.escapeHtml(name) + '</span><button type="button" class="close" aria-label="Close" onclick="webclientUI.battles.quit(' + id + '); event.stopPropagation();"><span aria-hidden="true">&times;</span></button></li>';
    return ret;
};

battlelist.changeName = function(id, name) {
    if (this.hasBattle(id)) {
        $('#battle-'+id+">.battle-name").text(utils.escapeHtml(name));
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
            //console.log("battle list changing name");
            self.changeName(id, name);
        });
        /* In case already received */
        if (battle.battle.tier) {
            this.changeName(id, battle.battle.tier);
        }
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