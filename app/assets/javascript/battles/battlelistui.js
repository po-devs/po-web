function BattleList() {
    this.ids = {};
}

var battlelist = BattleList.prototype;

battlelist.createBattleItem = function (id) {
    var name = "Gen " + webclient.battles.battle(id).conf.gen.num + "-" + webclient.battles.battle(id).conf.gen.subnum;
    var ret;
    name = ""; //better temporary name!

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
        this.ids[id] = new BattleTab(id);
        this.ids[id].on("changename", function(id, name) {
            self.changeName(id, name);
        });
    }
};

battlelist.quit = function(id) {
    if (this.hasBattle(id)) {
        this.element.find("#battle-" + id).remove();
        this.battle(id).close();
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