function serverConnect(params) {
    if (network.isOpen()) {
        network.close();
    }

    params = params || {};

    var relayIP = params.relay || config.relayIP;
    var port = params.port || config.hostPort;

    params.onconnect = params.onconnect || function() {
        network.command("connect", {ip: "localhost:" + port});
    };

    webclient.serverIP = relayIP;

    network.open(
        relayIP + ":" + (utils.queryField("rport") || config.relayPort),
        // open
        function() {
            params.onconnect();
        },
        // error
        function() {
            if (webclient.connectedToServer) {
                closeFunction();
                return;
            }
            vex.dialog.alert({
                message: "Could not connect to the server. It could be offline, the address could be invalid, or you might have trouble connecting. <br><br> You will be taken back to the list of servers.",
                callback: function() {
                    document.location.href = config.registry;
                }
            });
            console.log("Failed to connect to relay.");
            network.close();
        },
        // close
        function() {
            if (webclient.connectedToServer) {
                webclientUI.printDisconnectionMessage();
                webclient.connectedToServer = false;
            }
            network.close();
        }
    );
}
