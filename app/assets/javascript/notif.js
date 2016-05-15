/*
	Notif
*/
var notif = {
    favicon: new Favico({
        animation: "pop",
        type: "circle"
    }),
    faviconNoAnim: new Favico({
        animation: "none",
        type: "circle"
    }),
    count: 0,
    one_count: 0,
    update: function() {
        notif.count++
    },
    titleUpdate: function() {
        1 == notif.count ? 1 == notif.one_count ? notif.faviconNoAnim.badge(notif.count) : (notif.one_count = 1, notif.favicon.badge(notif.count)) : 0 == notif.count ? notif.faviconNoAnim.badge("") : notif.faviconNoAnim.badge(notif.count)
    },
    clear: function() {
        notif.count = 0, notif.one_count = 0
    },
    dec: function() {
        notif.count--, 0 == notif.count && (notif.one_count = 0)
    },
    removeBy: function(n) {
        this.num = n, notif.count = notif.count - n, notif.count <= 0 && (notif.one_count = 0)
    },
    forEach: function(n) {
        for (var o = 0; o < n.length; o++) notif.update()
    }
}; //setInterval(function(){notif.titleUpdate()},1e3);// End notif
