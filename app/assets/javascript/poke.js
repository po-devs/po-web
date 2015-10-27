
function Poke()
{
	this.reset();
}

Poke.prototype.reset = function() {
	this.num = 0;
	this.subnum = 0;
	this.item = 0;
	this.ability = 0;
	this.moves = [0,0,0,0];
	this.evs = [0,0,0,0,0,0];
	this.ivs = [31,31,31,31,31,31];
	this.happiness = 0;
	this.level = 100;
	this.gender = 0;
	this.nature = 0;
	this.shiny = false;
};

Poke.prototype.export = function() {
	if (!this.num) {
		return "";
	}

	var lines = [];

	var name = pokeinfo.name(this);

	if (name == this.nick || !this.nick) {
		name += this.shiny? "*" : "";
	} else {
		name = this.nick + (this.shiny? "*" : "") + " (" + name + ")";
	}
	name += " ";

	if (this.gender == 2) {
		name += "(F) ";
	}

	name += "@ " + iteminfo.name(this.item);

	lines.push(name);

	if (this.level != 100) {
		lines.push("Level: " + this.level);
	}


	lines.push("Trait: " + abilityinfo.name(this.ability));

	var evs = [];
	var evNames = ["HP", "Atk", "SAtk", "Def", "SDef", "Spd"];

	for (var i in evNames) {
		if (this.evs[i]) {
			evs.push(this.evs[i] + " " + evNames[i]);
		}
	}

	if (evs.length > 0) {
		lines.push("EVs: " + evs.join(" / "));
	}

	var ivs = [];
	for (var i in evNames) {
		if (this.ivs[i] != 31) {
			ivs.push(this.ivs[i] + " " + evNames[i]);
		}
	}
	if (ivs.length > 0) {
		lines.push("IVs: " + ivs.join(" / "));
	}

	var nature = natureinfo.name(this.nature) + " nature";

	if (natureinfo.boostedStat(this.nature) != -1) {
		nature += " (+" + evNames[natureinfo.boostedStat(this.nature)] + ", -" + evNames[natureinfo.reducedStat(this.nature)] + ")";
	}
	lines.push(nature);

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