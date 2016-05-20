//console.log("loading simple battle window");

var spritelist = {};
var hudlist = {};

/* Copy of BattleTab.statuses */
var statusList = {
    0: "",
    1: "par",
    2: "slp",
    3: "frz",
    4: "brn",
    5: "psn",
    6: "confusion",
    31: "fnt"
};

var musics = [
    {file: 'Battle! Brendan _ May.mp3', loopPos:14303},
    {file: 'Battle! Deoxys.mp3', loopPos:17959},
    {file: 'Battle! Elite Four.mp3', loopPos:13888},
    {file: 'Battle! Frontier Brain.mp3', loopPos:9198},
    {file: 'Battle! Gym Leader.mp3', loopPos:15331},
    {file: 'Battle! Rayquaza.mp3', loopPos:13579},
    {file: 'Battle! Regi Trio.mp3', loopPos:31976},
    {file: 'Battle! Trainer.mp3', loopPos:13579},
    {file: 'Battle! Zinnia.mp3', loopPos:15090},
    {file: 'Victory Road.mp3', loopPos:10950}
];

var musicdata = musics[Math.floor(Math.random()*musics.length)];

var music = new Howl({
  urls: ["public/assets/sounds/musics/"+musicdata.file],
  onend: function() {
  	console.log("on end");
  	music.pos(musicdata.loopPos);
  	music.play();
  }
});

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
	if (battle.sound === true) {
		playMusic(true);
	}
}

function updateHP(spot) {
	hpbar(spot).find(".hp").css("width", 150*battle.poke(spot).percent/100);
	hpbar(spot).find(".prevhp").css("width", 150*battle.poke(spot).percent/100+1);
	hpbar(spot).find(".hptext").text(Math.floor(battle.poke(spot).percent) + "%");
}

function updateStatus(spot) {
	var stat = hud(spot).find(".status");
	stat.removeClass();
	stat.addClass("status");
	stat.addClass(statusList[battle.poke(spot).status]);
}

function updateGender(spot) {
	var gnd = hud(spot).find(".gender");
	gnd.removeClass();gnd.addClass("gender");
	var val = battle.poke(spot).gender;
	if (val == 1) {
		gnd.addClass("male");
	} else if (val == 2) {
		gnd.addClass("female");
	}
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

function name(spot) {
	return hud(spot).find("strong");
};

function padd(s) {
	if (typeof s != "string") {
		s = '' + s;
	}
	while (s.length < 3) {
		s = '0' + s;
	}
	return s;
}

function playCry(spot) {
	if (battle.sound !== true) {
		return;
	}
	// todo : form: num + "-"+ subnum + ".wab"
	var sound = new Howl({
	  urls: ["public/assets/sounds/cries/"+padd(battle.poke(spot).num) + '.wav']
	}).play();
}


function playMusic(play) {
	if (play) {
		music.play();
	} else {
		music.pause();
	}
}

if (battle.sound != "unset") {
	$(".overlay").hide();
} else {
	$("#silent").click(function() {
		battle.setSound(false);
		$(".overlay").hide();
	});
	$("#nonsilent").click(function() {
		battle.setSound(true);
		$(".overlay").hide();
	});
}

$(function() {
		battle.on("sendout", function(spot) {
		sprite(spot).attr("src", PokeInfo.sprite(battle.poke(spot), {"back": battle.side(spot)}));
		name(spot).text(battle.rnick(spot));
		updateGender(spot);
		updateHP(spot);
		updateStatus(spot);
		hud(spot).show();
		playCry(spot);
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
		playCry(spot);
		sprite(spot).attr("src", "public/assets/images/blank.png");
		hud(spot).hide();
	});

	battle.on("hpchange", function(spot) {
		updateHP(spot);
	});

	battle.on("statuschange", function(spot) {
		updateStatus(spot);
	});
	battle.on("soundchanged", function(play) {playMusic(play);});

	$("#poke-0").mouseenter(function(){battle.trigger("battle-hover",0)})
				.mouseleave(function(){battle.trigger("battle-hover",-1)});
	$("#poke-1").mouseenter(function(){battle.trigger("battle-hover",1)})
				.mouseleave(function(){battle.trigger("battle-hover",-1)});

	position(0);
	position(1);

	init();

    battle.unpause();
});