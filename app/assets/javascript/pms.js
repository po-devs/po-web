function PMHolder() {
    var self = this;
    $.observable(self);

    self.pms = {};
}

PMHolder.prototype.pm = function (pid) {
    if (pid == webclient.ownId) {
        return;
    }

    var pm;
    pid = +pid;
    if (pid in this.pms) {
        return this.pms[pid];
    }

    if (webclient.players.isIgnored(pid)) {
        return;
    }

    webclient.players.addFriend(pid);

    pm = this.pms[pid] = new PMTab(pid);
    this.observe(pm);

    this.trigger("newpm", pid);

    webclientUI.switchToTab("pm-"+pid);

    return pm;
};

PMHolder.prototype.observe = function (pm) {
    var self = this;

    pm.on("close", function () {
        delete self.pms[pm.id];
    });
};

$(function() {
    var self = webclient.pms;

    webclient.players.on("login", function (id) {
        if (id in self.pms) {
            self.pm(id).reconnect();
        }
    }).on("playerremove", function (id) {
        if (id in self.pms) {
            self.pm(id).disconnect();
        }
    });
});
