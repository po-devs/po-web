var pokedex = {};

GenInfo = {};
PokeInfo = {};
GenderInfo = {};
NatureInfo = {};
MoveInfo = {};
CategoryInfo = {};
StatInfo = {};
StatusInfo = {};
ItemInfo = {};
TypeInfo = {};
AbilityInfo = {};
lastGen = null;

$(function() {
    var maxGen = {num: 0, subnum: 0};
    for (var i in pokedex.gens.versions) {
        var num = (+i) & ((1 << 16)-1);
        var subnum = (+i) >> 16;
        if (num >= maxGen.num) {
            maxGen.num = num;
            maxGen.subnum = subnum;
        }
    }
    lastGen = maxGen;
});

var getGen = function(gen, correct) {
    var shouldCorrect = correct !== false;
    if (shouldCorrect) {
        gen = gen || lastGen;
        if (typeof gen === "object") {
            if ("num" in gen) {
                gen.num = +gen.num;
            }
        } else {
            gen = +gen;
        }
    }

    if (typeof gen !== "object") {
        gen = {"num": PokeInfo.species(gen), "subnum": PokeInfo.forme(gen)};
    }

    if (shouldCorrect) {
        if ("num" in gen) {
            gen.num = +gen.num;
        }

        if (isNaN(gen.num) || gen.num < 1 || gen.num > lastGen.num) {
            gen = lastGen;
        }
    }

    return gen;
};

GenInfo.getGen = getGen;
GenInfo.list = function() {
    var arr = [];
    for (var i in pokedex.gens.versions) {
        arr.push(i);
    }
    arr.sort(function(a, b) {
        var genA = getGen(a);
        var genB = getGen(b);
        return (genA.num - genB.num) || (genA.subnum - genB.subnum);
    });
    return arr;
};

GenInfo.name = function(gen) {
    var num = getGen(gen, false).num;
    return pokedex.generations.generations[num];
};

GenInfo.version = function(gen) {
    return pokedex.gens.versions[GenInfo.toNum(gen)];
};

GenInfo.toNum = function(gen) {
    gen = getGen(gen);
    return gen.num + (gen.subnum << 16);
};

GenInfo.options = function() {
    return pokedex.generations.options;
};

GenInfo.option = function(gen) {
    return pokedex.generations.options[getGen(gen, false).num];
};

GenInfo.hasOption = function(gen, option) {
    return !!GenInfo.option(gen)[option];
};

PokeInfo.toNum = function(poke) {
    if (typeof poke === "object") {
        return poke.num + ((poke.forme || 0) << 16);
    }
    return poke;
};

PokeInfo.toObject = function(poke) {
    if (typeof poke === "object") {
        return poke;
    }
    poke = +poke;
    return {
        num: PokeInfo.species(poke),
        forme: PokeInfo.forme(poke),
        gen: lastGen
    };
};

PokeInfo.toArray = function(num) {
    var pokenum = 0,
        formenum = 0,
        poke;

    if (typeof num === "number") {
        poke = ["" + num];
    } else if (typeof num === "string") {
        poke = num.split("-");
    } else if (Array.isArray(num)) {
        poke = num;
    }

    if (poke.length === 1) {
        pokenum = PokeInfo.species(+poke[0]);
        formenum = PokeInfo.forme(+poke[0]);
    } else if (poke.length === 2) {
        pokenum = PokeInfo.species(+poke[0]);
        formenum = PokeInfo.species(+poke[1]);
    }

    if (isNaN(pokenum)) {
        pokenum = 0;
    }
    if (isNaN(formenum)) {
        formenum = 0;
    }

    return [pokenum, formenum];
};

PokeInfo.species = function(poke) {
    return poke & ((1 << 16) - 1);
};

PokeInfo.forme = function(poke) {
    return poke >> 16;
};

PokeInfo.find = function(id, what, gen) {
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

    while (gennum < lastGen.num && ! (id in array) && !(ornum in array)) {
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

PokeInfo.trainerSprite = function(num) {
    return "/images/trainers/" + (num||0) + ".png";
};

PokeInfo.heldItemSprite = function() {
    return ItemInfo.itemSprite("helditem");
};

PokeInfo.genderSprite = function(num) {
    return "/images/genders/ingame_gender" + num + ".png";
};

PokeInfo.substituteSprite = function(back) {
    return "http://pokemon-online.eu/images/poke_img/sub" + (back ? "b":"") + ".png";
}

PokeInfo.sprite = function(poke, params) {
    params = params || {};
    poke = PokeInfo.toObject(poke);
    var gen = getGen(params.gen || poke.gen);
    /* Reuse gen 6 sprites if possible */
    if (gen.num > 6 && PokeInfo.released(poke, 6)) {
        gen = getGen(6);
    }
    var back = params.back || false;

    // Use last gen when dealing with missingno.
    if (poke.num === 0) {
        return "/images/" + pokedex.generations.options[lastGen.num].sprite_folder + "0.png";
    }

    var options = pokedex.generations.options[gen.num];
    var path = options.sprite_folder;
    if (options.animated) {
        path = "http://pokemon-online.eu/images/pokemon/" + path + "animated/";
    } else  {
        path = "/images/" + path;
    }
    if (back) {
        path += "back/";
    }
    if (PokeInfo.isShiny(poke, poke.gen)) {
        path += "shiny/";
    }
    if (poke.female && gen.num !== 6) {
        path += "female/";
    }
    if (options.animated) {
        path += ("00" + poke.num).slice(-3);
    } else {
        path += poke.num;
    }
    if (poke.forme) {
        path += "-" + poke.forme;
    }
    path += options.animated ? ".gif" : ".png";

    return path;
};

PokeInfo.battlesprite = function(poke, params) {
    params = params || {};

    var back = params.back || false;
    var data = PokeInfo.spriteData(poke, params);

    var path = pokedex.generations.options[lastGen.num].sprite_folder;
    if ((data.ext || "gif") === "gif") {
        path += "animated/";
    }
    if (back) {
        path += "back/";
    }
    if (poke.shiny) {
        path += "shiny/";
    }
    if (poke.female) {
        path += "female/";
    }
    if ((data.ext || "gif") === "gif") {
        path += ("00" + poke.num).slice(-3);
    } else {
        path += poke.num;
    }
    if (poke.forme && !data.noforme) {
        path += "-" + poke.forme;
    }
    path += "." + (data.ext || "gif");

    return path;
};

PokeInfo.spriteData = function(poke, params) {
    var back = (params || {}).back || false;
    var num = this.toNum(poke);

    var ret = (back ? pokedex.pokes.images.back[num] : pokedex.pokes.images[num]);
    if (!ret) {
        ret = (back ? pokedex.pokes.images.back[num%65356] : pokedex.pokes.images[num%65356]) || {"w":96,"h":96};
        ret.noforme = true;
    }
    return ret;
};

PokeInfo.icon = function(poke) {
    poke = this.toObject(poke);
    return "/images/icons/" + poke.num + (poke.forme ? "-" + poke.forme : "") + ".png";
};

PokeInfo.name = function(poke) {
    return pokedex.pokes.pokemons[this.toNum(poke)];
};

PokeInfo.num = function(name) {
    return pokedex.pokes.nums[name.toLowerCase()];
};

PokeInfo.gender = function(poke) {
    var pokeNum = this.toNum(poke);
    if (!(pokeNum in pokedex.pokes.gender)) {
        pokeNum %= 65536;
    }
    return pokedex.pokes.gender[pokeNum];
};

PokeInfo.height = function(poke) {
    var pokeNum = this.toNum(poke);
    if (! (pokeNum in pokedex.pokes.height)) {
        pokeNum %= 65536;
    }
    return pokedex.pokes.height[pokeNum];
};

PokeInfo.weight = function(poke) {
    var pokeNum = this.toNum(poke);
    if (! (pokeNum in pokedex.pokes.weight)) {
        pokeNum %= 65536;
    }
    return pokedex.pokes.weight[pokeNum];
};

PokeInfo.heldItem = function(poke) {
    return pokedex.pokes.items[this.toNum(poke)];
};

PokeInfo.stats = function(poke, gen) {
    return this.find(poke, "stats", gen);
};

PokeInfo.stat = function(poke, stat, gen) {
    return this.stats(poke, gen)[stat];
};

PokeInfo.allMoves = function(poke, gen) {
    var moves = this.find(poke, "all_moves", gen);
    if (!Array.isArray(moves)) {
        moves = [moves];
    }
    return moves;
};

PokeInfo.types = function(poke, gen) {
    var type1 = this.find(poke, "type1", gen);
    var type2 = this.find(poke, "type2", gen);
    var types = [type1];
    if (type2 != 18) {
        types.push(type2);
    }
    return types;
};

PokeInfo.abilities = function(poke, gen) {
    return [
        this.find(poke, "ability1", gen) || 0,
        this.find(poke, "ability2", gen) || 0,
        this.find(poke, "ability3", gen) || 0
    ];
};

PokeInfo._releasedCache = {};
PokeInfo.releasedList = function(gen, excludeFormes) {
    var gnum = getGen(gen).num;
    if ((gnum + "_ef" + excludeFormes) in PokeInfo._releasedCache) {
        return PokeInfo._releasedCache[gnum + "_ef" + excludeFormes];
    }

    var releasedList = pokedex.pokes.released[gnum],
        list = {},
        num;

    for (var i in releasedList) {
        if (excludeFormes && +i > 65535) {
            continue;
        }

        // For space economy, values can just be 1
        if (releasedList[i] === 1) {
            list[i] = PokeInfo.name(+i);
        } else {
            list[i] = releasedList[i];
        }
    }

    PokeInfo._releasedCache[gnum + "_ef" + excludeFormes] = list;
    return list;
};

PokeInfo.excludeFormes = true;

PokeInfo.released = function(poke, gen) {
    return pokedex.pokes.released[getGen(gen).num].hasOwnProperty(this.toNum(poke));
};

PokeInfo.calculateHpIv = function(ivs) {
    /* In generations 1 & 2 the HP DV/IV is calculated */
    return (ivs[1] & 1) * 8 +
        (ivs[2] & 1) * 4 +
        (ivs[5] & 1) * 2 +
        (ivs[3] & 1);
};

PokeInfo.calculateBestShiny = function(info) {
    var shinyIvs = info.ivs.slice();

    shinyIvs[2] = shinyIvs[3] = shinyIvs[4] = shinyIvs[5] = 10;

    // currently only attempts to maintain hp type
    shinyIvs[1] = 15;
    var gen2 = getGen(2);
    var type = MoveInfo.getHiddenPowerType(info.ivs, gen2);
    while (shinyIvs[1] >= 0) {
        if (type === MoveInfo.getHiddenPowerType(shinyIvs, gen2)) break;
        shinyIvs[1] -= (shinyIvs[1] % 2) ? 1 : 3;
    }
    if (shinyIvs[1] < 0) {
        shinyIvs[1] = 15;
    }

    shinyIvs[0] = PokeInfo.calculateHpIv(shinyIvs);
    return shinyIvs;
};

PokeInfo.isShiny = function(info, gen) {
    if (!gen || gen.num > 2) return info.shiny;
    return info.ivs[2] === 10 && info.ivs[3] === 10 && info.ivs[5] === 10 &&
        [2, 3, 6, 7, 10, 11, 14, 15].indexOf(info.ivs[1]) > -1;
};

PokeInfo.calculateStatInfo = function(info, stat, gen) {
    if (info.num === 292 && stat === 0) {
        return 1;
    }
    gen = gen || lastGen;
    var baseStat = PokeInfo.stat(info, stat, gen);
    var ev = Math.floor(info.ev / 4);
    var iv = info.iv;
    var level = info.level;
    if (stat === 0) { // HP
        if (gen.num > 2) {
            return Math.floor((iv + 2 * baseStat + ev + 100) * level / 100) + 10;
        } else {
            return Math.max(1, Math.min(999,
                Math.floor(((iv + baseStat) * 2 + ev) * level / 100) + level + 10));
        }
    } else {
        if (gen.num > 2) {
            var natureBoost = info.natureBoost;
            return Math.floor(Math.floor((iv + 2 * baseStat + ev) * level / 100 + 5) * natureBoost);
        } else {
            return Math.max(1, Math.min(999,
                Math.floor(((iv + baseStat) * 2 + ev) * level / 100) + 5));
        }
    }
};

PokeInfo.calculateStat = function(poke, stat, gen) {
    gen = gen || lastGen;
    return PokeInfo.calculateStatInfo({
        "num": poke.num,
        "forme": poke.forme || 0,
        "iv": poke.ivs[stat],
        "ev": poke.evs[stat],
        "level": poke.level,
        "natureBoost": NatureInfo.getNatureEffect(poke.nature, stat)
    }, stat, gen);
};

PokeInfo.minStat = function(poke, stat, gen) {
    gen = gen || lastGen;
    var ret = PokeInfo.calculateStatInfo({
        "num": poke.num,
        "forme": poke.forme || 0,
        "iv": gen.num > 2 ? 31 : 15,
        "ev": gen.num > 2 ? 0 : 255,
        "level": poke.level,
        "natureBoost": 1
    }, stat, gen);
    var boost = poke.boost || 0;
    if (gen.num <= 2) {
        return Math.floor(ret * Math.floor(
            Math.max(2, 2 + boost) / Math.max(2, 2 - boost) * 100) / 100);
    }
    return Math.floor(ret * Math.max(2, 2 + boost) / Math.max(2, 2 - boost));
};

PokeInfo.maxStat = function(poke, stat, gen) {
    gen = gen || lastGen;
    var ret = PokeInfo.calculateStatInfo({
        "num": poke.num,
        "forme": poke.forme || 0,
        "iv": gen.num > 2 ? 31 : 15,
        "ev": 252,
        "level": poke.level,
        "natureBoost": 1.1
    }, stat, gen);
    var boost = poke.boost || 0;
    if (gen.num <= 2) {
        return Math.floor(ret * Math.floor(
            Math.max(2, 2 + boost) / Math.max(2, 2 - boost) * 100) / 100);
    }
    return Math.floor(ret * Math.max(2, 2 + boost) / Math.max(2, 2 - boost));
};

PokeInfo.itemForForme = function(poke) {
    var num = PokeInfo.toNum(poke);
    return pokedex.pokes.item_for_forme[num] || 0;
};

GenderInfo.name = function(gender) {
    return {1: "male", 2: "female", 3: "neutral"}[gender];
};

GenderInfo.shorthand = function(gender) {
    return {1: "(M)", 2: "(F)", 3: "", 0: ""}[gender];
};

NatureInfo.list = function() {
    return pokedex.natures.nature;
};

NatureInfo.name = function(nature) {
    return pokedex.natures.nature[nature];
};

NatureInfo.num = function(nature) {
    if (!pokedex.natures.nums) {
        pokedex.natures.nums = {};
        for (var i = 0; i < 25; i++) {
            pokedex.natures.nums[NatureInfo.name(i).toLowerCase()] = i;
        }
    }
    return pokedex.natures.nums[nature.toLowerCase()];
};

NatureInfo.getNatureEffect = function(nature_id, stat_id) {
    var arr = [-1, 0, 1, 3, 4, 2];
    var n1 = (Math.floor(nature_id / 5) === arr[stat_id]) ? 1 : 0;
    var n2 = (nature_id % 5 === arr[stat_id]) ? 1 : 0;
    return (10 + n1 - n2) / 10;
};

NatureInfo.boostedStat = function(nature_id) {
    var arr = [1, 2, 5, 3, 4];
    if (Math.floor(nature_id / 5) !== nature_id % 5) {
        return arr[Math.floor(nature_id / 5)];
    }
    return -1;
};

NatureInfo.reducedStat = function(nature_id) {
    var arr = [1, 2, 5, 3, 4];
    if (Math.floor(nature_id / 5) !== nature_id % 5) {
        return arr[nature_id % 5];
    }
    return -1;
};

NatureInfo.getNatureForBoosts = function(plus_boost, neg_boost) {
    for (var i = 0; i < 25; i++) {
        if (NatureInfo.boostedStat(i) == plus_boost && NatureInfo.reducedStat(i) == neg_boost) {
            return i;
        }
    }
    return -1;
};

MoveInfo.list = function() {
    return pokedex.moves.moves;
};

MoveInfo.hasMove = function(move) {
    return move in pokedex.moves.moves;
};

MoveInfo.name = function(move) {
    return pokedex.moves.moves[move];
};

MoveInfo.num = function(move) {
    if (!pokedex.moves.nums) {
        pokedex.moves.nums = {};
        for (var num in MoveInfo.list()) {
            pokedex.moves.nums[MoveInfo.name(num).toLowerCase()] = num;
        }
    }
    return pokedex.moves.nums[move.toLowerCase()];
};

MoveInfo.findId = function(move) {
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

MoveInfo.find = function(id, what, gen) {
    gen = getGen(gen);

    if (! (what in pokedex.moves)) {
        return "";
    }

    var gennum = gen.num;
    var array = pokedex.moves[what][gennum];

    if (id in array) {
        return array[id];
    }

    while (gennum < lastGen.num && ! (id in array)) {
        array = pokedex.moves[what][++gennum];
    }

    /* expand */
    if (gennum != gen.num && id in array) {
        pokedex.moves[what][gen.num][id] = array[id];
    }

    return array[id];
};

MoveInfo.accuracy = function(move, gen) {
    return this.find(move, "accuracy", gen) || 0;
};

MoveInfo.category = function(move, gen) {
    var d = this.find(move, "damage_class", gen);
    if (d && getGen(gen).num <= 2) {
        return TypeInfo.category(MoveInfo.type(move));
    }
    return d || 0;
};

MoveInfo.effect = function(move, gen) {
    var p = MoveInfo.effectChance(move, gen);
    if (getGen(gen).num < 2) {
        p = p + "/256 (" + Math.round(p / 256 * 100) + "%)";
    }
    return (this.find(move, "effect", gen) || "").replace("$effect_chance", p);
};

MoveInfo.effectChance = function(move, gen) {
    return this.find(move, "effect_chance", gen) || 0;
};

MoveInfo.power = function(move, gen) {
    return this.find(move, "power", gen) || 0;
};

MoveInfo.pp = function(move, gen) {
    return this.find(move, "pp", gen);
};

MoveInfo.type = function(move, gen) {
    return this.find(move, "type", gen) || 0;
};

MoveInfo.message = function(move, part) {
    var messages = pokedex.moves.move_message[move];

    if (!messages) {
        return "";
    }

    var parts = messages.split("|");
    if (part >= 0 && part < parts.length) {
        return parts[part];
    }

    return "";
};

MoveInfo.getHiddenPowerIVs = function(type, generation) {
    generation = getGen(generation).num;
    type = +type;

    if (generation < 3) {
        // only 1 optimal HP exists per type
        type -= 1;
        return [[
            ((type & 4) << 1) | ((type & 1) << 2) | 3,
            12 | (type >> 2),
            12 | (type & 3),
            15, 15, 15
        ]];
    }

    var ivLists = [];
    for (var i = 63; i >= 0; i--) {
        var ivs = [
            (i & 1) ? 31 : 30,
            (i & 2) ? 31 : 30,
            (i & 4) ? 31 : 30,
            (i & 8) ? 31 : 30,
            (i & 16) ? 31 : 30,
            (i & 32) ? 31 : 30
        ];
        if (MoveInfo.getHiddenPowerType(ivs, generation) === type) {
            ivLists.push(ivs);
        }
    }

    var statImportance = [5, 3, 0, 2, 4, 1];
    return ivLists.sort(function(a, b) {
        // sort for perfect speed IV
        // sort for total perfect IVs
        // and then sort based on which stats are more important
        // Speed > SpAtk > HP > Def > SpDef > HP
        if (a[5] !== b[5]) return b[5] - a[5];
        var sumA = 0;
        var sumB = 0;
        var imp = 0;
        for (var i = 0; i < 6; i++) {
            sumA += a[i];
            sumB += b[i];
            if (!imp && a[statImportance[i]] !== b[statImportance[i]]) {
                imp += b[statImportance[i]] - a[statImportance[i]];
            }
        }
        return (sumB - sumA) || imp;
    });
};

MoveInfo.getHiddenPowerType = function(ivs, generation) {
    generation = getGen(generation).num;
    if (generation <= 2) {
        return 1 + (ivs[1] & 3) * 4 + (ivs[2] & 3);
    }
    var bits = (ivs[0] & 1) +
        ((ivs[1] & 1) * 2) +
        ((ivs[2] & 1) * 4) +
        ((ivs[5] & 1) * 8) +
        ((ivs[3] & 1) * 16) +
        ((ivs[4] & 1) * 32);
    return 1 + Math.floor(bits * 15 / 63);
};

MoveInfo.getHiddenPowerBP = function(ivs, generation) {
    generation = getGen(generation).num;
    var bits;
    if (generation <= 2) {
        bits = (ivs[3] >> 3) +
            ((ivs[5] >> 2) & 2) +
            ((ivs[2] >> 1) & 4) +
            (ivs[1] & 8);
        return 31 + Math.floor((5 * bits + (ivs[3] & 3)) / 2);
    }
    if (generation <= 5) {
        bits = (ivs[0] & 2) / 2 +
            (ivs[1] & 2) +
            (ivs[2] & 2) * 2 +
            (ivs[5] & 2) * 4 +
            (ivs[3] & 2) * 8 +
            (ivs[4] & 2) * 16;
        return 30 + Math.floor(bits * 40 / 63);
    }
    return 60;
};

CategoryInfo.list = function() {
    return pokedex.categories.categories;
};

CategoryInfo.name = function(category) {
    return pokedex.categories.categories[category];
};

ItemInfo.list = function() {
    var list = pokedex.items.items;
    for (var i in pokedex.items.berries) {
        list[i + 8000] = pokedex.items.berries[i];
    }
    return list;
};

ItemInfo.hasItem = function(item) {
    if (item >= 8000) {
        return (item - 8000) in pokedex.items.berries;
    } else {
        return item in pokedex.items.items;
    }
};

ItemInfo.name = function(item) {
    if (item >= 8000) {
        return pokedex.items.berries[item - 8000];
    } else {
        return pokedex.items.items[item];
    }
};

ItemInfo.num = function(name) {
    return pokedex.items.nums[name.toLowerCase()];
};

ItemInfo.berryName = function(item) {
    return pokedex.items.berries[item];
};

ItemInfo._releasedCache = {};
ItemInfo.releasedList = function(gen) {
    var gnum = getGen(gen).num;
    if (gnum in ItemInfo._releasedCache) {
        return ItemInfo._releasedCache[gnum];
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
        list[+i + 8000] = pokedex.items.berries[i];
    }

    ItemInfo._releasedCache[gnum] = list;
    return list;
};

ItemInfo.released = function(item, gen) {
    gen = getGen(gen).num;
    if (item >= 8000) {
        return pokedex.items.released_berries[gen].hasOwnProperty(item-8000);
    } else {
        return pokedex.items.released_items[gen].hasOwnProperty(item);
    }
};

ItemInfo.usefulList = function() {
    return pokedex.items.item_useful;
};

ItemInfo.useful = function(item) {
    return item > 8000 || pokedex.items.item_useful.hasOwnProperty(item);
};

ItemInfo.message = function(item, part) {
    var messages = (item >= 8000 ? pokedex.items.berry_messages[item-8000] : pokedex.items.item_messages[item]);

    if (!messages) {
        return "";
    }

    var parts = messages.split("|");
    if (part >= 0 && part < parts.length) {
        return parts[part];
    }

    return "";
};

ItemInfo.desc = function(item) {
    if (item >= 8000) {
        return pokedex.items.berries_description[+item - 8000] || "";
    } else {
        return pokedex.items.items_description[item] || "";
    }
};

ItemInfo.itemSprite = function(item) {
    if (+item >= 8000) {
        return "/images/berries/" + (item - 8000) + ".png";
    } else {
        return "/images/items/" + item + ".png";
    }
};

StatInfo.list = function() {
    return pokedex.status.stats;
};

StatInfo.name = function(stat) {
    return pokedex.status.stats[stat];
};

StatusInfo.list = function() {
    return pokedex.status.status;
};

StatusInfo.name = function(status) {
    return pokedex.status.status[status];
};

TypeInfo.list = function() {
    return pokedex.types.types;
};

TypeInfo.name = function(type) {
    return pokedex.types.types[type];
};

TypeInfo.num = function(type) {
    type = type.toLowerCase();
    for (var t in pokedex.types.types) {
        if (type === pokedex.types.types[t].toLowerCase()) {
            return t;
        }
    }
    return -1;
};

TypeInfo.css = function(type) {
    if (type == 18) {
        return "curse";
    }
    return pokedex.types.types[type].toLowerCase();
};

TypeInfo.categoryList = function() {
    return pokedex.types.category;
};

TypeInfo.category = function(type) {
    return pokedex.types.category[type];
};

TypeInfo.sprite = function(type) {
    return "/images/types/type" + type + ".png";
};

AbilityInfo.list = function() {
    return pokedex.abilities.abilities;
};

AbilityInfo.name = function(ability) {
    return pokedex.abilities.abilities[ability];
};

AbilityInfo.num = function(ability) {
    if (!pokedex.abilities.nums) {
        pokedex.abilities.nums = {};
        for (var num in pokedex.abilities.abilities) {
            pokedex.abilities.nums[pokedex.abilities.abilities[num].toLowerCase()] = num;
        }
    }
    return pokedex.abilities.nums[ability.toLowerCase()];
};

AbilityInfo.desc = function(ability) {
    return pokedex.abilities.ability_desc[ability] !== true ? pokedex.abilities.ability_desc[ability] : "No ability.";
};

AbilityInfo.message = function(ability, part) {
    var messages = pokedex.abilities.ability_messages[ability];
    part = part || 0;

    if (!messages) {
        return "";
    }

    var parts = messages.split("|");
    if (part >= 0 && part < parts.length) {
        return parts[part];
    }

    return "";
};
