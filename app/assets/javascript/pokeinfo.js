var pokedex = {};

geninfo = {};
pokeinfo = {};
genderinfo = {};
natureinfo = {};
moveinfo = {};
categoryinfo = {};
statinfo = {};
statusinfo = {};
iteminfo = {};
typeinfo = {};
abilityinfo = {};
lastgen = null;

$(function () {
    var i;
    for (var i in pokedex.generations.generations) {
        lastgen = {num: +i};
    }
});

var getGen = function(gen, correct) {
    var shouldCorrect = correct !== false;
    if (shouldCorrect) {
        gen = gen || lastgen;
        if (typeof gen === "object") {
            if ("num" in gen) {
                gen.num = +gen.num;
            }
        } else {
            gen = +gen;
        }
    }

    if (typeof gen !== "object") {
        gen = {"num": gen};
    }

    if (shouldCorrect) {
        if ("num" in gen) {
            gen.num = +gen.num;
        }

        if (isNaN(gen.num) || gen.num < 1 || gen.num > lastgen.num) {
            gen = lastgen;
        }
    }

    return gen;
};

geninfo.getGen = getGen;
geninfo.list = function () {
    return pokedex.generations.generations;
};

geninfo.name = function (gen) {
    var num = getGen(gen, false).num;
    return pokedex.generations.generations[num];
};

geninfo.options = function () {
    return pokedex.generations.options;
};

geninfo.option = function (gen) {
    return pokedex.generations.options[getGen(gen, false).num];
};

geninfo.hasOption = function (gen, option) {
    return !!geninfo.option(gen)[option];
};

pokeinfo.toNum = function (poke) {
    if (typeof poke == "object") {
        return poke.num + ( (poke.forme || 0) << 16);
    }

    return poke;
};

pokeinfo.toObject = function(poke) {
    if (typeof poke == "object") {
        return poke;
    }

    poke = +poke;

    return {num: pokeinfo.species(poke), forme: pokeinfo.forme(poke), gen: lastgen};
};

pokeinfo.toArray = function (num) {
    var pokenum = 0,
        formenum = 0,
        poke;

    if (typeof num === 'number') {
        poke = ["" + num];
    } else if (typeof num === 'string') {
        poke = num.split("-");
    } else if (Array.isArray(num)) {
        poke = num;
    }

    if (poke.length === 1) {
        pokenum = pokeinfo.species(+poke[0]);
        formenum = pokeinfo.forme(+poke[0]);
    } else if (poke.length === 2) {
        pokenum = pokeinfo.species(+poke[0]);
        formenum = pokeinfo.species(+poke[1]);
    }

    if (isNaN(pokenum)) {
        pokenum = 0;
    }
    if (isNaN(formenum)) {
        formenum = 0;
    }

    return [pokenum, formenum];
};

pokeinfo.species = function(poke) {
    return poke & ((1 << 16) - 1);
};

pokeinfo.forme = function(poke) {
    return poke >> 16;
};

pokeinfo.find = function(id, what, gen) {
    gen = getGen(gen);
    id = this.toNum(id);

    var gennum = gen.num;
    var array = pokedex.pokes[what][gennum];

    // ability3 in < gen 5
    if (!array) {
        return 0;
    }

    if (id in array) {
        return array[id];
    }

    var ornum = this.species(id);

    if (ornum in array) {
        return array[ornum];
    }

    while (gennum < lastgen.num && ! (id in array) && !(ornum in array)) {
        array = pokedex.pokes[what][++gennum];
    }

    if (!(id in array)) {
        id = ornum;
    } else {
        /* expand */
        if (gennum != gen.num) {
            pokedex.pokes[what][gen.num][id] = array[id];
        }
    }

    return array[id];
};

pokeinfo.trainerSprite = function (num) {
    return 'http://pokemon-online.eu/images/trainers/' + num + '.png';
};

pokeinfo.heldItemSprite = function () {
    return 'http://pokemon-online.eu/images/items/helditem.png';
};

pokeinfo.genderSprite = function(num) {
    return 'http://pokemon-online.eu/images/genders/ingame_gender' + num + '.png';
};

pokeinfo.sprite = function(poke, params) {
    params = params || {};
    poke = pokeinfo.toObject(poke);
    var gen = getGen(params.gen || poke.gen);
    var back = params.back || false;

    // Use last gen when dealing with missingno.
    if (poke.num === 0) {
        return pokedex.generations.options[lastgen.num].sprite_folder + "0.png";
    }

    return pokedex.generations.options[gen.num].sprite_folder + (gen.num >= 5 ? "animated/" : "" ) + (back ? "back/" : "")
        + (poke.shiny ? "shiny/" : "") + (poke.female && gen.num !== 6 ? "female/" : "")
        + (gen.num >= 5 ? ("00"+poke.num).slice(-3) : poke.num ) + (poke.forme ? "-" + poke.forme : "")
        + (gen.num >= 5 ? ".gif" : ".png");
};

pokeinfo.battlesprite = function(poke, params) {
    params = params || {};

    var back = params.back || false;
    var data = pokeinfo.spriteData(poke, params);

    return pokedex.generations.options[lastgen.num].sprite_folder + ( (data.ext || "gif") == "gif" ? "animated/" : "" ) + (back ? "back/" : "")
        + (poke.shiny ? "shiny/" : "") + (poke.female ? "female/" : "")
        + ((data.ext || "gif") == "gif" ? ("00"+poke.num).slice(-3) : poke.num ) + (poke.forme && !data.noforme ? "-" + poke.forme : "")
        + ("." + (data.ext || "gif"));
};

pokeinfo.spriteData = function(poke, params) {
    var back = (params || {}).back || false;
    var num = this.toNum(poke);

    var ret = (back ? pokedex.pokes.images.back[num] : pokedex.pokes.images[num]);
    if (!ret) {
        ret = (back ? pokedex.pokes.images.back[num%65356] : pokedex.pokes.images[num%65356]) || {"w":96,"h":96};
        ret.noforme = true;
    }
    return ret;
};

pokeinfo.icon = function(poke) {
    var poke = this.toObject(poke);
    return "http://pokemon-online.eu/images/poke_icons/" + poke.num + (poke.forme ? "-" + poke.forme : "") + ".png";
};

pokeinfo.name = function(poke) {
    return pokedex.pokes.pokemons[this.toNum(poke)];
};

pokeinfo.num = function(name) {
    return pokedex.pokes.nums[name.toLowerCase()];
};

pokeinfo.gender = function(poke) {
    var pokeNum = this.toNum(poke);
    if (! (pokeNum in pokedex.pokes.gender)) {
        pokeNum %= 65536;
    }
    return pokedex.pokes.gender[pokeNum];
};

pokeinfo.height = function(poke) {
    var pokeNum = this.toNum(poke);
    if (! (pokeNum in pokedex.pokes.height)) {
        pokeNum %= 65536;
    }
    return pokedex.pokes.height[pokeNum];
};

pokeinfo.weight = function(poke) {
    var pokeNum = this.toNum(poke);
    if (! (pokeNum in pokedex.pokes.weight)) {
        pokeNum %= 65536;
    }
    return pokedex.pokes.weight[pokeNum];
};

pokeinfo.heldItem = function (poke) {
    return pokedex.pokes.items[this.toNum(poke)];
};

pokeinfo.stats = function(poke, gen) {
    return this.find(poke, "stats", gen);
};

pokeinfo.stat = function(poke, stat, gen) {
    return this.stats(poke, gen)[stat];
};

pokeinfo.allMoves = function(poke, gen) {
    var moves = this.find(poke, "all_moves", gen);
    if (!Array.isArray(moves)) {
        moves = [moves];
    }
    return moves;
};

pokeinfo.types = function(poke, gen) {
    var type1 = this.find(poke, "type1", gen);
    var type2 = this.find(poke, "type2", gen);
    var types = [type1];
    if (type2 != 18) {
        types.push(type2);
    }
    return types;
};

pokeinfo.abilities = function(poke, gen) {
    return [
        this.find(poke, "ability1", gen) || 0,
        this.find(poke, "ability2", gen) || 0,
        this.find(poke, "ability3", gen) || 0
    ];
};

pokeinfo._releasedCache = {};
pokeinfo.releasedList = function(gen, excludeFormes) {
    var gnum = getGen(gen).num;
    if ((gnum + '_ef' + excludeFormes) in pokeinfo._releasedCache) {
        return pokeinfo._releasedCache[gnum + '_ef' + excludeFormes];
    }

    var releasedList = pokedex.pokes.released[gnum],
        list = {},
        num;

    for (i in releasedList) {
        if (excludeFormes && +i > 65535) {
            continue;
        }

        // In gens 1-3, the values are true instead of the pokemon names.
        if (releasedList[i] === true) {
            list[i] = pokeinfo.name(+i);
        } else {
            list[i] = releasedList[i];
        }
    }

    pokeinfo._releasedCache[gnum + '_ef' + excludeFormes] = list;
    return list;
};

pokeinfo.excludeFormes = true;

pokeinfo.released = function(poke, gen) {
    return pokedex.pokes.released[getGen(gen).num].hasOwnProperty(this.toNum(poke));
};

pokeinfo.calculateStatInfo = function(info, stat, gen) {
    var gen = gen || lastgen;
    var base_stat = pokeinfo.stat(info, stat, gen);
    
    if (stat === 0) { // HP
        if (gen.num > 2) {
            return Math.floor(Math.floor((info.iv + (2 * base_stat) + Math.floor(info.ev/4) + 100) * info.level)/100) + 10;
        } else {
            return Math.floor(((info.iv + base_stat + Math.sqrt(65535)/8 + 50) * info.level)/50 + 10);
        }
    } else {
        if (gen.num > 2) {
            var natureBoost = info.natureBoost;
            return Math.floor(Math.floor(((info.iv + (2 * base_stat) + Math.floor(info.ev/4)) * info.level)/100 + 5)*natureBoost);
        } else {
            return Math.floor(Math.floor((info.iv + base_stat + Math.sqrt(65535)/8) * info.level)/50 + 5);
        }
    }
}

pokeinfo.calculateStat = function(poke, stat, gen) {
    var gen = gen || lastgen;
    if (poke.num == 292 && stat == 0) {
        return 1;
    }
    return pokeinfo.calculateStatInfo({"num": poke.num, "forme": poke.forme || 0, "iv": poke.ivs[stat], "ev": poke.evs[stat],
            "level": poke.level, "natureBoost": natureinfo.getNatureEffect(poke.nature, stat)}, stat, gen);
};

pokeinfo.minStat = function(poke, stat, gen) {
    var gen = gen || lastgen;
    var ret = pokeinfo.calculateStatInfo({"num": poke.num, "forme": poke.forme || 0, "iv": 31, "ev": 0,
            "level": poke.level, "natureBoost": 1}, stat, gen);
    var boost = poke.boost || 0;
    return Math.floor(ret * Math.max(2, 2+boost) / Math.max(2, 2-boost));
}

pokeinfo.maxStat = function(poke, stat, gen) {
    var gen = gen || lastgen;
    var ret = pokeinfo.calculateStatInfo({"num": poke.num, "forme": poke.forme || 0, "iv": 31, "ev": 252,
            "level": poke.level, "natureBoost": 1.1}, stat, gen);
    var boost = poke.boost || 0;
    return Math.floor(ret * Math.max(2, 2+boost) / Math.max(2, 2-boost));
}

genderinfo.name = function(gender) {
    return {1: 'male', 2: 'female', 3: 'neutral'}[gender];
};

genderinfo.shorthand = function(gender) {
    return {1: '(M)', 2: '(F)', 3: '', 0: ''}[gender];
};

natureinfo.list = function() {
    return pokedex.natures.nature;
};

natureinfo.name = function(nature) {
    return pokedex.natures.nature[nature];
};

natureinfo.num = function(nature) {
    if (!pokedex.natures.nums) {
        pokedex.natures.nums = {};
        for (var i = 0; i < 25; i++) {
            pokedex.natures.nums[natureinfo.name(i).toLowerCase()] = i;
        }
    }
    return pokedex.natures.nums[nature.toLowerCase()];
};

natureinfo.getNatureEffect = function(nature_id, stat_id) {
    var arr = {0:0, 1:1, 2:2, 3:4, 4:5, 5:3};
    return (10+(-(nature_id%5 == arr[stat_id]-1) + (Math.floor(nature_id/5) == arr[stat_id]-1)))/10;
};

natureinfo.boostedStat = function(nature_id) {
    for (var i = 0; i < 6; i++) {
        if (natureinfo.getNatureEffect(nature_id, i) > 1) {
            return i;
        }
    }
    return -1;
};

natureinfo.reducedStat = function(nature_id) {
    for (var i = 0; i < 6; i++) {
        if (natureinfo.getNatureEffect(nature_id, i) < 1) {
            return i;
        }
    }
    return -1;
};

moveinfo.list = function() {
    return pokedex.moves.moves;
};

moveinfo.hasMove = function (move) {
    return move in pokedex.moves.moves;
};

moveinfo.name = function(move) {
    return pokedex.moves.moves[move];
};

moveinfo.num = function(move) {
    if (!pokedex.moves.nums) {
        pokedex.moves.nums = {};
        for (var num in moveinfo.list()) {
            pokedex.moves.nums[moveinfo.name(num).toLowerCase()] = num;
        }
    }
    return pokedex.moves.nums[move.toLowerCase()];
};

moveinfo.findId = function (move) {
    var list = pokedex.moves.moves,
        moveNum, moveName;

    for (moveNum in list) {
        moveName = list[moveNum];

        if (move === moveName) {
            return +moveNum;
        }
    }

    return 0;
};

moveinfo.find = function(id, what, gen) {
    gen = getGen(gen);

    if (! (what in pokedex.moves)) {
        return "";
    }

    var gennum = gen.num;
    var array = pokedex.moves[what][gennum];

    if (id in array) {
        return array[id];
    }

    while (gennum < lastgen.num && ! (id in array)) {
        array = pokedex.moves[what][++gennum];
    }

    /* expand */
    if (gennum != gen.num && id in array) {
        pokedex.moves[what][gen.num][id] = array[id];
    }

    return array[id];
};

moveinfo.accuracy = function(move, gen) {
    return this.find(move, "accuracy", gen) || 0;
};

moveinfo.category = function(move, gen) {
    return this.find(move, "damage_class", gen) || 0;
};

moveinfo.effect = function(move, gen) {
    return this.find(move, "effect", gen) || "";
};

moveinfo.power = function(move, gen) {
    return this.find(move, "power", gen) || 0;
};

moveinfo.pp = function(move, gen) {
    return this.find(move, "pp", gen);
};

moveinfo.type = function(move, gen) {
    return this.find(move, "type", gen) || 0;
};

moveinfo.message = function(move, part) {
    var messages = pokedex.moves.move_message[move];

    if (!messages) {
        return '';
    }

    var parts = messages.split('|');
    if (part >= 0 && part < parts.length) {
        return parts[part];
    }

    return '';
};

moveinfo.getHiddenPowerIVs = function (type, generation) {
    generation = getGen(generation).num;
    var ret = [],
        gt;

    for (var i = 63; i >= 0; i--) {
        gt = moveinfo.getHiddenPowerType(generation, [i & 1, (i & 2) !== 0, (i & 4) !== 0, (i & 8) !== 0, (i & 16) !== 0, (i & 32) !== 0]);
        if (gt == type) {
            ret.push([(((i & 1) !== 0) + 30), (((i & 2) !== 0) + 30), (((i & 4) !== 0) + 30), (((i & 8) !== 0) + 30), (((i & 16) !== 0) + 30), (((i & 32) !== 0) + 30)]);
        }
    }

    return ret;
};

moveinfo.getHiddenPowerType = function (generation, ivs) {
    generation = getGen(generation).num;
    var type;
    var hp_ivs, atk_ivs, def_ivs, satk_ivs, sdef_ivs, spe_ivs;
    hp_ivs = ivs[0];
    atk_ivs = ivs[1]; def_ivs = ivs[2];
    satk_ivs = ivs[3]; sdef_ivs = ivs[4];
    spe_ivs = ivs[5];

    if (generation >= 3) {
        type = ((((hp_ivs % 2) + (2 * (atk_ivs % 2)) + (4 * (def_ivs % 2)) + (8 * (spe_ivs % 2)) + (16 * (satk_ivs % 2)) + (32 * (sdef_ivs % 2))) * 15) / 63) + 1;
    } else {
        type = 4 * (atk_ivs % 4) + (def_ivs % 4);
    }

    return parseInt(type, 10);
};

moveinfo.getHiddenPowerBP = function (generation, hp_ivs, atk_ivs, def_ivs, satk_ivs, sdef_ivs, spe_ivs) {
    generation = getGen(generation).num;
    var hpbp = geninfo.option(generation).hidden_power_bp, bp;
    if (!hpbp) {
        if (generation >= 3 && generation <= 5) {
            bp = Math.floor(((hp_ivs % 2 + (2 * (atk_ivs % 2)) + (4 * (def_ivs % 2)) + (8 * (spe_ivs % 2)) + (16 * (satk_ivs % 2)) + (32 * (sdef_ivs % 2))) * 40) / 63) + 30;
        } else if (generation >= 6) {
            bp = 60;
        } else {
            bp = Math.floor(((5 * ((satk_ivs % 8 ? 1 : 0) + (2 * (spe_ivs % 8 ? 1 : 0)) + (4 * (def_ivs % 8 ? 1 : 0)) + (8 * (atk_ivs % 8 ? 1 : 0))) + (satk_ivs < 3 ? satk_ivs : 3)) / 2) + 31);
        }
    } else {
        bp = hpbp;
    }

    return bp;
};

categoryinfo.list = function() {
    return pokedex.categories.categories;
};

categoryinfo.name = function(category) {
    return pokedex.categories.categories[category];
};

iteminfo.list = function() {
    var list = pokedex.items.items;
    for (var i in pokedex.items.berries) {
        list[i + 8000] = pokedex.items.berries[i];
    }
    return list;
};

iteminfo.hasItem = function(item) {
    if (item >= 8000) {
        return (item-8000) in pokedex.items.berries;
    } else {
        return item in pokedex.items.items;
    }
};

iteminfo.name = function(item) {
    if (item >= 8000) {
        return pokedex.items.berries[item-8000];
    } else {
        return pokedex.items.items[item];
    }
};

iteminfo.num = function(name) {
    return pokedex.items.nums[name.toLowerCase()];
};

iteminfo.berryName = function (item) {
    return pokedex.items.berries[item];
};

iteminfo._releasedCache = {};
iteminfo.releasedList = function(gen) {
    var gnum = getGen(gen).num;
    if (gnum in iteminfo._releasedCache) {
        return iteminfo._releasedCache[gnum];
    }

    var list = {},
        releasedItems = pokedex.items.released_items[gnum],
        releasedBerries = pokedex.items.released_berries[gnum],
        i;

    // Inline access for speed
    for (i in releasedItems) {
        list[i] = pokedex.items.items[i];
    }

    for (i in releasedBerries) {
        list[i + 8000] = pokedex.items.berries[i];
    }

    iteminfo._releasedCache[gnum] = list;
    return list;
};

iteminfo.released = function (item, gen) {
    gen = getGen(gen).num;
    if (item >= 8000) {
        return pokedex.items.released_berries[gen].hasOwnProperty(item-8000);
    } else {
        return pokedex.items.released_items[gen].hasOwnProperty(item);
    }
};

iteminfo.usefulList = function() {
    return pokedex.items.item_useful;
};

iteminfo.useful = function(item) {
    return pokedex.items.item_useful.hasOwnProperty(item);
};

iteminfo.message = function(item, part) {
    var messages = (item >= 8000 ? pokedex.items.berry_messages[item-8000] : pokedex.items.item_messages[item]);

    if (!messages) {
        return '';
    }

    var parts = messages.split('|');
    if (part >= 0 && part < parts.length) {
        return parts[part];
    }

    return '';
};

iteminfo.desc = function(item) {
    if (item >= 8000) {
        return pokedex.items.berries_description[+item-8000] || "";
    } else {
        return pokedex.items.items_description[item] || "";
    }
}

iteminfo.itemSprite = function(item) {
    if (+item >= 8000) {
        return 'http://pokemon-online.eu/images/berries/' + (item-8000) + '.png';
    } else {
        return 'http://pokemon-online.eu/images/items/' + item + '.png';
    }
};

statinfo.list = function() {
    return pokedex.status.stats;
};

statinfo.name = function(stat) {
    return pokedex.status.stats[stat];
};

statusinfo.list = function() {
    return pokedex.status.status;
};

statusinfo.name = function(status) {
    return pokedex.status.status[status];
};

typeinfo.list = function() {
    return pokedex.types.types;
};

typeinfo.name = function(type) {
    return pokedex.types.types[type];
};

typeinfo.css = function(type) {
    if (type == 18) {
        return "curse";
    }
    return pokedex.types.types[type].toLowerCase();
};

typeinfo.categoryList = function() {
    return pokedex.types.category;
};

typeinfo.category = function(type) {
    return pokedex.types.category[type];
};

typeinfo.sprite = function(type) {
    return 'http://pokemon-online.eu/images/types/' + type + '.png';
};

abilityinfo.list = function() {
    return pokedex.abilities.abilities;
};

abilityinfo.name = function(ability) {
    return pokedex.abilities.abilities[ability];
};

abilityinfo.num = function(ability) {
    if (!pokedex.abilities.nums) {
        pokedex.abilities.nums = {};
        for (var num in pokedex.abilities.abilities) {
            pokedex.abilities.nums[pokedex.abilities.abilities[num].toLowerCase()] = num;
        }
    }
    return pokedex.abilities.nums[ability.toLowerCase()];
};

abilityinfo.desc = function(ability) {
    return pokedex.abilities.ability_desc[ability] || "";
};

abilityinfo.message = function(ability, part) {
    var messages = pokedex.abilities.ability_messages[ability];
    part = part || 0;

    if (!messages) {
        return '';
    }

    var parts = messages.split('|');
    if (part >= 0 && part < parts.length) {
        return parts[part];
    }

    return '';
};
