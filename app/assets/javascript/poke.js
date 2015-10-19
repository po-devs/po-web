
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
};