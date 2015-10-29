var webclientUI = {
    players: new PlayerList(),
    channels: new ChannelList(),
    pms: new PMList(),
    battles: new BattleList(),
    tabs: [],
    timestamps: false,
    challenges: [],
    waitingInfos: {},

    printDisconnectionMessage : function(html) {
        webclientUI.printHtml("<b>Disconnected from Server! If the disconnect is due to an internet problem, try to <a href='po:reconnect/'>reconnect</a> once the issue is solved. You can also go back to the <a href='" + config.registry + "'>server list</a>.</b>");
    },

    printHtml : function(html) {
        for (id in webclientUI.channels.channels()) {
            webclientUI.channels.channel(id).printHtml(html);
        }
    },

    printMessage : function(msg, html) {
        for (id in webclientUI.channels.channels()) {
            webclientUI.channels.channel(id).printMessage(msg, html);
        }
    },

    switchToTab : function(wid) {
        console.log("Switch to tab: " + wid);
        var id = wid.substr(wid.lastIndexOf("-") + 1)
        var obj;
        if (/^channel-/.test(wid)) {
            obj = webclientUI.channels.channel(id);
        } else if (/^pm-/.test(wid)) {
            obj = webclient.pms.pm(id);
        } else if (/^battle-/.test(wid)) {
            obj = webclientUI.battles.battle(id);
        }

        obj.setCurrentTab();
    },

    displayPlayerWindow : function(id, params) {
        var params = params || {};
        var info = "Loading player info...";
        var pl = webclient.players.player(id);

        if (! ("clauses" in params) ) {
            params.clauses = poStorage.get("challenge.clauses", "array") || [];
        }

        if (pl.hasOwnProperty("info")) {
            info = $('<iframe class="player-info" sandbox></iframe>').attr("src", "data:text/html;charset=utf-8,"+webclientUI.convertImages($("<div>").html(pl.info)).html());
        } else {
            info = $('<iframe class="player-info" sandbox></iframe>').attr("src", "data:text/html;charset=utf-8,"+info);
        }
        info = $("<div class='well well-sm info-block'>").append(info);

        var firstRow = $("<div class='flex-row-no-shrink'>").append("<img src='" + pokeinfo.trainerSprite(pl.avatar || 167) + "' alt='trainer sprite' class='player-avatar'>");
        firstRow.append($("<div class='player-teams'><div class='form-group'><label for='opp-team'>Opponent's team:</label><select class='form-control' id='opp-team'></select></div><div class='form-group'><label for='your-team'>Your team:</label><select class='form-control' id='your-team'></select></div></div>"));
        info = $("<div class='flex-column'>").append(firstRow).append(info);

        var ownTeams = info.find("#your-team");
        if (!webclient.ownTiers) {
            /* Todo: remove this code, obsolete in the future */
            var ownPl = webclient.ownPlayer();
            for (tier in ownPl.ratings) {
                ownTeams.append($("<option>").text(tier).attr("value", 0));
            }
        } else {
            for (var i in webclient.ownTiers) {
                if (!params.desc || webclient.ownTiers[i].toLowerCase() == params.tier.toLowerCase()) {
                    ownTeams.append($("<option>").text("Team " + ((+i)+1) + ": " + webclient.ownTiers[i]).attr("value", i));
                }
            }
        }


        if (params.hasOwnProperty("opptier")) {
            var oppTeams = info.find("#opp-team");
            oppTeams.append($("<option>").text(params.opptier));
            oppTeams.prop('disabled', 'disabled');
        }

        if (!params.desc && params.ratings) {
            var oppTeams = info.find("#opp-team");
            oppTeams.prop("disabled", true);
            var selected = false;
            for (tier in pl.ratings) {
                /* If the opponent shares a tier with us, challenge them in that tier */
                if (!selected && webclient.ownTiers.indexOf(tier) != -1) {
                    selected = true;
                    oppTeams.append($("<option selected>").text(tier).attr("value", tier));
                } else {
                    oppTeams.append($("<option>").text(tier).attr("value", tier));
                }
            }
        }

        webclientUI.waitingInfos[id] = info;
        info.updateRatings = params.desc ? false: true;
        webclient.requestInfo(id);

        var fullInfo = $("<div>").addClass("flex-row").append(info);
        var clauses = $("<div>").addClass("input-group checkbox battle-clauses");
        for (var i in BattleTab.clauses) {
            clauses.append("<div class='checkbox'><label title='" + BattleTab.clauseDescs[i] + "'><input type='checkbox'>" + BattleTab.clauses[i] + "</label></div>");
        }
        fullInfo.append(clauses);

        if (params.clauses) {
            for (var i = 0; i < params.clauses.length; i = i+1) {
                if (params.clauses[i]) {
                    clauses.find("input:eq(" + i + ")").prop("checked", true);
                }
            }
        }

        var buttons;

        if (!params.desc) {
            buttons = [{
                label: 'Private Message',
                action: function(dialogItself){
                    webclient.pms.pm(id);
                    dialogItself.close();
                }
            }, {
                label: 'Challenge',
                action: function(dialogItself){
                    var params = {"team": 0, "mode": 0};
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
            buttons = [{
                label: 'Decline',
                action: function(dialogItself){
                    webclient.declineChallenge(params);
                    dialogItself.setData("declined", true);
                    dialogItself.close();

                    webclientUI.printHtml("<span class='challenge-refused'>You refused " + webclient.players.name(params.id) + "'s challenge.</span>");
                }
            }, {
                label: 'Accept',
                action: function(dialogItself){
                    params.team = info.find("#your-team").val();
                    webclient.acceptChallenge(params);
                    dialogItself.setData("accepted", true);
                    dialogItself.close();
                }
            }];
        }

        var dialogInstance = new BootstrapDialog({
            title: utils.escapeHtml(webclient.players.name(id)) + (params.desc? " challenged you in " + params.tier + "!" : ""),
            message: fullInfo,
            "buttons": buttons ,
            onhidden: function(dialogItself) {
                if (params.desc && !dialogItself.getData("cancelled")) {
                    if (!dialogItself.getData("accepted") && !dialogItself.getData("declined")) {
                        webclient.declineChallenge(params);
                    }
                }
            }
        });
        dialogInstance.open();
        dialogInstance.setData("params", params);

        return dialogInstance;
    },

    showChallenge : function(params) {
        console.log(params);
        webclientUI.challenges.push(webclientUI.displayPlayerWindow(params.id, params));
    },

    cancelChallenge: function(params) {
        var newChalls = [];

        for (var i in webclientUI.challenges) {
            var chall = webclientUI.challenges[i];

            if (chall.id == params.id && chall.tier == params.tier) {
                chall.setData("cancelled", true);
                chall.close();
            } else {
                newChalls.push(chall);
            }
        }

        webclientUI.challenges = newChalls;
    },

    updateInfo: function(id, info) {
        if (id in webclientUI.waitingInfos) {
            var plInfo = webclientUI.waitingInfos[id];
            var oppPl = webclient.players.player(id);
            plInfo.find(".player-avatar").attr("src", pokeinfo.trainerSprite(oppPl.avatar  || 167 ));
            plInfo.find(".player-info").attr("src", "data:text/html;charset=utf-8,"+webclientUI.convertImages($("<div>").html(info)).html());

            if (plInfo.updateRatings) {
                var oppTeams = plInfo.find("#opp-team");
                oppTeams.prop("disabled", false);
                oppTeams.html("");
                var selected = false;
                for (tier in oppPl.ratings) {
                    /* If the opponent shares a tier with us, challenge them in that tier */
                    if (!selected && webclient.ownTiers.indexOf(tier) != -1) {
                        selected = true;
                        oppTeams.append($("<option selected>").text(tier).attr("value", tier));
                    } else {
                        oppTeams.append($("<option>").text(tier).attr("value", tier));
                    }
                }
            }
            delete webclientUI.waitingInfos[id];
        }
    },

    convertImages: function(element) {
        element = $(element);
        element.find("img").each(function (index, img) {
            img = $(img);
            var src = img.attr("src").split(":"),
                proto = src[0],
                query = src[1];

            switch (proto) {
                case "pokemon":
                    query = "?" + query;
                    var poke = pokeinfo.toArray(utils.queryField("num", query.slice(1).split("&")[0], query) || "1"),
                        gen = utils.queryField("gen", "6", query),
                        shiny = utils.queryField("shiny", "false", query) === "true",
                        gender = utils.queryField("gender", "male", query),
                        back = utils.queryField("back", "false", query) === "true",
                        cropped = utils.queryField("cropped", "false", query) === "true";

                    img.error(function () {
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

                        img.attr("src", pokeinfo.sprite({num: poke[0], forme: poke[1], female: gender === "female", shiny: shiny}, {gen: gen, back: back}));
                    }).attr("src", pokeinfo.sprite({num: poke[0], forme: poke[1], female: gender === "female", shiny: shiny}, {gen: gen, back: back}));
                    break;
                case "item":
                    img.attr("src", iteminfo.itemSprite(query));
                    break;
                case "trainer":
                    img.attr("src", pokeinfo.trainerSprite(query));
                    break;
                case "http":
                case "https":
                case "data": /* base64 */
                    break;
                default:
                    console.log("Unknown protocol: " + proto);
                    break;
            }
        });
        return element;
    },

    showSettings : function() {
        var content = $("<div>");
        BootstrapDialog.show({
            "title": "Settings for " + webclient.ownName(),
            "message": function(dialogItself) {
                content.load("settings.html", function(response, status) {
                    if (status == "error") {
                        dialogItself.setData("error", true);
                        //todo, error details can be gotten from arguments[2]
                        return;
                    }
                    content.find("#username").val(poStorage.get("user") || "");
                    content.find("#usercolor").val(poStorage.get("player.color") || "").colorpicker({"format":"hex"});
                    content.find("#userinfo").val(poStorage.get("player.info") || "");
                });
                return content;
            },
            "buttons": [ {
                    label: "Update",
                    action: function(dialogItself) {
                        if (dialogItself.getData("error")) {
                            dialogItself.close();
                            return;
                        }
                        var userName = content.find("#username").val();
                        var userColor = content.find("#usercolor").val();
                        var userInfo = content.find("#userinfo").val()
                        poStorage.set("user", userName);
                        poStorage.set("player.color", userColor);
                        poStorage.set("player.info", userInfo);

                        var update = {};

                        if (userName != webclient.ownName()) {
                            update.name = userName;
                        }
                        if (userColor != webclient.players.color(webclient.ownId) && userColor) {
                            update.color = userColor;
                        }
                        if (userInfo != webclient.ownPlayer().info && userInfo) {
                            update.info = {"avatar": 167, "info": userInfo};
                        }
                        network.command("teamchange", update);

                        dialogItself.close();
                    }
                }
            ]
        });
    }
};

vex.defaultOptions.className = 'vex-theme-os';

$(function() {
    webclientUI.linkClickHandler = function (event) {
        var href = this.href,
            sep, cmd, payload, pid;

        if (/^po:/.test(href)) {
            event.preventDefault();

            console.log("trigger " + href);

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
                    webclient.pms.pm(pid).activateTab();
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
                network.command('watch', {battle: +payload});
            } else if (cmd === "send") {
                webclient.channel.sendMessage(payload);
            } else if (cmd === "setmsg") {
                webclient.channel.chat.input.val(payload);
            } else if (cmd === "appendmsg") {
                webclient.channel.chat.input.val(webclient.channel.chat.input.val() + payload);
            } else if (cmd === "reconnect") {
                //window.location.href= window.location.pathname;
                window.location.reload();
            } else if (cmd === "watch-player") {
                if (webclient.battles.isBattling(+payload)) {
                    network.command('watch', {battle: webclient.battles.battleOfPlayer(+payload)});
                }
            } else if (cmd === "kick") {
                network.command('kick', {id: +payload});
            } else if (cmd === "ban") {
                network.command('ban', {id: +payload});
            } else if (cmd === "idle") {
                var isAway = webclient.players.away(webclient.ownId);
                poStorage.set('player.idle', !isAway);
                network.command("idle", {"away":!isAway});
            } else if (cmd === "timestamps") {
                webclientUI.timestamps = !webclientUI.timestamps;
                setTimeout(function(){$("#checkbox-timestamps-dd").prop("checked", webclientUI.timestamps)});
                poStorage.set("chat.timestamps", webclientUI.timestamps);
            } else if (cmd === "rainbow") {
                webclientUI.players.showColors = !webclientUI.players.showColors;
                setTimeout(function(){$("#checkbox-rainbow-dd").prop("checked", webclientUI.players.showColors)});
                poStorage.set("players.rainbow", webclientUI.players.showColors);
                webclientUI.players.updatePlayers();
            } else if (cmd === "exitwarning") {
                webclientUI.exitWarning = !webclientUI.exitWarning;
                setTimeout(function(){$("#checkbox-exitwarning-dd").prop("checked", webclientUI.exitWarning)});
                poStorage.set("exitwarning", webclientUI.exitWarning);
            } else if (cmd === "register") {
                network.command("register");
            } else if (cmd === "info") {
                webclientUI.displayPlayerWindow(+payload);
            } else if (cmd == "chanevents") {
                webclientUI.channels.toggleChanEvents(payload);
            } else if (cmd == "settings") {
                webclientUI.showSettings();
            } else if (cmd == "findbattle") {
                //rated: bool, sameTier: bool, range: int
                network.command("findbattle", {rated: false, sameTier: true});
            } else if (cmd == "tab") {
                webclientUI.switchToTab(payload);
            } else if (cmd == "teambuilder") {
                webclientUI.teambuilderOpen = true;
                BootstrapDialog.show({
                    title: "Teambuilder",
                    message : function() {
                        var content = $("<div>").load("teambuilder.html?load=" + (webclient.teambuilderLoaded ? false : true), function(response, status) {
                            if (status == "error") {
                                return;
                            }
                        });

                        return content;
                    },
                    onhidden: function() {
                        webclientUI.teambuilderOpen = false;
                    },
                    buttons: [
                        {
                            label: "New team",
                            action: function(dialog) {
                                webclientUI.teambuilder.onNewTeam();
                            }
                        },
                        {
                            label: "Importable",
                            action: function(dialog) {
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
            }else if (cmd == "download") {
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
                    }
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
        webclientUI.printHtml("<em>You ignored " + utils.escapeHtml(webclient.players.name(id)) + ".</em>");
    }).on("ignoreremove", function(id) {
        webclientUI.printHtml("<em>You stopped ignoring " + utils.escapeHtml(webclient.players.name(id)) + ".</em>");
    }).on("ownplayerupdated", function(id) {
        var player = webclient.players.player(id);
        $("#checkbox-idle-dd").prop("checked", player.away);

        document.title = webclient.ownName() + " - Pok\u00E9mon Online";
    });


    // $( '.dropdown-menu a.checkbox-dd' ).on( 'click', function( event ) {

    //    var $target = $( event.currentTarget ),
    //        $inp = $target.find( 'input' );

    //     setTimeout( function() { $inp.prop( 'checked', !$inp.prop( 'checked') ) }, 0);

    //    $( event.target ).blur();
    //    //return false;
    // });
    webclientUI.timestamps = poStorage.get("chat.timestamps", "boolean");
    webclientUI.players.showColors = poStorage.get("players.rainbow", "boolean");
    webclientUI.exitWarning = poStorage.get("exitwarning", "boolean") === null ? true : poStorage.get("exitwarning", "boolean");

    $("#checkbox-timestamps-dd").prop("checked", webclientUI.timestamps);
    $("#checkbox-rainbow-dd").prop("checked", webclientUI.players.showColors);
    $("#checkbox-idle-dd").prop("checked", poStorage.get("player.idle", 'boolean') === null ? true: poStorage.get("player.idle", 'boolean'));
    $("#checkbox-exitwarning-dd").prop("checked", webclientUI.exitWarning);

    webclientUI.channels.chanevents = poStorage.get("chanevents-" + (poStorage.get("relay") || config.relayIP), "object");
    if (webclientUI.channels.chanevents == null) {
        webclientUI.channels.chanevents = {};
    }

    webclientUI.exitWarning = poStorage.get("exitwarning", "boolean");
    if (webclientUI.exitWarning == null) {
        webclientUI.exitWarning = true;
    }
});

window.onbeforeunload = function(e) {
    if (webclientUI.exitWarning) {
        if (webclient.connectedToServer) {
            return 'Are you sure you want to disconnect from the server?';
        }
    }
};

window.webclientUI = webclientUI;

$(function() {
    /* Load heavy libraries after */
    $("body").append([
        '<link rel="stylesheet" href="public/assets/stylesheets/teambuilder.css">',
        '<script src="public/assets/javascript/teambuilder.js"></script>'
        ].join("\n")
    );
});
