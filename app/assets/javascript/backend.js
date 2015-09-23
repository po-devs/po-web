var webclient = {
	onConnected: function() {
        webclientUI.printHtml("<timestamp/> Connected to server!");
        network.command('login', {version:1, name: config.name, idle: true});

    	return;
        var username = $("#username").val();
        if (username && username.length > 0) {
            poStorage.set("player.name", username);
        }

        var data = {version: 1};
        data.default = utils.queryField("channel");
        data.autojoin = poStorage("auto-join-"+webclient.serverIp(), "array");

        data.ladder = poStorage.get('player.ladder', 'boolean');
        if (data.ladder == null) {
            data.ladder = true;
        }

        data.idle = poStorage.get('player.idle', 'boolean');
        if (data.idle == null) {
            data.idle = false;
        }

        data.color = poStorage.get('player.color');

        if (utils.queryField("user") || username) {
            data.name = utils.queryField("user") || username;
            this.command('login', data);
        } else {
            vex.dialog.open({
                message: 'Enter your username:',
                input: '<input name="username" type="text" placeholder="Username"/>',
                buttons: [
                    $.extend({}, vex.dialog.buttons.YES, {text: 'Login'}),
                    $.extend({}, vex.dialog.buttons.NO, {text: 'Login as Guest'})
                ],
                callback: function (res) {
                    if (res && res.username) {
                        data.name = res.username;
                    }

                    net.command('login', data);
                }
            });
        }

        webclient.connectedToServer = true;
	},

	print: function(msg) {
		console.log(msg);
	}
};

$(function() {
	serverConnect();
});