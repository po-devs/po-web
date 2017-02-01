import PlayerHolder from "./players";
import ChannelHolder from "./channels/channels";
import PMHolder from "./pms/pms";
import Battles from "./battles/battles";
import Poke from "./poke";
import network from "./network";
import webclientUI from "./frontend";
import poStorage from "./postorage";
import serverConnect from "./serverconnect";
import $ from "jquery";

const webclient = (function() {
  this.players = new PlayerHolder();
  this.channels = new ChannelHolder();
  this.pms = new PMHolder();
  this.battles = new Battles();
  this.ownTiers = [];
  this.team = {
    "tier": "",
    "pokes": [new Poke(), new Poke(), new Poke(), new Poke(), new Poke(), new Poke()]
  };

  this.ownName = () => {
    return this.players.name(this.ownId);
  };

  this.ownAuth = () => {
    return this.players.auth(this.ownId);
  };

  this.ownPlayer = () => {
    return this.players.player(this.ownId);
  };

  this.requestInfo = function(id) {
    network.command("player", {
      "id": id
    });
  };

  this.onConnected = () => {
    webclientUI.printHtml("<timestamp/> Connected to server!");

    var loginInfo = {
      version: 1
    };

    loginInfo.name = poStorage.get("user");

    // var data = {version: 1};
    // data.default = utils.queryField("channel");
    loginInfo.autojoin = poStorage("auto-join-" + this.serverIP, "array");

    loginInfo.ladder = poStorage.get("player.ladder", "boolean");
    if (loginInfo.ladder === null) {
      loginInfo.ladder = true;
    }

    loginInfo.idle = poStorage.get("player.idle", "boolean");
    if (loginInfo.idle === null) {
      loginInfo.idle = false;
    }

    loginInfo.color = poStorage.get("player.color") || "";
    loginInfo.info = {
      "avatar": poStorage.get("player.avatar") || 167,
      "info": poStorage.get("player.info")
    };

    if (this.team) {
      this.cacheTeam();
      loginInfo.teams = [this.getTeamData(this.team)];
    }

    if (loginInfo.name) {
      network.command("login", loginInfo);
    } else {
      webclientUI.promptUsernameDialog(function(res) {
        if (res && res.username) {
          loginInfo.name = res.username;
          poStorage.set("user", res.username);
        } else {
          loginInfo.name = "guest" + Math.floor(10000 + Math.random() * 90000);
        }
        network.command("login", loginInfo);
      });
    }
  };

  this.challenge = function(id, params) {
      //network.send("challengeplayer", {"id": id, "team": 0, "clauses": clauses, "tier": tier });
      network.send("challengeplayer", $.extend({
        "id": id
      }, params));
    },

    this.cancelFindBattle = () => {
      this.searchingForBattle = false;
      network.send("challengeplayer", {
        "id": 0,
        "desc": "cancelled"
      });
    },

    this.dealWithChallenge = params => {
      if (params.desc === "sent") {
        if (this.players.isIgnored(params.id) || params.mode !== 0) {
          this.declineChallenge(params);
        } else if (webclientUI.teambuilderOpen) {
          this.declineChallenge(params, "busy");
        } else {
          webclientUI.showChallenge(params);
        }
      } else if (params.desc === "cancelled") {
        webclientUI.cancelChallenge(params);
      } else {
        var messages = {
          "busy": "#player is busy.",
          "refused": "#player refused your challenge.",
          "invalidtier": "You can't challenge #player in " + params.tier + ".",
          "invalidgen": "You can't challenge #player, generation is invalid.",
          "invalidteam": "You can't challenge #player by selecting this team."
        };

        if (params.desc in messages) {
          webclientUI.printHtml(
            $("<div>")
            .append($("<span>")
              .addClass("challenge-" + params.desc)
              .text(messages[params.desc].replace("#player", this.players.name(params.id))))
            .html());
        } else {
          console.log("Unknown challenge type received.");
          console.log(payload);
        }
      }
    },

    this.declineChallenge = function(params, reason) {
      network.send("challengeplayer", $.extend({}, params, {
        "desc": reason || "refused"
      }));
    },

    this.acceptChallenge = function(params) {
      network.send("challengeplayer", $.extend({}, params, {
        "desc": "accepted"
      }));
    },

    this.onChat = function(params) {
      var chan = webclientUI.channels.channel(params.channel);

      if ((params.channel === -1 && params.message.charAt(0) !== "~")) {
        webclientUI.printMessage(params.message, params.html);
      } else if (chan) {
        chan.printMessage(params.message, params.html);
      }
    },

    this.print = function(msg) {
      console.log(msg);
    },

    this.sendMessage = function(message, id) {
      network.command("chat", {
        channel: id,
        message: message
      });
    },

    this.getTeamData = function(orTeam) {
      orTeam = orTeam || this.team;
      var team = {};
      team.tier = orTeam.tier;
      team.gen = orTeam.gen;
      team.pokes = [{}, {}, {}, {}, {}, {}];
      team.illegal = orTeam.illegal || false;
      team.name = orTeam.name || "";
      for (var i in orTeam.pokes) {
        $.extend(team.pokes[i], orTeam.pokes[i]);
        delete team.pokes[i].ui;
        delete team.pokes[i].data;
      }

      return team;
    };

  this.cacheTeam = function() {
    var newTeam = JSON.stringify($.extend({}, this.getTeamData(), {
      "tier": ""
    }));
    var oldCache = this.cachedTeam;
    this.cachedTeam = newTeam;

    return !oldCache || newTeam != oldCache;
  };

  this.sendTeam = () => {
    if (!this.team.tier || this.cacheTeam()) {
      network.command("teamchange", {
        "teams": [this.getTeamData()]
      });
    } else {
      network.command("changetier", {
        "0": this.team.tier
      });
    }
  };

  this.saveTeam = () => {
    poStorage.set("team", this.getTeamData());
  };

  this.loadTeam = () => {
    var team = poStorage.get("team", "object");
    if (team) {
      this.team = team;
      for (var i in team.pokes) {
        this.team.pokes[i] = $.extend(new Poke(), team.pokes[i]);
      }
    }
  };

  this.sendPM = (message, id) => {
    var lines = message.trim().split("\n");

    for (var i = 0, len = lines.length; i < len; i++) {
      this.pms.pm(id).printMessage(this.ownId, lines[i]);
      network.command("pm", {
        to: id,
        message: lines[i]
      });
    }
  };

  this.joinChannel = function(id) {
    network.command("joinchannel", {
      channel: id
    });
  };

  this.leaveChannel = function(id) {
    network.command("leavechannel", {
      channel: id
    });
  };
})();

$(function() {
  webclient.loadTeam();

  var userGiven = utils.queryField("user");
  var relayGiven = utils.queryField("relay");
  var portGiven = utils.queryField("port");

  if (userGiven) {
    poStorage.set("user", userGiven);
  }
  if (relayGiven) {
    poStorage.set("relay", relayGiven);
  }
  if (portGiven) {
    poStorage.set("port", portGiven);
  }

  webclient.channels.joinChannel(0);

  serverConnect({
    "relay": poStorage.get("relay"),
    "port": poStorage.get("port")
  });
});

window.webclient = webclient;
export default webclient;
