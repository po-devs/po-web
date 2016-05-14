//console.log("loading simple battle window");

var spritelist = {};

function position(spot) {
	if (battle.side(spot) == 1) {
		$("#poke-" + spot).addClass("backside");
	} else {
		$("#poke-" + spot).addClass("frontside");
	}
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
	});

	battle.on("reappear", function(spot) {
		sprite(spot).attr("src", PokeInfo.sprite(battle.poke(spot), {"back": battle.side(spot)}));
	});

	battle.on("spritechange", function(spot) {
		sprite(spot).attr("src", PokeInfo.sprite(battle.poke(spot), {"back": battle.side(spot)}));
	});

	battle.on("sendback", function(spot) {
		sprite(spot).attr("src", "public/assets/images/blank.png");
	});

	battle.on("vanish", function(spot) {
		sprite(spot).attr("src", "public/assets/images/blank.png");
	});

	battle.on("ko", function(spot) {
		sprite(spot).attr("src", "public/assets/images/blank.png");
	});

	position(0);
	position(1);

    battle.unpause();
});