function serverConnect() {
    if (network.isOpen()) {
        network.close();
    }

    //var fullIP = $("#relay").val();

    //console.log("Connecting to relay @ " + fullIP);
    //poStorage.set("relay", fullIP);

    network.open(
        config.relayIP + ":" + config.relayPort,
        // open
        function () {
            console.log("Connected to relay.");
            network.command("connect", {ip: "localhost:" + config.hostPort});
        },
        // error
        function () {
            //vex.dialog.alert("Could not connect to relay station. It could be offline, the address could be invalid, or you might have trouble connecting. <br><br> <b>Try again later.</b>");
            console.log("Failed to connect to relay.");

            network.close();
        },
        // close
        function () {
            console.log("Disconnected from relay.");
            network.close();
        }
    );
};