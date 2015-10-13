

/* dealWithXxxx functions are all called from dealWithCommand */
battledata.dealWithTurn = function(params) {
    this.print("<h2>Turn " + params.turn + "</h2>", {"css": "turn"});
};

battledata.dealWithBlank = function(params) {
    this.print("");
};

battledata.dealWithSend = function(params) {
    var poke = params.pokemon;
    var sl = this.slot(params.spot);

    console.log("send");
    console.log(params);

    if (this.isBattle() && this.player(params.spot) == this.myself) {
        console.log(this.teams[this.myself][params.slot]);
        poke = $.extend({}, this.teams[this.myself][params.slot], poke);
        console.log(this.teams[this.myself][params.slot]);
    }
    /* Stores the pokemon in field memory */
    this.pokes[params.spot] = poke;

    /* switch in memory */
    var pl = this.player(params.spot);
    this.teams[pl][params.slot] = this.teams[pl][sl];
    this.teams[pl][sl] = poke;

    //this.animator.on("send", params.spot);

    this.updateFieldPoke(params.spot);
    this.updateTeamPokes(pl, [this.slot(params.spot), params.slot]);

    if (pokeinfo.name(poke) == poke.name) {
        this.print(this.name(pl) + " sent out " + poke.name + "!");
    } else {
        this.print(this.name(pl) + " sent out " + poke.name + "! (" + pokeinfo.name(poke) + ")");
    }
};

battledata.dealWithSendback = function(params) {
    var poke = this.pokes[params.spot];
    var pl = this.player(params.spot);

    //this.animator.on("sendback", params.spot);

    if (!params.silent) {
        this.print(this.name(pl) + " called " + poke.name + " back!");
    }
};

battledata.dealWithTeampreview = function(params) {
    var team = params.team;
    var player = params.player;

/*    for (var i = 0; i < team.length; i++) {
        this.addCommand(["poke", this.spotToPlayer(player), this.pokemonToPS(team[i])]);
    }*/

    /* triggers the display */
//    this.addCommand(["teampreview"]);

    /* triggers the choice */
    //this.teamPreview = true;
};

battledata.dealWithPpchange = function(params) {
    this.teams[Math.floor(params.spot/2)].moves[params.move].pp = params.pp;
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
};

battledata.dealWithMove = function(params) {
    this.print(this.nick(params.spot) + " used <strong>" + moveinfo.name(params.move) + "</strong>!");

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
};

battledata.dealWithHitcount = function(params) {
    this.print("Hit " + params.count + " time(s)!");
};

battledata.dealWithEffectiveness = function(params) {
    if (params.effectiveness > 4) {
        this.print("It's super effective!");
    } else if (params.effectiveness < 4 && params.effectiveness > 0) {
        this.print("It's not very effective...");
    } else if (params.effectiveness == 0) {
        this.print("It had no effect on " + this.nick(params.spot) + "!");
    }
};

battledata.dealWithCritical = function(params) {
    this.print("A critical hit!");
};

battledata.dealWithMiss = function(params) {
    this.print("The attack of "+ this.nick(params.spot) +" missed!");
};

battledata.dealWithAvoid = function(params) {
    this.print(this.nick(params.spot) +" avoided the attack!");
};

battledata.dealWithBoost = function(params) {
    if (params.boost > 6) {
        this.print(this.nick(params.spot) +"'s " + statinfo.name(params.stat) + " drastically rose!");
    } else if (params.boost > 0) {
        this.print(this.nick(params.spot) +"'s " + statinfo.name(params.stat) + (params.boost > 1 ? (params.boost > 2 ? " drastically " : " sharply ") : "") + " rose!");
    } else if (params.boost < 0) {
        this.print(this.nick(params.spot) +"'s " + statinfo.name(params.stat) + (-params.boost > 1 ? (-params.boost > 2 ? " drastically " : " sharply ") : "") + " fell!");
    }
    //this.damageCause = {};
};

battledata.dealWithStatus = function(params) {
    if (params.status == 6) {
        this.print("%1 became confused!".replace("%1", this.nick(params.spot)));
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

    this.print(messages[params.status].replace("%1", this.nick(params.spot)));

    //this.damageCause = {};
};

battledata.dealWithTeamstatus = function(params) {
    this.teams[params.player][params.slot].status = params.status;

    this.updateTeamPokes(params.player, [params.slot]);
};

battledata.dealWithAlreadystatus = function(params) {
    this.print(this.nick(params.spot) + " is already " + statusinfo.name(params.status));
};

battledata.dealWithFeelstatus = function(params) {
    if (params.status == 6) { //confusion
        this.print(this.nick(params.spot) + " is confused!");
    } else {
        var status = BattleTab.statuses[params.status];
        if (status == "par") {
            this.print(this.nick(params.spot) + " is paralyzed!");
        } else if (status == "slp") {
            this.print(this.nick(params.spot) + " is fast asleep!");
        } else if (status == "frz") {
            this.print(this.nick(params.spot) + " is frozen solid!");
        }
    }
};

battledata.dealWithStatusdamage = function(params) {
    if (params.status == 6) {
        this.print("It hurt itself in its confusion!");
    } else {
        var status = BattleTab.statuses[params.status]

        if (status == "brn") {
            this.print(this.nick(params.spot) + " was hurt by its burn!");
        } else if (status == "psn") {
            this.print(this.nick(params.spot) + " was hurt by poison!");
        }
    }
    //this.damageCause.from = BattleTab.statuses[params.status];
};

battledata.dealWithFreestatus = function(params) {
    if (params.status == 6) { //confusion
        this.print(this.nick(params.spot) + " snapped out its confusion.");
    } else {
        var status = BattleTab.statuses[params.status];
        if (status == "slp") {
            this.print(this.nick(params.spot) + " woke up!");
        } else if (status == "frz") {
            this.print(this.nick(params.spot) + " thawed out!");
        }
    }
};

battledata.dealWithFail = function(params) {
    if (!params.silent) {
        this.print("But it failed!");
    }
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

battledata.dealWithClock = function(params) {
    this.updateClock(params.player, params.time, params.status == "ticking")
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
    //QColor c = theme()->typeColor(TypeInfo::TypeForWeather(weather));

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
        this.print(weatherAbilityMessage[params.weather-1].replace("%1", this.nick(params.spot)));
    } else {
        this.print(weatherRegularMessage[params.weather-1]);
    }
};

battledata.dealWithFeelweather = function(params) {
    var messages = [
        "The hail crashes down.",
        "Rain continues to fall.",
        "The sandstorm rages.",
        "The sunlight is strong."
    ];

    this.print(messages[params.weather -1]);
};

battledata.dealWithWeatherend = function(params) {
    var messages = [
        "The hail stopped.",
        "The rain stopped.",
        "The sandstorm subsided.",
        "The sunlight faded."
    ];

    this.print(messages[params.weather -1]);
};

battledata.dealWithWeatherhurt = function(params) {
    //this.damageCause.from = BattleTab.weathers[params.weather];
    var messages = [
        "%1 is buffeted by the hail!",
        undefined,
        "%1 is buffeted by the sandstorm!",
        undefined
    ];
    if (messages[params.weather -1]) {
        this.print(messages[params.weather -1].replace("%1", this.nick(params.spot)));
    }
};

battledata.dealWithSubstitute = function(params) {
    if (params.substitue) {

    } else {

    }
};

battledata.dealWithDamage = function(params)
{
    if (!this.isBattle() || this.player(params.spot) != this.myself) {
        this.print(this.nick(params.spot) + " lost " + params.damage + "% of its health!");
    } else {
        this.print(this.nick(params.spot) + " lost " + params.damage + " HP! (" +
            Math.floor(params.damage*100/this.tpoke(params.spot).totalLife) + "% of its health)!");
    }
};

battledata.dealWithTier = function(params) {
    this.print("<strong>Tier: </strong> " + params.tier);

    this.tier = params.tier;
    this.trigger("tier", params.tier);
};

battledata.dealWithRated = function(params) {
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
        console.log("Choices availabled");
        this.trigger("choicesavailable");
    }
};

/* When we send a wrong choice */
battledata.dealWithChoicecancellation = function(params) {
    if (params.player == this.myself) {
        this.choicesAvailable = true;
        console.log("Choices availabled");
        this.trigger("choicesavailable");
    }
}

/*
 Forfeit,
 Win,
 Tie,
 Close
 */
battledata.dealWithBattleend = function(params) {
    if (params.result == 0) {
        this.print("<strong>" + this.name(!params.winner) + " forfeited against " + this.name(params.winner) + "</strong>");
    } else if (params.result == 1) {
        this.print("<strong>" + this.name(params.winner) + " won the battle!</strong>");
    } else if (params.result == 2) {
        this.print("<strong>Tie between " + this.name(0) + " and " + this.name(1) + "!</strong>");
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
    var mess = iteminfo.message(params.item, params.part);
    if (!mess) {
        return;
    }
    if (mess.contains("%st")) mess = mess.replace("%st", statinfo.name(params.other, this.conf.gen));
    if (mess.contains("%s")) mess = mess.replace("%s", this.nick(params.spot));
    if (mess.contains("%f")) mess = mess.replace("%f", this.nick(params.foe));
    if (mess.contains("%i")) mess = mess.replace("%i", iteminfo.name(params.berry));
    if (mess.contains("%m")) mess = mess.replace("%m", moveinfo.name(params.other));
    if (mess.contains("%p")) mess = mess.replace("%p", pokeinfo.name(params.other));

    /* Balloon gets a really special treatment */
    if (params.item == 35)
        this.print("<strong>" + mess + "</strong>");
    else
        this.print(mess);
};

battledata.dealWithMovemessage = function(params) {
    var mess = moveinfo.message(params.move, params.part);
    if (!mess) {
        return;
    }
    if (mess.contains("%s")) mess = mess.replace("%s", this.nick(params.spot));
    if (mess.contains("%ts")) mess = mess.replace("%ts", this.name(params.spot));
    if (mess.contains("%tf")) mess = mess.replace("%tf", this.name(1-params.spot));
    if (mess.contains("%t")) mess = mess.replace("%t", typeinfo.name(params.type));
    if (mess.contains("%f")) mess = mess.replace("%f", this.nick(params.foe));
    if (mess.contains("%m")) mess = mess.replace("%m", moveinfo.name(params.other));
    if (mess.contains("%d")) mess = mess.replace("%d", params.other);
    if (mess.contains("%q")) mess = mess.replace("%q", params.data);
    if (mess.contains("%i")) mess = mess.replace("%i", iteminfo.name(params.other));
    if (mess.contains("%a")) mess = mess.replace("%a", abilityinfo.name(params.other));
    if (mess.contains("%p")) mess = mess.replace("%p", pokeinfo.name(params.other));
    this.print(mess);
};

battledata.dealWithAbilitymessage = function(params) {
    var mess = abilityinfo.message(params.ability, params.part);
    if (!mess) {
        return;
    }
    if (mess.contains("%st")) mess = mess.replace("%st", statinfo.name(params.other, this.conf.gen));
    if (mess.contains("%s")) mess = mess.replace("%s", this.nick(params.spot));
    //            mess.replace("%ts", data()->name(spot));
    if (mess.contains("%tf")) mess = mess.replace("%tf", this.name(!params.spot));
    if (mess.contains("%t")) mess = mess.replace("%t", typeinfo.name(params.type));
    if (mess.contains("%f")) mess = mess.replace("%f", this.nick(params.foe));
    if (mess.contains("%m")) mess = mess.replace("%m", moveinfo.name(params.other));
    //            mess.replace("%d", QString::number(other));
    if (mess.contains("%i")) mess = mess.replace("%i", iteminfo.name(params.other));
    if (mess.contains("%a")) mess = mess.replace("%a", abilityinfo.name(params.other));
    if (mess.contains("%p")) mess = mess.replace("%p", pokeinfo.name(params.other));

    /* if (type == 0) {
        printLine("AbilityMessage", escapeHtml(tu(mess)));
    } else {
        printHtml("AbilityMessage", toColor(escapeHtml(tu(mess)),theme()->typeColor(type)));
    } */
    this.print(mess);
};
