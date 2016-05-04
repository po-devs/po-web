function ReplayBattles () {
    var self = this;
    this.commandStack = [];
    this.time = 0;
    this.speed = 1.0;
    this.mode = "turns";
    this.paused = false;
    this.forceNext = false;
    self.turn = 1;

    this.setSpeed = function(speed) {
        this.speed = speed;
        this._battle.speed = speed;
        this._battle.trigger("duration-multiplier", this.speed);
    };

    this.watchBattle = function(id, params) {
        this.time = 0;
        this.refTime = +(new Date());

        this._battle = new BattleData({"conf": params});
        this._battle.start({"conf": params});
        this.battleTab = new BattleTab(0);
        this.battleTab.setCurrentTab();

        var battleView = this.battleTab.layout.find(".battle-view");

        var tabs = "<div class='btn-group' data-toggle='buttons'>" +
                "<span class='btn btn-default active replay-turned' data-toggle='tab'>" +
                    "<input type='radio'>Turn-based</span>" +
                "<span class='btn btn-default replay-timed' data-toggle='tab'>" +
                    "<input type='radio'>Time-based</span>" +
            "</div>";
        battleView.append(tabs);

        var media = "<div class='btn-toolbar btn-group replay-btns' role='toolbar' data-toggle='buttons'>" +
                "<button class='btn btn-default replay-pause' type='button' aria-label='Pause'>" +
                    "<span class='glyphicon glyphicon-pause'></span></button>" +
                "<button class='btn btn-default replay-next' type='button' aria-label='Next action'>" +
                    "<span class='glyphicon glyphicon-forward'></span></button>" +
                "<button class='btn btn-default replay-skip' type='button' aria-label='Next turn'>" +
                    "<span class='glyphicon glyphicon-step-forward'></span></button>" +
            "</div>";
        battleView.append(media);

        var speed = "<div class='btn-group' data-toggle='buttons'>" +
                "<span class='btn btn-default active normal-speed' data-toggle='tab'>" +
                    "<input type='radio'>Normal</span>" +
                "<span class='btn btn-default fast-speed' data-toggle='tab'>" +
                    "<input type='radio'>Fast</span>" +
            "</div>";
        battleView.append(speed);

        battleView.find(".replay-turned").on("click", function() {
            self.mode = "turns";
        });
        battleView.find(".replay-timed").on("click", function() {
            self.mode = "timed";
        });
        battleView.find(".replay-pause").on("click", function() {
            if (!self.paused) {
                $(this).attr("aria-label", "Play");
                $(this).html('<span class="glyphicon glyphicon-play">');
            } else {
                $(this).attr("aria-label", "Pause");
                $(this).html('<span class="glyphicon glyphicon-pause">');
            }
            self.paused = !self.paused;
            $(this).blur();
        });
        battleView.find(".replay-next").on("click", function() {
            self.forceNext = {"turn": self.turn + 1};
            $(this).blur();
        });
        battleView.find(".replay-skip").on("click", function() {
            if (self.forceNext) {
                return;
            }
            self.forceNext = {
                "turn": self.turn + 1,
                "oldSpeed": self.speed
            };
            self.setSpeed(1000);
            $(this).blur();
        });
        battleView.find(".normal-speed").on("click", function() {
            self.setSpeed(1.0);
        });
        battleView.find(".fast-speed").on("click", function() {
            self.setSpeed(2.0);
        });
    };

    this.battle = function(id) {
        return this._battle;
    };

    this.serverStopWatching = function(id) {

    };

    this.dealWithCommand = function(time, params) {
        this.commandStack.push({"time": time, "command": params});
    };

    this.unloadCommand = function() {
        if (this.forceNext && this.commandStack.length > 0) {
            var comm = this.commandStack[0].command;

            if (comm.command === "turn" && comm.turn >= this.forceNext.turn) {
                if (!this.battle().paused && this.battle().emptyQueue()) {
                    if (this.forceNext.oldSpeed) {
                        this.setSpeed(this.forceNext.oldSpeed);
                    }
                    this.forceNext = false;
                    this.turn = comm.turn;
                } else {
                    return;
                }
            }
        }

        if (this.paused && !this.forceNext) {
            return;
        }

        var now = +(new Date());
        var diff = now - this.refTime;
        this.time += diff;
        this.refTime = now;

        if (this.commandStack.length > 0) {
            if (this.forceNext || (this.mode === "turns" && !this._battle.paused) ||
                (this.mode === "timed" && this.commandStack[0].time < this.time)) {
                var obj = this.commandStack.splice(0, 1)[0];
                this.time = obj.time;
                var command = obj.command;
                if (command.command === "turn") {
                    this.turn = command.turn;
                }
                this._battle.dealWithCommand(command);
            }
        }
    };
}

var webclientUI = {
    tabs: [],
    players: {
        setPlayers: function() {},
        addPlayer: function() {},
        removePlayer: function() {}
    }
};

var webclient = {
    players: {
        on: function() {},
        hasPlayer: function() {return true;},
        color: function() {return "black";}
    },
    battles: new ReplayBattles(),
    channels: {
        channelsByName: function() {return [];}
    },
    print: console.log.bind(console),
};


vex.defaultOptions.className = "vex-theme-os";

$(function() {
    var relayGiven = utils.queryField("relay");
    var portGiven = utils.queryField("port");

    serverConnect({
        "onconnect": function() {
            network.command("replay", {battle: battleToReplay});
            setInterval(function(){
                webclient.battles.unloadCommand();
            }, 20);
        },
        "relay": relayGiven,
        "port": portGiven
    });
});
