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
    count: -1,
    one_count: 0,
    titleUpdate: function() {
        if (notif.count >= 0) {
            if (notif.one_count) {
                notif.faviconNoAnim.badge(""+notif.count);
            } else {
                notif.one_count = 1;
                notif.favicon.badge(""+notif.count);
            }
        } else {
            notif.one_count = 0;
            notif.faviconNoAnim.badge("");
        }
    }
}; //setInterval(function(){notif.titleUpdate()},1e3);// End notif
