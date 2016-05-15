//console.log("loading simple battle window");

var spritelist = {};
var hudlist = {};

function position(spot) {
	if (battle.side(spot) == 1) {
		$("#poke-" + spot).addClass("backside");
		$("#poke-" + spot).find(".pokehud").addClass("rpokehud");
	} else {
		$("#poke-" + spot).addClass("frontside");
		$("#poke-" + spot).find(".pokehud").addClass("lpokehud");
	}
}

function init() {
	if (battle.poke(0).percent) {
		battle.trigger("sendout", 0);
	}
	if (battle.poke(1).percent) {
		battle.trigger("sendout", 1);
	}
}

function updateHP(spot) {
	hpbar(spot).find(".hp").css("width", 150*battle.poke(spot).percent/100);
	hpbar(spot).find(".prevhp").css("width", 150*battle.poke(spot).percent/100+1);
	hpbar(spot).find(".hptext").text(Math.floor(battle.poke(spot).percent) + "%");
}

function hpbar(spot) {
	return hud(spot).find(".hpbar");
}

function hud(spot) {
	if (!(spot in hudlist)) {
		hudlist[spot] = $("#poke-" + spot + " .pokehud");;
	}
	return hudlist[spot];
}

function sprite(spot) {
	if (!(spot in spritelist)) {
		spritelist[spot] = $("#poke-" + spot + " img.poke-sprite");;
	}
	return spritelist[spot];
}

$(function() {
	battle.on("sendout", function(spot) {
		sprite(spot).attr("src", PokeInfo.sprite(battle.poke(spot), {"back": battle.side(spot)}));
		updateHP(spot);
		hud(spot).show();
	});

	battle.on("reappear", function(spot) {
		sprite(spot).attr("src", PokeInfo.sprite(battle.poke(spot), {"back": battle.side(spot)}));
	});

	battle.on("spritechange", function(spot) {
		sprite(spot).attr("src", PokeInfo.sprite(battle.poke(spot), {"back": battle.side(spot)}));
	});

	battle.on("sendback", function(spot) {
		sprite(spot).attr("src", "public/assets/images/blank.png");
		hud(spot).hide();
	});

	battle.on("vanish", function(spot) {
		sprite(spot).attr("src", "public/assets/images/blank.png");
	});

	battle.on("ko", function(spot) {
		sprite(spot).attr("src", "public/assets/images/blank.png");
		hud(spot).hide();
	});

	battle.on("hpchange", function(spot) {
		updateHP(spot);
	});

	position(0);
	position(1);

	init();

    battle.unpause();
});