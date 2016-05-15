/*
	Notif
*/
var notif = {
    faviconNoAnim: new Favico({
        animation: "none",
        type: "circle"
    }),
    count: -1,
    titleUpdate: function() {
        if (notif.count >= 0) {
            notif.faviconNoAnim.badge(""+notif.count);
        } else {
            notif.faviconNoAnim.badge("");
        }
    }
}; //setInterval(function(){notif.titleUpdate()},1e3);// End notif
