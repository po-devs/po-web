import webclient from "../webclient";
import webclientUI from "../frontend";
import {escapeHtml} from "../utils";
import BattleTab from "./battletab";
import $ from "jquery";

export default function BattleList() {
    this.ids = {};
}

var battlelist = BattleList.prototype;

battlelist.createBattleItem = function (id) {
    var battle = webclient.battles.battle(id);
    var name = battle.tier || "";

    var ret = "<a class='list-group-item battle-list-item' href='po:tab/battle-" + id + "' id='battle-" + id + "'>";
    ret += "<span class='glyphicon glyphicon-fire'></span>&nbsp;";
    ret += "<span class='battle-name'>" + escapeHtml(name) + "</span>";
    ret += "<button type='button' class='close' aria-label='Close' onclick='event.stopPropagation(); event.preventDefault(); webclientUI.battles.quit(" + id + ");'><span aria-hidden='true'>&times;</span></button></a>";
    return ret;
};

battlelist.changeName = function(id, name) {
    if (this.hasBattle(id)) {
        $('#battle-' + id + ">.battle-name").text(escapeHtml(name));
    }
};

battlelist.hasBattle = function(id) {
    return id in this.ids;
};

battlelist.setSound = function(val) {
    this.sound = val;
    for (var id in this.ids) {
        this.ids[id].battle.changeSound(val);
    }
}

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

        if (window.isActive) {
            webclientUI.switchToTab("battle-"+id);
        } else {
            /* DO not open it at first in order to increase badge count */
            battle.flashTab();
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

export function afterLoad() {
    webclientUI.battles.startObserving(webclient.battles);
    webclientUI.battles.element = $("#battlelist");
};
