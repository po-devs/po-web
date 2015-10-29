
function Poke()
{
	this.reset();
}

Poke.prototype.reset = function() {
	this.num = 0;
	this.forme = 0;
	this.nick = "";
	this.item = 0;
	this.ability = 0;
	this.moves = [0,0,0,0];
	if (this.gen && this.gen.num <= 2) {
		this.evs = [252,252,252,252,252,252];
		this.ivs = [15,15,15,15,15,15];
	} else {
		this.evs = [0,0,0,0,0,0];
		this.ivs = [31,31,31,31,31,31];
	}
	this.happiness = 0;
	this.level = 100;
	this.gender = 0;
	this.nature = 0;
	this.shiny = false;
};

Poke.prototype.load = function(poke) {
    var alreadySet = false;

    if (this.num && pokeinfo.toNum(this) == pokeinfo.toNum(poke)) {
        alreadySet = true;
    } else {
        this.reset();
    }
    poke = pokeinfo.toObject(poke);
    this.num = poke.num;
    this.forme = poke.forme;

    if (!alreadySet && !this.illegal) {
    	/* Change mega forme to base + item, and so on */
    	var item = pokeinfo.itemForForme(this);
    	if (item) {
    		this.forme = 0;
    		this.item = item;
    	}
    }

    this.data = {};
    this.data.moveNames = [];
    this.data.types = pokeinfo.types(this);

    this.data.gender = pokeinfo.gender(this);

    if (this.illegal) {
    	this.data.allMoves = Object.keys(moveinfo.list());
    	this.data.abilities = Object.keys(abilityinfo.list());
    } else {
    	this.data.allMoves = pokeinfo.allMoves(this, this.gen);
    	this.data.abilities = pokeinfo.abilities(this, this.gen);
    	if (!this.data.abilities[2] || this.data.abilities[2] == this.data.abilities[0]) {
        	this.data.abilities.splice(2, 1);
	    }
	    if (!this.data.abilities[1] || this.data.abilities[1] == this.data.abilities[0]) {
	        this.data.abilities.splice(1, 1);
	    }
    }

    if (!alreadySet) {
        this.nick = this.num == 0 ? "" : pokeinfo.name(this);
        this.ability = this.data.abilities[0];
        this.gender = this.data.gender == 3 ? (1 + Math.floor(2*Math.random())) : this.data.gender;
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
    return sum-510;
};


Poke.prototype.export = function() {
	if (!this.num) {
		return "";
	}
	var gen = getGen(this.gen);

	var lines = [];

	var name = pokeinfo.name(this);

	if (name == this.nick || !this.nick) {
		name += this.shiny? "*" : "";
	} else {
		name = this.nick + (this.shiny? "*" : "") + " (" + name + ")";
	}
	name += " ";

	if (this.gen.num > 1 && this.gender == 2) {
		name += "(F) ";
	}

	name += "@ " + iteminfo.name(this.item);

	lines.push(name);

	if (this.level != 100) {
		lines.push("Level: " + this.level);
	}

	if (this.gen.num > 2) {
		lines.push("Trait: " + abilityinfo.name(this.ability));
	}

	var evs = [];
	var evNames = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];

	for (var i in evNames) {
		if (this.gen.num > 2) {
			if (this.evs[i]) {
				evs.push(this.evs[i] + " " + evNames[i]);
			}	
		} else {
			if (this.evs[i] < 252) {
				evs.push(this.evs[i] + " " + evNames[i]);
			}
		}
	}

	if (evs.length > 0) {
		lines.push("EVs: " + evs.join(" / "));
	}

	var ivs = [];
	for (var i in evNames) {
		if (this.gen > 2 && this.ivs[i] != 31 || this.gen <= 2 && this.ivs[i] != 15) {
			ivs.push(this.ivs[i] + " " + evNames[i]);
		}
	}
	if (ivs.length > 0) {
		lines.push("IVs: " + ivs.join(" / "));
	}

	if (this.gen > 2) {
		var nature = natureinfo.name(this.nature) + " nature";

		if (natureinfo.boostedStat(this.nature) != -1) {
			nature += " (+" + evNames[natureinfo.boostedStat(this.nature)] + ", -" + evNames[natureinfo.reducedStat(this.nature)] + ")";
		}
		lines.push(nature);
	}

	for (var i in this.moves) {
		if (this.moves[i]) {
			var name = moveinfo.name(this.moves[i]);
			if (name == "Hidden Power") {
				name += " [" + typeinfo.name(moveinfo.getHiddenPowerType(this.gen, this.ivs)) + "]";
			}
			lines.push("- " + name);
		}
	}

	return lines.join("\n");
};

Poke.prototype.import = function(str) {
	this.reset();

	var lines = str.split("\n");
	var nameLine = lines.splice(0, 1)[0];
	var nameItem = nameLine.split("@");

	var nick = nameItem[0].replace("(M)", "").replace("*", "").replace("(F)", "").trim();
	if (nick.indexOf("(") != 0 && nick.indexOf(")") > nick.indexOf("(")) {
		var left = nick.indexOf("(")+1;
		var right = nick.indexOf(")");
		this.load(pokeinfo.num(nick.substr(left, right - left)));
		this.nick = nick.substr(0, left-1).trim();
	} else {
		this.load(pokeinfo.num(nick));
	}

	if (nameItem[0].indexOf("*") != -1) {
		this.shiny = true;
	}

	if (nameItem[0].indexOf("(F)") != -1) {
		this.gender = 2;
	} else if (this.data.gender == 3) {
		//If both are possible and female was not specified, default to male
		this.gender = 1;
	}

	if (nameItem.length > 1) {
		this.item = iteminfo.num(nameItem[1].trim());
	} else {
		this.item = 0;
	}

	var statNames = ["HP", "Atk", "Def", "SAtk", "SDef", "Spd", "HP", "Atk", "Def", "SpA", "SpD", "Spe"];
	var moveIndex = 0;

	while (lines.length > 0) {
		var line = lines.splice(0, 1)[0];
		var lline = line.toLowerCase();
		if (lline.startsWith("level:")) {
			this.level = +line.substr(line.indexOf(":")+1).trim();
		} else if (lline.startsWith("shiny:")) {
			this.shiny = lline.substr(line.indexOf(":")+1).trim() == "yes";
		} else if (lline.startsWith("evs:") || lline.startsWith("ivs:")) {
			var evs = line.substr(4).split("/");
			for (var i in evs) {
				var ev = evs[i].trim().split(" ");
				if (ev.length < 2) {
					continue;
				}
				var num = +ev[0];
				var stat = statNames.indexOf(ev[1].trim());
				if (stat == -1) {
					continue;
				}
				(lline.startsWith("evs:") ? this.evs : this.ivs)[stat % 6] = num;
			}
		} else if (lline.startsWith("trait:") || lline.startsWith("ability:")) {
			this.ability = abilityinfo.num(lline.split(":")[1].trim());
		} else if (line.trim().startsWith("-")) {
			if (moveIndex >= 4) {
				continue;
			}
			var end = line.substr(line.indexOf("-")+1).trim();
			if (end.indexOf("[") != -1) {
				end = end.substr(0, end.indexOf("[")).trim();
			}
			var move = moveinfo.num(end);
			this.moves[moveIndex++] = move;
		} else if (lline.contains("nature")) {
			line = line.trim();
			this.nature = natureinfo.num(line.substr(0, line.indexOf(" ")));
		}
	}
};
