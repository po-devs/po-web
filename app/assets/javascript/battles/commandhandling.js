

/* dealWithXxxx functions are all called from dealWithCommand */
battledata.dealWithTurn = function(params) {
    this.print("<h2>Turn " + params.turn + "</h2>", {"css": "turn"});
    this.trigger("turn", params.turn);
};

battledata.dealWithBlank = function(params) {
    this.print("");

    var self = this;

    if (this.speed < 10) {
        this.pause();
        setTimeout(function(){self.unpause();}, 600*this.speed);
    }
};

battledata.dealWithSend = function(params) {
    var poke = params.pokemon;
    var sl = this.slot(params.spot);
    var player = this.player(params.spot);

    poke = $.extend({}, this.teams[player][params.slot], poke);
    if (this.isBattle() && this.player(params.spot) == this.myself) {
        /* Don't update team poke with info from poke - could be fooled by
          zoroark etc. */
    } else {
        $.extend(this.teams[player][params.slot], poke);
    }
    /* Stores the pokemon in field memory */
    this.pokes[params.spot] = poke;

    /* switch in memory */
    var tmp = this.teams[player][params.slot];
    this.teams[player][params.slot] = this.teams[player][sl];
    this.teams[player][sl] = tmp;

    //this.animator.on("send", params.spot);

    this.updateFieldPoke(params.spot);
    this.updateTeamPokes(player, [this.slot(params.spot), params.slot]);

    this.trigger("sendout", params.spot);

    if (PokeInfo.name(poke) == poke.name) {
        this.print(this.name(player) + " sent out " + poke.name + "!");
    } else {
        this.print(this.name(player) + " sent out " + poke.name + "! (" + PokeInfo.name(poke) + ")");
    }
};

battledata.dealWithSendback = function(params) {
    var poke = this.pokes[params.spot];
    var pl = this.player(params.spot);

    //this.animator.on("sendback", params.spot);

    if (pl == this.myself) {
        var moves = this.teams[pl][params.spot].moves;
        for (var i in moves) {
            moves[i].tempmove = 0;
            moves[i].temppp = 0;
        }
    }

    if (!params.silent) {
        this.print(this.name(pl) + " called " + poke.name + " back!");
    }

    this.trigger("sendback", params.spot);
};

battledata.dealWithVanish = function(params) {
    this.pokes[params.spot].hidden = true;

    this.trigger("vanish", params.spot);
};

battledata.dealWithReappear = function(params) {
    this.pokes[params.spot].hidden = false;

    this.trigger("reappear", params.spot);
};

/* Transform I guess, only affects poke on the field */
battledata.dealWithSpritechange = function(params) {
    this.pokes[params.spot].sprite = params.sprite;

    this.trigger("spritechange", params.spot);
};

/* Cosmetic forme change, only affects poke on the field */
battledata.dealWithSubformechange = function(params) {
    var newNum = this.pokes[params.spot].num + (1 << params.subforme);
    this.pokes[params.spot].sprite = newNum;

    this.trigger("spritechange", params.spot);
};

/* Definite change of the poke even in the team */
battledata.dealWithFormechange = function(params) {
    var pokeObject = PokeInfo.toObject(params.newforme);
    $.extend(this.teams[params.player][params.slot], pokeObject);
    $.extend(this.pokes[this.spot(params.player,params.slot)], pokeObject);

    this.updateTeamPokes(params.player, [params.slot]);

    this.trigger("spritechange", this.spot(params.player, params.spot));
};

battledata.dealWithTeampreview = function(params) {
    var team = params.team;
    var player = params.player;

    var yourTeam = [];
    var oppTeam = [];
    for (var i = 0; i< 6; i++) {
        if (this.teams[this.myself][i].num) {
            yourTeam.push(PokeInfo.name(this.tpoke(this.myself, i)));
        }
        if (team[i] && team[i].num) {
            oppTeam.push(PokeInfo.name(team[i]));
        }
    }

    this.print("<strong>Your team: </strong>" + yourTeam.join(" / "));
    this.print("<strong>Opponent's team: </strong>" + oppTeam.join(" / "));
    this.print("");

    /* triggers the choice */
    this.teamPreview = true;

    this.trigger("teampreview", this.teams[this.myself], team);
};

battledata.dealWithPpchange = function(params) {
    this.teams[this.player(params.spot)][this.slot(params.spot)].moves[params.move].pp = params.pp;

    this.trigger("ppchange", params);
};

battledata.dealWithMovechange = function(params) {

    var poke = this.teams[this.myself][params.spot];

    if (params.temporary) {
        poke.moves[params.slot].tempmove = params.move;
        poke.moves[params.slot].temppp = MoveInfo.pp(params.move);
    } else {
        poke.moves[params.slot].move = params.move;
    }
};

battledata.dealWithOfferchoice = function(params) {
    this.choices[params.choice.slot] = params.choice;
    /* Force the user to switch */
   // this.request.forceSwitch = !params.choice.attack;
};

battledata.dealWithKo = function(params) {
    //this.animator.on("ko", params.spot);
    this.print("<strong>" + this.nick(params.spot) + " fainted!</strong>");

    this.pokes[params.spot].status = 31; //ko

    this.trigger("ko", params.spot);
};

battledata.dealWithMove = function(params) {
    if (!params.silent) {
        this.print("<span class='use-battle-move'>" + this.nick(params.spot) + " used <strong class='battle-message-" + TypeInfo.name(MoveInfo.type(params.move)).toLowerCase() + "'>" + MoveInfo.name(params.move) + "</strong>!</span>");
    }

    //this.animator.on("attack", params.spot, params.move);
};

battledata.dealWithHpchange = function(params) {
    /* Checks & updates the pokemon in memory's life percent */
    var current = this.pokes[params.spot].percent;
    if (this.pokes[params.spot].life) {
        this.pokes[params.spot].life = params.newHP;
        this.pokes[params.spot].percent = Math.floor(params.newHP/this.pokes[params.spot].totalLife*100);
        this.tpoke(params.spot).life = params.newHP;
        this.tpoke(params.spot).percent = Math.floor(params.newHP/this.pokes[params.spot].totalLife*100);
    } else {
        this.tpoke(params.spot).percent = params.newHP;
        this.pokes[params.spot].percent = params.newHP;
    }

    this.updateTeamPokes(this.player(params.spot), [this.slot(params.spot)]);
    /* Is it healing or damage? */
/*    if (params.newHP > current || params.newHP == (this.pokes[params.spot].totalLife || 100)) {
        this.addCommand(["-heal", this.spotToPlayer(params.spot), this.pokemonDetails(this.pokes[params.spot])], this.damageCause);
    } else {
        this.addCommand(["-damage", this.spotToPlayer(params.spot), this.pokemonDetails(this.pokes[params.spot])], this.damageCause);
    }
    this.damageCause = {};
    */
    //this.animator.on("hpchange", params.spot, current, this.pokes[params.spot].percent);
    var change = current - this.pokes[params.spot].percent;
    /* Woudln't something with old & new HP be more prudent, like the commented line above? */
    this.trigger("hpchange", params.spot, change);
};

battledata.dealWithHitcount = function(params) {
    this.print("Hit " + params.count + " time(s)!");
};

battledata.dealWithEffectiveness = function(params) {
    if (params.effectiveness > 4) {
        this.print("<span class='battle-message-super'>It's super effective!</span>");
    } else if (params.effectiveness < 4 && params.effectiveness > 0) {
        this.print("<span class='battle-message-notvery'>It's not very effective...</span>");
    } else if (params.effectiveness === 0) {
        this.print("It had no effect on " + this.nick(params.spot) + "!");
    }
};

battledata.dealWithCritical = function(params) {
    this.print("<span class='battle-message-crit'>A critical hit!</span>");
};

battledata.dealWithMiss = function(params) {
    this.print("The attack of "+ this.nick(params.spot) +" missed!");
};

battledata.dealWithAvoid = function(params) {
    this.print(this.nick(params.spot) +" avoided the attack!");
};

battledata.dealWithBoost = function(params) {
    if (params.silent) {
        return;
    }
    if (params.boost > 6) {
        this.print(this.nick(params.spot) +"'s " + StatInfo.name(params.stat) + " drastically rose!");
    } else if (params.boost > 0) {
        this.print(this.nick(params.spot) +"'s " + StatInfo.name(params.stat) + (params.boost > 1 ? (params.boost > 2 ? " drastically " : " sharply ") : "") + " rose!");
    } else if (params.boost < 0) {
        this.print(this.nick(params.spot) +"'s " + StatInfo.name(params.stat) + (-params.boost > 1 ? (-params.boost > 2 ? " drastically " : " sharply ") : "") + " fell!");
    }
    //this.damageCause = {};
};

battledata.dealWithDynamicinfo = function(params) {
    this.pokes[params.spot].boosts = params.boosts;
    this.pokes[params.spot].fieldState = params.fieldflags;
};

battledata.dealWithStats = function(params) {
    this.pokes[params.spot].stats = params.stats;
};

battledata.dealWithStatus = function(params) {
    if (params.status === 6) {
        this.print("<span class='battle-message-confusion'>%1 became confused!</span>".replace("%1", this.nick(params.spot)));
        return;
    }
    if (params.status === 0) {
        this.trigger("statuschange", params.spot, params.status);
        return;
    }
    var status = BattleTab.statuses[params.status];
    if (!status || status == "fnt") {
        return;
    }
    if (status == "psn" && params.multiple) {
        status = "tox";
    }

    var messages = [
        "",
        "%1 is paralyzed! It may be unable to move!",
        "%1 fell asleep!",
        "%1 was frozen solid!",
        "%1 was burned!",
        "%1 was poisoned!",
        "%1 was badly poisoned!"
    ];

    this.pokes[params.spot].status = params.status;
    this.tpoke(params.spot).status = params.status;

    var message = messages[params.status + (status == "tox" ? 1 : 0)].replace("%1", this.nick(params.spot));
    this.print("<span class='battle-message-" + (status == "tox" ? "psn" : status) + "'>" + message + "</span>");

    this.trigger("statuschange", params.spot, params.status);
    //this.damageCause = {};
};

battledata.dealWithTeamstatus = function(params) {
    this.teams[params.player][params.slot].status = params.status;

    this.updateTeamPokes(params.player, [params.slot]);
};

battledata.dealWithAlreadystatus = function(params) {
    var status = BattleTab.statuses[params.status];

    this.print("<span class='battle-message-" + (status == "tox" ? "psn" : status) + "'>" + this.nick(params.spot) + " is already " + StatusInfo.name(params.status) + ".</span>");
};

battledata.dealWithFeelstatus = function(params) {
    if (params.status == 6) { //confusion
        this.print("<span class='battle-message-confusion'>" + this.nick(params.spot) + " is confused!</span>");
    } else {
        var status = BattleTab.statuses[params.status];
        if (status == "par") {
            this.print("<span class='battle-message-par'>" + this.nick(params.spot) + " is paralyzed!</span>");
        } else if (status == "slp") {
            this.print("<span class='battle-message-slp'>" + this.nick(params.spot) + " is fast asleep!</span>");
        } else if (status == "frz") {
            this.print("<span class='battle-message-frz'>" + this.nick(params.spot) + " is frozen solid!</span>");
        }
    }
};

battledata.dealWithStatusdamage = function(params) {
    if (params.status == 6) {
        this.print("<span class='battle-message-confusion'>It hurt itself in its confusion!</span>");
    } else {
        var status = BattleTab.statuses[params.status];

        if (status == "brn") {
            this.print("<span class='battle-message-brn'>" + this.nick(params.spot) + " was hurt by its burn!</span>");
        } else if (status == "psn") {
            this.print("<span class='battle-message-psn'>" + this.nick(params.spot) + " was hurt by poison!</span>");
        }
    }
    //this.damageCause.from = BattleTab.statuses[params.status];
};

battledata.dealWithFreestatus = function(params) {
    if (params.status == 6) { //confusion
        this.print("<span class='battle-message-statusover'>" + this.nick(params.spot) + " snapped out its confusion.</span>");
    } else {
        var status = BattleTab.statuses[params.status];
        if (status == "slp") {
            this.print("<span class='battle-message-statusover'>" + this.nick(params.spot) + " woke up!</span>");
        } else if (status == "frz") {
            this.print("<span class='battle-message-statusover'>" + this.nick(params.spot) + " thawed out!</span>");
        }
    }
};

battledata.dealWithFail = function(params) {
    if (!params.silent) {
        this.print("But it failed!");
    }
};

battledata.dealWithClauseactivated = function(params) {
    this.print(BattleTab.clauseTexts[params.clause]);
};

battledata.dealWithPlayerchat = function(params) {
    this.print(params.message, {"player": params.spot});
};

battledata.dealWithSpectatorjoin = function(params) {
    this.spectators[params.id] = params.name;
    this.print(params.name + " is watching the battle.");
    this.trigger("playeradd", params.id);
};

battledata.dealWithSpectatorleave = function(params) {
    this.print(this.spectators[params.id] + " stopped watching the battle.");
    delete this.spectators[params.id];

    this.trigger("playerremove", params.id);
};

battledata.dealWithSpectatorchat = function(params) {
    this.print(params.message, {"spectator": params.id});
};

battledata.dealWithNotice = function(params) {
    this.print(params.content);
};

battledata.dealWithClock = function(params) {
    this.updateClock(params.player, params.time, params.status == "ticking");
};

battledata.dealWithNotarget = function(params) {
    this.print("But there was no target...");
};

battledata.dealWithFlinch = function(params) {
    this.print(this.nick(params.spot) + " flinched and couldn't move!");
};

battledata.dealWithRecoil = function(params) {
    //this.damageCause.from = "recoil";
    this.print(this.nick(params.spot) + " is damaged by recoil!");
};

battledata.dealWithDrain = function(params) {
    //this.damageCause.from = "drain";
    //this.damageCause.of = this.spotToPlayer(params.spot);
    this.print(this.nick(params.spot) + " had its energy drained!");
};

battledata.dealWithWeatherstart = function(params) {
    var weather = BattleTab.weathers[params.weather];

    var weatherAbilityMessage = [
        "%1's Snow Warning whipped up a hailstorm!",
        "%1's Drizzle made it rain!",
        "%1's Sand Stream whipped up a sandstorm!",
        "%1's Drought intensified the sun's rays!",
        "%1's Desolate Land turned the sunlight extremely harsh!",
        "%1's Primordial Sea causes a heavy rain to fall!",
        "%1's Delta Stream stirs up a mysterious air current to protect Flying-type Pokémon!"
    ];

    var weatherRegularMessage = [
        "It started to hail!",
        "It started to rain!",
        "A sandstorm kicked up!",
        "The sunlight turned harsh!"
    ];

    if (params.permanent) {
        this.print("<span class='battle-message-" + weather + "'>" + weatherAbilityMessage[params.weather-1].replace("%1", this.nick(params.spot)) + "</span>");
    } else {
        this.print("<span class='battle-message-" + weather + "'>" + weatherRegularMessage[params.weather-1] + "</span>");
    }

    /* Hack to remove new weathers since it makes battle window crash */
    var weather = params.weather;
    if (weather > 4) {
        if (weather == 5) weather = 4;
        if (weather == 6) weather = 2;
    }
    if (weather <= 4) {
        this.trigger("weather", weather);
    }
};

battledata.dealWithFeelweather = function(params) {
    var weather = BattleTab.weathers[params.weather];

    var messages = [
        "The hail crashes down.",
        "Rain continues to fall.",
        "The sandstorm rages.",
        "The sunlight is strong.",
        "The intense sunlight continues to shine.",
        "The heavy downpour continues.",
        "A mysterious air current is protecting Flying-type Pokémon."
    ];

    this.print("<span class='battle-message-" + weather + "'>" + messages[params.weather -1] + "</span>");

    weather = params.weather;
    if (weather > 4) {
        if (weather == 5) weather = 4;
        if (weather == 6) weather = 2;
    }
    if (weather <= 4) {
        this.trigger("weather", weather);
    }
};

battledata.dealWithWeatherend = function(params) {
    var weather = BattleTab.weathers[params.weather];

    var messages = [
        "The hail stopped.",
        "The rain stopped.",
        "The sandstorm subsided.",
        "The sunlight faded.",
        "The harsh sunlight faded.",
        "The heavy rain has lifted!",
        "The mysterious air current has dissipated!"
    ];

    this.print("<span class='battle-message-" + weather + "'>" + messages[params.weather -1] + "</span>");
};

battledata.dealWithWeatherhurt = function(params) {
    //this.damageCause.from = BattleTab.weathers[params.weather];
    var weather = BattleTab.weathers[params.weather];

    var messages = [
        "%1 is buffeted by the hail!",
        undefined,
        "%1 is buffeted by the sandstorm!",
        undefined,
        undefined,
        undefined,
        undefined
    ];

    if (messages[params.weather -1]) {
        this.print("<span class='battle-message-" + weather + "'>" + messages[params.weather -1].replace("%1", this.nick(params.spot)) + "</span>");
    }
};

battledata.dealWithSubstitute = function(params) {
    this.pokes[params.spot].substitute = params.substitute;

    this.trigger("substitute", params.spot, params.substitute);
};

battledata.dealWithDamage = function(params)
{
    if (!this.isBattle(this.player(params.spot))) {
        this.print(this.nick(params.spot) + " lost " + params.damage + "% of its health!");
    } else {
        this.print(this.nick(params.spot) + " lost " + params.damage + " HP! (" +
            Math.floor(params.damage*100/this.tpoke(params.spot).totalLife) + "% of its health)!");
    }
};

battledata.dealWithTier = function(params) {
    if (this.dealtWithTier) {
        return;
    }
    this.dealtWithTier = true;

    this.print("<strong>Tier: </strong> " + params.tier);

    this.tier = params.tier;
    this.trigger("tier", params.tier);
};

battledata.dealWithRated = function(params) {
    if (this.dealtWithRated) {
        return;
    }
    this.dealtWithRated = true;

    this.print("<strong>Rule: </strong> " + (params.rated ? "Rated" : "Unrated"));

    /* Print the clauses, convert flags to actual clause numbers */
    var clauses = this.conf.clauses;
    var i = 0;

    while (clauses > 0) {
        if (clauses % 2) {
            this.print("<strong>Rule: </strong> " + BattleTab.clauses[i]);
        }
        clauses = Math.floor(clauses/2);
        i = i+1;
    }
};

battledata.dealWithChoiceselection = function(params) {
    if (this.isBattle() && this.player(params.spot) == this.myself) {
        this.choicesAvailable = true;
        this.trigger("choicesavailable");
    }
};

/* When we send a wrong choice */
battledata.dealWithChoicecancellation = function(params) {
    if (this.isBattle() && params.player == this.myself) {
        this.choicesAvailable = true;
        this.trigger("choicesavailable");
    }
};

/*
 Forfeit,
 Win,
 Tie,
 Close
 */
battledata.dealWithBattleend = function(params) {
    if (params.result == 0) {
        this.print("<strong>" + this.name(!params.winner) + " forfeited against " + this.name(params.winner) + "!</strong>");
    } else if (params.result == 1) {
        this.print("<strong>" + this.name(params.winner) + " won the battle!</strong>");
    } else if (params.result == 2) {
        this.print("<strong>Tie between " + this.name(0) + " and " + this.name(1) + "!</strong>");
    } else if (params.result == 3) {
        this.print("<strong>One of the players left the battle.</strong>");
    }
};

battledata.dealWithVariation = function(params) {
    this.print("<strong>Variation: </strong>" + params.bonus + ", " + params.malus);
};

battledata.dealWithDisconnect = function(params) {
    this.print(this.name(params.player) + " disconnected.");
};

battledata.dealWithReconnect = function(params) {
    this.print(this.name(params.player) + " reconnected.");
};

battledata.dealWithItemmessage = function(params) {
    /* Item like Potion used on a pokemon we haven't seen */
    if (this.pokes[params.foe].num == 0 || this.pokes[params.spot].num == 0) {
        return;
    }
    var mess = ItemInfo.message(params.item, params.part);
    if (!mess) {
        return;
    }
    if (mess.contains("%st")) mess = mess.replace("%st", StatInfo.name(params.other, this.conf.gen));
    if (mess.contains("%s")) mess = mess.replace("%s", this.nick(params.spot));
    if (mess.contains("%f")) mess = mess.replace("%f", this.nick(params.foe));
    if (mess.contains("%i")) mess = mess.replace("%i", ItemInfo.name(params.berry));
    if (mess.contains("%m")) mess = mess.replace("%m", MoveInfo.name(params.other));
    if (mess.contains("%p")) mess = mess.replace("%p", PokeInfo.name(params.other));

    /* Balloon gets a really special treatment */
    if (params.item == 35)
        this.print("<strong>" + mess + "</strong>");
    else
        this.print(mess);
};

battledata.dealWithMovemessage = function(params) {
    var mess = MoveInfo.message(params.move, params.part);
    if (!mess) {
        return;
    }
    if (mess.contains("%s")) mess = mess.replace("%s", this.nick(params.spot));
    if (mess.contains("%ts")) mess = mess.replace("%ts", this.name(params.spot));
    if (mess.contains("%tf")) mess = mess.replace("%tf", this.name(1-params.spot));
    if (mess.contains("%t")) mess = mess.replace("%t", TypeInfo.name(params.type));
    if (mess.contains("%f")) mess = mess.replace("%f", this.nick(params.foe));
    if (mess.contains("%m")) mess = mess.replace("%m", MoveInfo.name(params.other));
    if (mess.contains("%d")) mess = mess.replace("%d", params.other);
    if (mess.contains("%q")) mess = mess.replace("%q", params.data);
    if (mess.contains("%i")) mess = mess.replace("%i", ItemInfo.name(params.other));
    if (mess.contains("%a")) mess = mess.replace("%a", AbilityInfo.name(params.other));
    if (mess.contains("%p")) mess = mess.replace("%p", PokeInfo.name(params.other));

    this.print("<span class='battle-message-" + TypeInfo.name(params.type).toLowerCase() + "'>" + mess + "</span>");
};

battledata.dealWithAbilitymessage = function(params) {
    var mess = AbilityInfo.message(params.ability, params.part);
    if (!mess) {
        return;
    }
    if (mess.contains("%st")) mess = mess.replace("%st", StatInfo.name(params.other, this.conf.gen));
    if (mess.contains("%s")) mess = mess.replace("%s", this.nick(params.spot));
    //            mess.replace("%ts", data()->name(spot));
    if (mess.contains("%tf")) mess = mess.replace("%tf", this.name(!params.spot));
    if (mess.contains("%t")) mess = mess.replace("%t", TypeInfo.name(params.type));
    if (mess.contains("%f")) mess = mess.replace("%f", this.nick(params.foe));
    if (mess.contains("%m")) mess = mess.replace("%m", MoveInfo.name(params.other));
    //            mess.replace("%d", QString::number(other));
    if (mess.contains("%i")) mess = mess.replace("%i", ItemInfo.name(params.other));
    if (mess.contains("%a")) mess = mess.replace("%a", AbilityInfo.name(params.other));
    if (mess.contains("%p")) mess = mess.replace("%p", PokeInfo.name(params.other));

    /* if (type == 0) {
        printLine("AbilityMessage", escapeHtml(tu(mess)));
    } else {
        printHtml("AbilityMessage", toColor(escapeHtml(tu(mess)),theme()->typeColor(type)));
    } */

    if (params.type != 0) {
        this.print("<span class='battle-message-" + TypeInfo.name(params.type).toLowerCase() + "'>" + mess + "</span>");
    } else {
        this.print(mess);
    }
};
