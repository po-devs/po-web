function Poke() {
	this.reset();
}

Poke.prototype.reset = function() {
	this.num = 0;
	this.forme = 0;
	this.nick = "";
	this.item = 0;
	this.ability = 0;
	this.moves = [0, 0, 0, 0];
	if (this.gen && this.gen.num <= 2) {
		this.evs = [252, 252, 252, 252, 252, 252];
		this.ivs = [15, 15, 15, 15, 15, 15];
	} else {
		this.evs = [0, 0, 0, 0, 0, 0];
		this.ivs = [31, 31, 31, 31, 31, 31];
	}
	this.happiness = 0;
	this.level = 100;
	this.gender = 0;
	this.nature = 0;
	this.shiny = false;
};

Poke.prototype.load = function(poke) {
    var alreadySet = false;

    if (this.num && PokeInfo.toNum(this) === PokeInfo.toNum(poke)) {
        alreadySet = true;
    } else {
        this.reset();
    }
    poke = PokeInfo.toObject(poke);
    this.num = poke.num;
    this.forme = poke.forme;

    if (!alreadySet && !this.illegal) {
    	/* Change mega forme to base + item, and so on */
    	var item = PokeInfo.itemForForme(this);
    	if (item) {
    		this.forme = 0;
    		this.item = item;
    	}
    }

    this.data = {};
    this.data.moveNames = [];
    this.data.types = PokeInfo.types(this, this.gen);

    this.data.gender = PokeInfo.gender(this);

    if (this.illegal) {
    	this.data.allMoves = Object.keys(MoveInfo.list());
    	this.data.abilities = Object.keys(AbilityInfo.list());
    } else {
    	this.data.allMoves = PokeInfo.allMoves(this, this.gen);
    	this.data.abilities = PokeInfo.abilities(this, this.gen);
    	if (!this.data.abilities[2] || this.data.abilities[2] === this.data.abilities[0]) {
        	this.data.abilities.splice(2, 1);
	    }
	    if (!this.data.abilities[1] || this.data.abilities[1] === this.data.abilities[0]) {
	        this.data.abilities.splice(1, 1);
	    }
    }

    if (!alreadySet) {
        this.nick = this.num === 0 ? "" : PokeInfo.name(this);
        this.ability = this.data.abilities[0];
        this.gender = this.data.gender === 3 ? (1 + Math.floor(2 * Math.random())) : this.data.gender;
    }
};

Poke.prototype.evSurplus = function() {
	if (this.gen && this.gen.num <= 2) {
		return 0;
	}
    var sum = 0;
    for (var i = 0; i < 6; i++) {
        sum = sum + this.evs[i];
    }
    return sum - 510;
};

Poke.prototype.export = function() {
	if (!this.num) {
		return "";
	}
	var gen = getGen(this.gen);

	var lines = [];

	var name = PokeInfo.name(this);

	if (name === this.nick || !this.nick) {
		name += this.shiny ? "*" : "";
	} else {
		name = this.nick + (this.shiny ? "*" : "") + " (" + name + ")";
	}

	if (gen.num > 1 && this.gender > 0) {
		name += ["", " (M)", " (F)"][this.gender % 3];
	}

	name += " @ " + ItemInfo.name(this.item);

	lines.push(name);

	if (this.level !== 100) {
		lines.push("Level: " + this.level);
	}

	if (gen.num > 2) {
		lines.push("Ability: " + AbilityInfo.name(this.ability));
	}

	var statNames = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];

	var evs = [];
	var ivs = [];

	for (var s = 0; s < 6; s++) {
		if ((gen.num > 2 && this.evs[s] > 0) || (gen.num <= 2 && this.evs[s] < 252)) {
			evs.push(this.evs[s] + " " + statNames[s]);
		}
		if ((gen.num > 2 && this.ivs[s] < 31) || (gen.num <= 2 && this.ivs[s] < 15)) {
			ivs.push(this.ivs[s] + " " + statNames[s]);
		}
	}

	if (evs.length > 0) {
		lines.push("EVs: " + evs.join(" / "));
	}

	if (ivs.length > 0) {
		lines.push("IVs: " + ivs.join(" / "));
	}

	if (gen.num > 2) {
		var nature = NatureInfo.name(this.nature) + " Nature";
		if (NatureInfo.boostedStat(this.nature) > -1) {
			nature += " (+" + statNames[NatureInfo.boostedStat(this.nature)] +
					  ", -" + statNames[NatureInfo.reducedStat(this.nature)] + ")";
		}
		lines.push(nature);
	}

	for (var m = 0; m < this.moves.length; m++) {
		if (this.moves[m]) {
			var moveName = MoveInfo.name(this.moves[m]);
			if (moveName === "Hidden Power") {
				moveName += " [" + TypeInfo.name(MoveInfo.getHiddenPowerType(this.ivs, this.gen)) + "]";
			}
			lines.push("- " + moveName);
		}
	}

	return lines.join("\n");
};

Poke.prototype.import = function(str) {
	this.reset();

	var gen = getGen(this.gen);
	var lines = str.replace("\r", "").split("\n");
	var nameLine = lines.splice(0, 1)[0];
	var nameItem = nameLine.split("@");

	var nick = nameItem[0].replace("(M)", "").replace("(F)", "").replace("*", "").trim();
	var left = nick.indexOf("(");
	var right = nick.indexOf(")");
	if (left > -1 && right > left) {
		this.load(PokeInfo.num(nick.substring(left + 1, right)));
		this.nick = nick.substring(0, left).trim();
	} else {
		this.load(PokeInfo.num(nick));
	}

	this.shiny = nameItem[0].indexOf("*") > -1 && gen.num > 1;

	if (gen.num > 1 && nameItem[0].indexOf("(M)") > -1) {
		this.gender = 1;
	} else if (gen.num > 1 && nameItem[0].indexOf("(F)") > -1) {
		this.gender = 2;
	} else if (gen.num > 1 && this.data.gender == 3) {
		// If both are possible and none specified, default to male
		this.gender = 1;
	}

	if (nameItem.length > 1 && gen.num > 1) {
		this.item = ItemInfo.num(nameItem[1].trim());
	} else {
		this.item = 0;
	}

	var statNames = {
		"HP": 0, "Atk": 1, "Def": 2,
		"SAtk": 3, "SpA": 3, "Spc": 3,
		"SDef": 4, "SpD": 4,
		"Spd": 5, "Spe": 5
	};
	var moveIndex = 0;

	while (lines.length > 0) {
		var line = lines.splice(0, 1)[0];
		var lower = line.toLowerCase();
		if (lower.startsWith("level:")) {
			this.level = parseInt(line.substr(line.indexOf(":") + 1), 10);
			if (!(this.level >= 1 && this.level <= 100)) {
				this.level = 100;
			}
		} else if (lower.startsWith("shiny:")) {
			this.shiny = lower.indexOf("yes") > -1;
		} else if (lower.startsWith("evs:")) {
			var evs = line.substr(4).split("/");
			for (var e = 0; e < evs.length; e++) {
				var ev = evs[e].trim().split(" ");
				if (ev.length < 2) {
					continue;
				}
				var evNum = parseInt(ev[0]);
				if (!(evNum >= 0 && evNum <= 252)) {
					continue;
				}
				if (!statNames.hasOwnProperty(ev[1].trim())) {
					continue;
				}
				this.evs[statNames[ev[1].trim()]] = evNum;
			}
		} else if (lower.startsWith("ivs:")) {
			var ivs = line.substr(4).split("/");
			var ivMax = gen.num > 2 ? 31 : 15;
			for (var i = 0; i < ivs.length; i++) {
				var iv = ivs[i].trim().split(" ");
				if (iv.length < 2) {
					continue;
				}
				var ivNum = parseInt(iv[0]);
				if (!(ivNum >= 0 && ivNum <= ivMax)) {
					continue;
				}
				if (!statNames.hasOwnProperty(iv[1].trim())) {
					continue;
				}
				this.ivs[statNames[iv[1].trim()]] = ivNum;
			}
		} else if (lower.startsWith("trait:") || lower.startsWith("ability:")) {
			this.ability = AbilityInfo.num(lower.split(":")[1].trim());
		} else if (line.trim().startsWith("-")) {
			if (moveIndex >= 4) {
				continue;
			}
			line = line.substr(line.indexOf("-") + 1).trim();
			if (line.indexOf("[") > -1) {
				if (line.toLowerCase().startsWith("hidden power")) {
					var type = TypeInfo.num(line.substr(12).replace("[", "").replace("]", "").trim());
					if (type > 0 && MoveInfo.getHiddenPowerType(this.ivs, this.gen) !== type) {
						// do not change ivs if current ivs already are a match
						this.ivs = MoveInfo.getHiddenPowerIVs(type, this.gen)[0];
					}
				}
				line = line.substring(0, line.indexOf("[")).trim();
			}
			this.moves[moveIndex++] = MoveInfo.num(line);
		} else if (lower.contains("nature")) {
			line = line.trim();
			this.nature = NatureInfo.num(line.substring(0, line.indexOf(" ")));
		}
	}
};
