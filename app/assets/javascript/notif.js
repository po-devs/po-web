/*
	Notif
*/
var notif = {
    count: -1,
    titleUpdate: function() {
        if (notif.count >= 0) {
            var x = notif.count > 9 ? 9 : notif.count;
            $("#favicon").attr("href", "public/assets/images/favicons/favicon-"+x+".png");
        } else {
            $("#favicon").attr("href", "public/assets/images/favicons/favicon.png");
        }
    }
};
