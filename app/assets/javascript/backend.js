var webclient = {
	onConnected: function() {
        webclientUI.printHtml("<timestamp/> Connected to server!");
        network.command('login', {version:1, idle: true});

        // var username = $("#username").val();
        // if (username && username.length > 0) {
        //     poStorage.set("player.name", username);
        // }

        // var data = {version: 1};
        // data.default = utils.queryField("channel");
        // data.autojoin = poStorage("auto-join-"+webclient.serverIp(), "array");

        // data.ladder = poStorage.get('player.ladder', 'boolean');
        // if (data.ladder == null) {
        //     data.ladder = true;
        // }

        // data.idle = poStorage.get('player.idle', 'boolean');
        // if (data.idle == null) {
        //     data.idle = false;
        // }

        // data.color = poStorage.get('player.color');

        // if (utils.queryField("user") || username) {
        //     data.name = utils.queryField("user") || username;
        //     this.command('login', data);
        // } else {
        //     vex.dialog.open({
        //         message: 'Enter your username:',
        //         input: '<input name="username" type="text" placeholder="Username"/>',
        //         buttons: [
        //             $.extend({}, vex.dialog.buttons.YES, {text: 'Login'}),
        //             $.extend({}, vex.dialog.buttons.NO, {text: 'Login as Guest'})
        //         ],
        //         callback: function (res) {
        //             if (res && res.username) {
        //                 data.name = res.username;
        //             }

        //             net.command('login', data);
        //         }
        //     });
        // }

        // webclient.connectedToServer = true;
	},

	onPlayers: function(params) {
		// webclient.players.addPlayer(params);

  //       if (webclient.shownPlayer !== -1 && webclient.shownPlayer in params && "info" in params[webclient.shownPlayer]) {
  //           webclient.updatePlayerInfo(params[webclient.shownPlayer]);
  //       }
  //       for (var player in params) {
  //           if ("info" in params[player]) {
  //               if (webclient.shownPlayer == player) {
  //                   webclient.updatePlayerInfo(params[player]);
  //               } else if (player in webclient.dialogs) {
  //                   webclient.updatePlayerInfo(params[player], webclient.dialogs[player]);
  //                   delete webclient.dialogs[player];
  //               }
  //           }
  //       }
	},

	onChat: function(params) {
		webclientUI.printMessage(params.message, params.html);
		// var chan = webclient.channels.channel(params.channel);

  //       if ((params.channel == -1 && params.message.charAt(0) != "~") || !chan) {
  //           webclient.print(params.message, params.html);
  //       } else {
  //           chan.print(params.message, params.html);
  //       }
	},

	print: function(msg) {
		console.log(msg);
	}
};

$(function() {
	serverConnect();
});