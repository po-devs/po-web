function serverConnect(params) {
    if (network.isOpen()) {
        network.close();
    }

    var relayIP = poStorage.get("relay") || config.relayIP;
    var port = poStorage.get("port") || config.hostPort;

    params = params || {};
    params.onconnect = params.onconnect || function() {network.command("connect", {ip: "localhost:" + port});}

    webclient.serverIP = relayIP;

    //var fullIP = $("#relay").val();

    //console.log("Connecting to relay @ " + fullIP);
    //poStorage.set("relay", fullIP);

    var closeFunction = function () {
        if (webclient.connectedToServer) {
            webclientUI.printDisconnectionMessage();
            webclient.connectedToServer = false;
        }
        console.log("Disconnected from relay.");
        network.close();
    };

    network.open(
        relayIP + ":" + (utils.queryField("rport") || config.relayPort),
        // open
        function () {
            console.log("Connected to relay.");
            params.onconnect();
        },
        // error
        function () {
            if (webclient.connectedToServer) {
                closeFunction();
                return;
            }
            vex.dialog.alert({
                message: "Could not connect to the server. It could be offline, the address could be invalid, or you might have trouble connecting. <br><br> You will be taken back to the list of servers.",
                callback: function() {document.location.href=config.registry;}
            });
            console.log("Failed to connect to relay.");

            network.close();
        },
        // close
        closeFunction
    );
};