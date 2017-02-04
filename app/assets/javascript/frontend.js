import $ from "jquery";
import vex from "vex-js";
import vexDialog from "vex-dialog";
import "bootstrap"; //for .tooltip. Useful?
import BootstrapDialog from "bootstrap3-dialog";

import PlayerList from "./playerlistui";
import ChannelList from "./channels/channellistui";
import PMList from "./pms/pmlistui";
import BattleList from "./battles/battlelistui";
import webclient from "./webclient";
import config from "./config";
import poStorage from "./postorage";
import network from "./network";
import BattleTab from "./battles/battletab";
import notif from "./notif";
import {PokeInfo, ItemInfo} from "./pokeinfo";
import {queryField, escapeHtml} from "./utils";

import afterload from "./afterload";

import "../stylesheets/frontend.less";

vex.registerPlugin(vexDialog);
vex.defaultOptions.className = 'vex-theme-os';

function WebclientUI() {
  this.players = new PlayerList();
  this.channels = new ChannelList();
  this.pms = new PMList();
  this.battles = new BattleList();
  this.tabs = [];
  this.timestamps = true;
  this.challenges = [];
  this.waitingInfos = {};
  this.battleNotifications = true;

  this.printDisconnectionMessage = (/* html */) => {
    this.printHtml("<b>Disconnected from Server! If the disconnect is due to an internet problem, try to <a href='po:reconnect/'>reconnect</a> once the issue is solved. You can also go back to the <a href='" + config.registry + "'>server list</a>.</b>");
    this.switchToChannel();
  };

  this.switchToChannel = () => {
    if (this.currentTab.shortHand != "channel") {
      for (var i = this.tabs.length - 1; i >= 0; i--) {
        if (this.tabs[i].shortHand == "channel") {
          this.tabs[i].setCurrentTab();
          return;
        }
      }
    }
  };

  this.setBattleSound = val => {
    console.log("setting battle sounds " + val);
    this.battles.setSound(val);
    poStorage.set("battle.sound", val);
    setTimeout(() => {
      $("#checkbox-simplesound-dd").prop("checked", this.battles.sound);
    });
  };

  this.updateBadgeCount = () => {
    var total = -1; // NOTHING DISPLAYED

    if (this.channels.countActive() > 0) {
      total = 0;
    }

    var flashes = $(".tab-active").length + ($(".channel-list-item.tab-flash").length - $(".channel-list-item.tab-active").length);

    if (flashes > 0) {
      total = flashes;
    }

    /* -1 : no badge, 0+ : badge with 0+ displayed */
    notif.count = total
    notif.titleUpdate();
    //Todo: remove the log and actually add the badge.
  };

  this.updateSearchingBattleState = () => {
    $("#findbattle a").text(webclient.searchingForBattle ? "Searching..." : "Find battle");
  };

  this.printHtml = html => {
    for (var id in this.channels.channels()) {
      this.channels.channel(id).printHtml(html);
    }
  };

  this.printMessage = (msg, html) => {
    for (var id in this.channels.channels()) {
      this.channels.channel(id).printMessage(msg, html);
    }
  };

  this.switchToTab = wid => {
    var id = wid.substr(wid.lastIndexOf("-") + 1);
    var obj;
    if (/^channel-/.test(wid)) {
      obj = this.channels.channel(id);
    } else if (/^pm-/.test(wid)) {
      obj = webclient.pms.pm(id);
    } else if (/^battle-/.test(wid)) {
      obj = this.battles.battle(id);
    }

    obj.setCurrentTab();
  },

  this.displayPlayerWindow = (id, params) => {
    params = params || {};
    var info = "Loading player info...";
    var pl = webclient.players.player(id) || webclient.ownPlayer();
    var self = webclient.ownId === id;

    if (!("clauses" in params)) {
      params.clauses = poStorage.get("challenge.clauses", "array") || [];
    }

    if (pl.hasOwnProperty("info")) {
      info = $('<iframe class="player-info" sandbox></iframe>').attr("src", "data:text/html;charset=utf-8," + this.convertImages($("<div>").html(pl.info)).html());
    } else {
      info = $('<iframe class="player-info" sandbox></iframe>').attr("src", "data:text/html;charset=utf-8," + info);
    }
    info = $("<div class='well well-sm info-block'>").append(info);

    var firstRow = $("<div class='flex-row-no-shrink'>").append("<img src='" + PokeInfo.trainerSprite(pl.avatar) + "' alt='trainer sprite' class='player-avatar'>");
    firstRow.append($("<div class='player-teams'>" + (!self ? "<div class='form-group'><label for='opp-team'>Opponent's team:</label><select class='form-control' id='opp-team'></select></div>" : "") + "<div class='form-group'><label for='your-team'>Your team:</label><select class='form-control' id='your-team'></select></div></div>"));
    info = $("<div class='flex-column'>").append(firstRow).append(info);

    var i;

    this.addOwnTiers(info.find("#your-team"), params);
    this.addOppTiers(info.find("#opp-team"), pl, params);

    info.updateRatings = true;
    info.params = params;
    this.waitingInfos[id] = info;
    webclient.requestInfo(id);
    if (!self) {
      this.waitingInfos[webclient.ownId] = info;
      webclient.requestInfo(webclient.ownId);
    }

    var fullInfo = $("<div>").addClass("flex-row-basic").append(info);
    var clauses = $("<div>").addClass("input-group checkbox battle-clauses");
    for (i in BattleTab.clauses) {
      clauses.append("<div class='checkbox'><label title='" + BattleTab.clauseDescs[i] + "'><input type='checkbox'>" + BattleTab.clauses[i] + "</label></div>");
    }
    fullInfo.append(clauses);

    if (params.clauses) {
      for (i = 0; i < params.clauses.length; i = i + 1) {
        if (params.clauses[i]) {
          clauses.find("input:eq(" + i + ")").prop("checked", true);
        }
      }
      if (params.desc) {
        clauses.find("input").prop("disabled", true);
      }
    }

    if (webclient.battles.isBattling(id)) {
      fullInfo = $("<div>").addClass("flex-column").append(fullInfo);

      var battling = pl.name + " is battling against ";

      var battleList = [];
      var battles = webclient.battles.battlesOfPlayer(id);

      for (var x in battles) {
        var battle = battles[x];
        var opp = battle.ids[0] == id ? battle.ids[1] : battle.ids[0];
        battleList.push("<a href='po:watch/" + battle.id + "'>" + escapeHtml(webclient.players.name(opp)) + "</a>");
      }

      fullInfo.append($("<p>").append(battling + battleList.join(", ") + "."));
    }

    var buttons;

    if (!params.desc) {
      var isIgnored = webclient.players.isIgnored(id);
      if (!self) {
        buttons = [{
          label: (isIgnored ? 'Unignore' : 'Ignore'),
          action: dialogItself => {
            if (!isNaN(id)) {
              if (!isIgnored) {
                webclient.players.addIgnore(id);
              } else {
                webclient.players.removeIgnore(id);
              }
              this.players.updatePlayer(+id);
            }
            dialogItself.close();
          }
        }, {
          label: 'Private Message',
          action: dialogItself => {
            webclient.pms.pm(id, true);
            dialogItself.close();
          }
        }, {
          label: 'Challenge',
          action: dialogItself => {
            var params = {
              "team": 0,
              "mode": 0
            };
            params.clauses = [];

            for (var i in BattleTab.clauses) {
              params.clauses.push(clauses.find("input:eq(" + i + ")").prop("checked") ? 1 : 0);
            }
            params.tier = info.find("#opp-team").val();
            params.team = info.find("#your-team").val();

            poStorage.set("challenge.clauses", params.clauses);

            webclient.challenge(id, params);
            dialogItself.close();
          }
        }];
      } else {
        buttons = [];
      }
    } else {
      buttons = [{
        label: 'Decline',
        action: dialogItself => {
          webclient.declineChallenge(params);
          dialogItself.setData("declined", true);
          dialogItself.close();

          this.printHtml("<span class='challenge-refused'>You refused " + pl.name + "'s challenge.</span>");
        }
      }, {
        label: 'Accept',
        action: dialogItself => {
          params.team = info.find("#your-team").val();
          webclient.acceptChallenge(params);
          dialogItself.setData("accepted", true);
          dialogItself.close();
        }
      }];
    }

    var dialogInstance = new BootstrapDialog({
      title: escapeHtml(pl.name) + (params.desc ? " challenged you in " + params.tier + "!" : ""),
      message: fullInfo,
      "buttons": buttons,
      onhidden: dialogItself => {
        if (params.desc && !dialogItself.getData("cancelled")) {
          if (!dialogItself.getData("accepted") && !dialogItself.getData("declined")) {
            webclient.declineChallenge(params);
          }
        }
      },
      closeByBackdrop: params.desc ? false : true
    });
    dialogInstance.open();

    return dialogInstance;
  };

  this.showChallenge = params => {
    this.challenges.push(this.displayPlayerWindow(params.id, params));
  };

  this.cancelChallenge = params => {
    var newChalls = [];

    for (var i in this.challenges) {
      var chall = this.challenges[i];

      if (chall.id == params.id && chall.tier == params.tier) {
        chall.setData("cancelled", true);
        chall.close();
      } else {
        newChalls.push(chall);
      }
    }

    this.challenges = newChalls;
  };

  this.updateInfo = (id, info) => {
    if (id in this.waitingInfos) {
      var plInfo = this.waitingInfos[id];
      var oppPl = webclient.players.player(id);
      if (id !== webclient.ownId) {
        plInfo.find(".player-avatar").attr("src", PokeInfo.trainerSprite(oppPl.avatar || 167));
        plInfo.find(".player-info").attr("src", "data:text/html;charset=utf-8," + this.convertImages($("<div>").html(info)).html());
      }

      if (plInfo.updateRatings) {
        if (id == webclient.ownId) {
          this.addOwnTiers(plInfo.find("#your-team"), plInfo.params);
        } else {
          this.addOppTiers(plInfo.find("#opp-team"), oppPl, plInfo.params);
        }
      }
      delete this.waitingInfos[id];
    }
  };

  this.addOwnTiers = (ownTeams, params) => {
    var pl = webclient.ownPlayer();
    ownTeams.html("");

    webclient.ownTiers.forEach((tier, i) => {
      if (!params.desc || tier.toLowerCase() == params.tier.toLowerCase()) {
        var rating = (pl.ratings && pl.ratings[tier]) ? " (" + pl.ratings[tier] + ")" : "";
        ownTeams.append($("<option>").text(`Team ${i+1}: ${tier}${rating}`).attr("value", i));
      }
    });
  }

  this.addOppTiers = (oppTeams, pl, params) => {
    oppTeams.html("");
    if ("opptier" in params) {
      oppTeams.append($("<option>").text(params.opptier));
      oppTeams.prop('disabled', true);
      return;
    }

    var selected = false;
    if (pl.ratings) {
      for (var tier in pl.ratings) {
        /* If the opponent shares a tier with us, challenge them in that tier */
        if (!selected && webclient.ownTiers.indexOf(tier) != -1) {
          selected = true;
          oppTeams.append($("<option selected>").text(tier).attr("value", tier));
        } else {
          oppTeams.append($("<option>").text(tier).attr("value", tier));
        }
      }
    }

    if (!params.desc && params.ratings) {
      oppTeams.prop("disabled", true);
    }
  };

  this.promptUsernameDialog = callback => vex.dialog.open({
    message: "Enter your username:",
    input: "<input name='username' type='text' placeholder='Username'>",
    buttons: [
      $.extend({}, vex.dialog.buttons.YES, {text: "Login"}),
      $.extend({}, vex.dialog.buttons.NO, {text: "Login as Guest"})
    ],
    callback
  });

  this.convertImages = element => {
    element = $(element);
    element.find("img").each(function(index, img) {
      img = $(img);
      var src = img.attr("src").split(":"),
        proto = src[0],
        query = src[1];

      switch (proto) {
        case "pokemon":
          query = "?" + query;
          var poke = PokeInfo.toArray(queryField("num", query.slice(1).split("&")[0], query) || "1"),
            gen = queryField("gen", "6", query),
            shiny = queryField("shiny", "false", query) === "true",
            gender = queryField("gender", "male", query),
            back = queryField("back", "false", query) === "true";

          img.on("error", function() {
            if (gender == "female") {
              gender = "male";
            } else if (gen < 6) {
              gen = 6;
            } else if (gen === 6) {
              gen = 5;
            } else if (shiny) {
              shiny = false;
            } else if (back) {
              back = false;
            } else {
              return;
            }

            img.attr("src", PokeInfo.sprite({
              num: poke[0],
              forme: poke[1],
              female: gender === "female",
              shiny: shiny
            }, {
              gen: gen,
              back: back
            }));
          }).attr("src", PokeInfo.sprite({
            num: poke[0],
            forme: poke[1],
            female: gender === "female",
            shiny: shiny
          }, {
            gen: gen,
            back: back
          }));
          break;
        case "item":
          img.attr("src", ItemInfo.itemSprite(query));
          break;
        case "icon":
          img.attr("src", PokeInfo.icon(query));
          break;
        case "trainer":
          img.attr("src", PokeInfo.trainerSprite(query));
          break;
        case "http":
        case "https":
        case "data":
          /* base64 */
          break;
        default:
          console.log("Unknown protocol: " + proto);
          break;
      }
    });
    return element;
  };

  this.showSettings = () => {
    var content = $("<div>");
    BootstrapDialog.show({
      "title": "Settings for " + webclient.ownName(),
      "message": dialogItself => {
        content.load("settings", (response, status) => {
          if (status == "error") {
            dialogItself.setData("error", true);
            //todo, error details can be gotten from arguments[2]
            return;
          }
          content.find("#username").val(poStorage.get("user") || "");
          content.find("#usercolor").val(poStorage.get("player.color") || "").colorpicker({
            "format": "hex"
          });
          content.find("#userinfo").val(poStorage.get("player.info") || "");
          content.find("#useravatar").val(poStorage.get("player.avatar") || 0);
          var setAvatar = function() {
            var num = parseInt(content.find("#useravatar").val());
            if (isNaN(num) || num < 0 || num > 844) {
              // nothing or invalid avatar given, do not change
              return;
            }
            content.find("#settings-avatar-image").attr("src", PokeInfo.trainerSprite(num));
          };
          var updateLimitCounter = function() {
            content.find(".userinfo-limit-counter").text(content.find("#userinfo").val().length + "/" + content.find("#userinfo").attr("maxlength"));
          };
          setAvatar();
          updateLimitCounter();
          content.find("#useravatar").on("change keyup", setAvatar);
          content.find("#userinfo").on("change keyup", updateLimitCounter);
        });
        return content;
      },
      "buttons": [{
        label: "Update",
        action: dialogItself => {
          if (dialogItself.getData("error")) {
            dialogItself.close();
            return;
          }
          var userName = content.find("#username").val();
          var userColor = content.find("#usercolor").val();
          var userInfo = content.find("#userinfo").val();
          var userAvatar = content.find("#useravatar").val();
          poStorage.set("user", userName);
          poStorage.set("player.color", userColor);
          poStorage.set("player.info", userInfo);
          poStorage.set("player.avatar", Math.floor(Math.min(844, Math.max(userAvatar, 0))));

          var update = {};

          if (userName != webclient.ownName()) {
            update.name = userName;
          }
          if (userColor != webclient.players.color(webclient.ownId) && userColor) {
            update.color = userColor;
          }
          if (userInfo != webclient.ownPlayer().info && userInfo || userAvatar != webclient.ownPlayer().avatar) {
            update.info = {
              "avatar": poStorage.get("player.avatar") || 167,
              "info": userInfo
            };
          }
          network.command("teamchange", update);
          webclient.searchingForBattle = false;
          this.updateSearchingBattleState();

          dialogItself.close();
        }
      }]
    });
  };

  this.toggleIdle = () => {
    var isAway = webclient.players.away(webclient.ownId);
    poStorage.set("player.idle", !isAway);
    network.command("idle", {
      "away": !isAway
    });
  };

  this.isIdle = () => {
    return webclient.players.away(webclient.ownId);
  }
}

var webclientUI = new WebclientUI();

$(function() {
  webclientUI.linkClickHandler = function(event) {
    var href = this.href,
      sep, cmd, payload, pid;

    if (/^po:/.test(href)) {
      event.preventDefault();

      sep = href.indexOf("/");
      cmd = href.slice(3, sep);

      payload = decodeURIComponent(href.slice(sep + 1));

      // Add other commands here..
      pid = webclient.players.id(payload);
      if (pid === -1) {
        pid = parseInt(payload, 10);
      }

      if (cmd === "join") {
        webclient.joinChannel(payload);
      } else if (cmd === "pm") { // Create pm window
        if (!isNaN(pid)) {
          webclient.pms.pm(pid, true);
        }
      } else if (cmd === "ignore") {
        // Ignore the user
        if (!isNaN(pid)) {
          if (!webclient.players.isIgnored(pid)) {
            webclient.players.addIgnore(pid);
          } else {
            webclient.players.removeIgnore(pid);
          }
          webclientUI.players.updatePlayer(+pid);
        }
      } else if (cmd === "watch") {
        network.command('watch', {
          battle: +payload
        });
      } else if (cmd === "send") {
        webclient.currentTab.sendMessage(payload);
      } else if (cmd === "setmsg") {
        webclient.currentTab.chat.chatSend.val(payload);
      } else if (cmd === "appendmsg") {
        webclient.currentTab.chat.chatSend.val(webclient.currentTab.chat.chatSend.val() + payload);
      } else if (cmd === "reconnect") {
        //window.location.href= window.location.pathname;
        window.location.reload();
      } else if (cmd === "watch-player") {
        if (webclient.battles.isBattling(+payload)) {
          network.command('watch', {
            battle: webclient.battles.battleOfPlayer(+payload)
          });
        }
      } else if (cmd === "kick") {
        network.command('kick', {
          id: +payload
        });
      } else if (cmd === "ban") {
        network.command('ban', {
          id: +payload
        });
      } else if (cmd === "idle") {
        webclientUI.toggleIdle();
      } else if (cmd === "timestamps") {
        webclientUI.timestamps = !webclientUI.timestamps;
        setTimeout(function() {
          $("#checkbox-timestamps-dd").prop("checked", webclientUI.timestamps);
        });
        poStorage.set("chat.timestamps", webclientUI.timestamps);
      } else if (cmd === "rainbow") {
        webclientUI.players.showColors = !webclientUI.players.showColors;
        setTimeout(function() {
          $("#checkbox-rainbow-dd").prop("checked", webclientUI.players.showColors);
        });
        poStorage.set("players.rainbow", webclientUI.players.showColors);
        $(".chat-column").toggleClass("rainbow");
        webclientUI.players.updatePlayers();
      } else if (cmd === "sortauth") {
        webclientUI.players.authFilter = !webclientUI.players.authFilter;
        setTimeout(function() {
          $("#checkbox-sortauth-dd").prop("checked", webclientUI.players.authFilter);
        });
        webclientUI.players.updatePlayers();
        poStorage.set("sort-by-auth", webclientUI.players.authFilter);
      } else if (cmd === "exitwarning") {
        webclientUI.exitWarning = !webclientUI.exitWarning;
        setTimeout(function() {
          $("#checkbox-exitwarning-dd").prop("checked", webclientUI.exitWarning);
        });
        poStorage.set("exitwarning", webclientUI.exitWarning);
      } else if (cmd === "simplebattle") {
        webclientUI.battles.simpleWindow = !webclientUI.battles.simpleWindow;
        setTimeout(function() {
          $("#checkbox-simplebattle-dd").prop("checked", webclientUI.battles.simpleWindow);
        });
        poStorage.set("battle.simple-window", webclientUI.battles.simpleWindow);
      } else if (cmd === "battlesound") {
        var currentSound = webclientUI.battles.sound == "unset" ? false : webclientUI.battles.sound;
        webclientUI.setBattleSound(!currentSound);
      } else if (cmd === "register") {
        network.command("register");
      } else if (cmd === "info") {
        webclientUI.displayPlayerWindow(+payload);
      } else if (cmd == "chanevents") {
        webclientUI.channels.toggleChanEvents(payload);
      } else if (cmd == "channotifs") {
        webclientUI.channels.toggleChanNotifs(payload);
        webclientUI.updateBadgeCount();
      } else if (cmd == "settings") {
        webclientUI.showSettings();
      } else if (cmd == "findbattle") {
        //rated: bool, sameTier: bool, range: int
        if (!webclient.searchingForBattle) {
          network.command("findbattle", {
            rated: false,
            sameTier: true
          });
          webclient.searchingForBattle = true;
          webclientUI.updateSearchingBattleState();
        } else {
          webclient.cancelFindBattle();
          webclientUI.updateSearchingBattleState();
        }
      } else if (cmd == "tab") {
        webclientUI.switchToTab(payload);
      } else if (cmd == "teambuilder") {
        webclientUI.teambuilderOpen = true;
        BootstrapDialog.show({
          title: "Teambuilder",
          message: function() {
            var content = $("<div>").load("teambuilder?load=" + (webclient.teambuilderLoaded ? false : true), function(response, status) {
              if (status == "error") {
                return;
              }
            });

            return content;
          },
          closeByBackdrop: false,
          onhidden: function() {
            webclientUI.teambuilderOpen = false;
          },
          buttons: [{
              label: "New team",
              action: function(/* dialog */) {
                webclientUI.teambuilder.onNewTeam();
              }
            },
            {
              label: "Importable",
              action: function(/* dialog */) {
                webclientUI.teambuilder.onImportable();
              }
            },
            {
              label: "Update",
              action: function(dialog) {
                dialog.close();
                webclient.saveTeam();
                webclient.sendTeam();
              }
            }
          ]
        });
      } else if (cmd == "tb-setgen") {
        webclientUI.teambuilder.setGen(+payload);
      } else if (cmd == "download") {
        $("#download-hidden").val(JSON.stringify(localStorage));
        $("#download-form").submit();
      } else if (cmd == "upload") {
        $("#upload-hidden").click().on("change", function() {
          var file = this.files.item(0);

          var fileReader = new FileReader();
          fileReader.onload = function(e) {
            var res = e.target.result;
            if (!res) {
              return;
            }
            $.extend(localStorage, JSON.parse(res));

            BootstrapDialog.alert("Your data was replaced! Reload the page to see immediate effects.");
          };
          fileReader.readAsText(file, "utf-8");
        });
      }
    } else {
      if (webclient.connectedToServer && !$(this).attr("target")) {
        /* Make sure link opens in a new window */
        this.target = "_blank";
      }
    }
  };
  /* handle clicks on links, especially with po: urls */
  $(document).on("click", "a", webclientUI.linkClickHandler);

  webclient.players.on("ignoreadd", function(id) {
    webclientUI.printHtml("<em>You ignored " + escapeHtml(webclient.players.name(id)) + ".</em>");
  }).on("ignoreremove", function(id) {
    webclientUI.printHtml("<em>You stopped ignoring " + escapeHtml(webclient.players.name(id)) + ".</em>");
  }).on("ownplayerupdated", function(id) {
    var player = webclient.players.player(id);
    $("#checkbox-idle-dd").prop("checked", player.away);

    document.title = webclient.ownName() + " - Pok\u00E9mon Online";

    /* Display username in header */
    $(".displayUsername").html(webclient.ownName());
    $(".avatar-miniature").attr("src", PokeInfo.trainerSprite(webclient.ownPlayer().avatar));
  });

  webclientUI.timestamps = poStorage.get("chat.timestamps", "boolean") === null ? true : poStorage.get("chat.timestamps", "boolean");
  webclientUI.players.showColors = poStorage.get("players.rainbow", "boolean") === null ? true : poStorage.get("players.rainbow", "boolean");
  webclientUI.exitWarning = poStorage.get("exitwarning", "boolean") === null ? true : poStorage.get("exitwarning", "boolean");
  webclientUI.players.authFilter = poStorage.get("sort-by-auth", "boolean") === null ? true : poStorage.get("sort-by-auth", "boolean");
  webclientUI.battles.simpleWindow = poStorage.get("battle.simple-window", "boolean") === null ? true : poStorage.get("battle.simple-window", "boolean");
  webclientUI.battles.sound = poStorage.get("battle.sound", "boolean") === null ? "unset" : poStorage.get("battle.sound", "boolean");

  $("#checkbox-timestamps-dd").prop("checked", webclientUI.timestamps);
  $("#checkbox-rainbow-dd").prop("checked", webclientUI.players.showColors);
  $("#checkbox-idle-dd").prop("checked", webclientUI.isIdle());
  $("#checkbox-exitwarning-dd").prop("checked", webclientUI.exitWarning);
  $("#checkbox-sortauth-dd").prop("checked", webclientUI.players.authFilter);
  $("#checkbox-simplebattle-dd").prop("checked", webclientUI.battles.simpleWindow);
  $("#checkbox-simplesound-dd").prop("checked", webclientUI.battles.sound === true);

  webclientUI.channels.chanevents = poStorage.get("chanevents-" + (poStorage.get("relay") || config.relayIP), "object") || {};
  webclientUI.channels.channotifs = poStorage.get("channotifs-" + (poStorage.get("relay") || config.relayIP), "object") || {};

  $('[data-toggle="tooltip"]').attr("data-placement", "bottom").tooltip();
});

window.onbeforeunload = function(e) {
  if (webclientUI.exitWarning) {
    // don't show message when staying on the site
    if (webclient.connectedToServer && window.location.href != e.target.baseURI) {
      return 'Are you sure you want to disconnect from the server?';
    }
  }
};

window.webclientUI = webclientUI;

$(function() {
  /* Load heavy libraries after */
  require.ensure("./teambuilder", () => {
    require("./teambuilder");
  });

  $("#toggleSidebar").click(function(evt) {
    evt.preventDefault();
    $("#leftmenu").toggleClass("hide");
  });

  var checkCompact = function() {
    if ($(window).width() < 768) {
      $("#leftmenu").addClass("hide");
    } else {
      $("#leftmenu").removeClass("hide");
    }
  };
  checkCompact();
  $(window).resize(function() {
    checkCompact();
  });

  afterload();
});

export default webclientUI;
