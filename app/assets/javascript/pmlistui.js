function PMList() {
    this.ids = {};
}

var pmlist = PMList.prototype;

pmlist.createPMItem = function (id) {
    var name = webclient.pms.pm(id).name(),
        ret;

    ret = "<a class='list-group-item pm-list-item' ";
    ret += "href='po:tab/pm-" + id + "' "
    ret += "id='pm-"+id+"'><span class='glyphicon glyphicon-envelope'></span>&nbsp;" + utils.escapeHtml(name) + '<button type="button" class="close" aria-label="Close" onclick="event.stopPropagation(); event.preventDefault(); webclientUI.pms.removePM(' + id + ');"><span aria-hidden="true">&times;</span></button></a>';
    return ret;
};


pmlist.updatePMName = function(id) {
    if (this.hasPM(id)) {
        $('#pm-'+id).text('#' + utils.escapeHtml(webclient.pms.pm(id).name()));
    }
};

pmlist.hasPM = function(id) {
    return id in this.ids;
};

pmlist.addPM = function(id) {
    if (!this.hasPM(id)) {
        this.element.append(this.createPMItem(id));
        this.ids[id] = webclient.pms.pm(id);
    }
};

pmlist.removePM = function(id) {
    if (this.hasPM(id)) {
        this.element.find("#pm-" + id).remove();
        this.pm(id).close();
        delete this.ids[id];
    }
};

pmlist.pm = function(id) {
    return this.ids[id];
};

pmlist.pms = function() {
    return this.ids;
};

pmlist.startObserving = function(pms) {
    var self = this;

    pms.on("newpm", function(id) {
        self.addPM(id);
    });

    pms.on("changename", function(id) {
        self.updateChannelName(id);
    });
};

$(function() {
    webclientUI.pms.startObserving(webclient.pms);
    webclientUI.pms.element = $("#pmlist");
});
