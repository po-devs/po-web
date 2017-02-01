import $ from "jquery";
import BattleTab from "./battletab";
import {PokeInfo} from "../PokeInfo";

var spritelist = {};
var hudlist = {};

var musics = [
    {file: 'Battle! Brendan _ May.mp3', loopPos:14303, duration: 69130},
    {file: 'Battle! Deoxys.mp3', loopPos:17959, duration: 83370},
    {file: 'Battle! Elite Four.mp3', loopPos:13888, duration: 64450},
    {file: 'Battle! Frontier Brain.mp3', loopPos:9198, duration: 99328},
    {file: 'Battle! Gym Leader.mp3', loopPos:15331, duration: 79280},
    {file: 'Battle! Rayquaza.mp3', loopPos:13579, duration: 52880},
    {file: 'Battle! Regi Trio.mp3', loopPos:31976, duration: 62160},
    {file: 'Battle! Trainer.mp3', loopPos:13579, duration: 91530},
    {file: 'Battle! Zinnia.mp3', loopPos:15090, duration: 95498},
    {file: 'Victory Road.mp3', loopPos:10950, duration: 55861}
];

var musicdata = musics[Math.floor(Math.random()*musics.length)];
musicdata.looped = false;

var music = new Howl({
  urls: ["/sounds/musics/"+musicdata.file],
  sprite: {
  	intro: [0, musicdata.loopPos],
  	theme: [musicdata.loopPos, musicdata.duration-musicdata.loopPos, true]
  },
  onend: function() {
  	if (!musicdata.looped) {
  		musicdata.looped = true;
  		music.play("theme");
  	}
  	console.log("on end: " + musicdata.file + ", " + music.pos());
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

function updateHP(spot, animated) {
	var percent = battle.poke(spot).percent;
	if (!animated) {
		hpbar(spot).find(".hp").css("width", 147*percent/100);
		hpbar(spot).find(".prevhp").css("width", 147*percent/100);
		hpbar(spot).find(".hptext").text(Math.floor(percent) + "%");
	} else {
		pause();
		var hp = hpbar(spot).find(".hp");
		var txt = hpbar(spot).find(".hptext");
		hp.animate({
			width: 147*percent/100
		}, {
			duration: 1200,
			easing: "linear",
			step: function(now/* , tween */) {txt.text(Math.floor(now/1.5) + "%")},
			complete: function(){
				hpbar(spot).find(".prevhp").css("width", 147*percent/100+1);
			    unpause();
			}
		});
	}
}

function updateStatus(spot) {
	var stat = hud(spot).find(".status");
	stat.removeClass();
	stat.addClass("status");
	stat.addClass(BattleTab.statuses[battle.poke(spot).status]);
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
		hudlist[spot] = $("#poke-" + spot + " .pokehud");
	}
	return hudlist[spot];
}

function sprite(spot) {
	if (!(spot in spritelist)) {
		spritelist[spot] = $("#poke-" + spot + " img.poke-sprite");
	}
	return spritelist[spot];
}

function name(spot) {
	return hud(spot).find("strong");
}

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
	  urls: ["/sounds/cries/"+padd(battle.poke(spot).num) + '.wav']
    });
    sound.play();
}


function playMusic(play) {
	if (play) {
		music.play("intro");
	} else {
		//music.pause();
		/* howler.js doesn't handle pausing / playing well with sprites and loops,
		 so instead stopping music completely and restarting from the beginning
		 if reactivated */
		music.stop();
		musicdata.looped = false;
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

var pauseCounter = 0;

function pause() {
	if (pauseCounter == 0) {
		battle.pause();
	}
	pauseCounter += 1;
}

function unpause() {
	pauseCounter -= 1;
    if (pauseCounter == 0) {
    	battle.unpause();
    }
    if (pauseCounter < 0) {
    	pauseCounter = 0;
    }
}

function updateSprite(spot) {
    var side = battle.side(spot);
	if (battle.poke(spot).substitute) {
        sprite(spot).attr("src", PokeInfo.substituteSprite(side));
	} else {
		sprite(spot).attr("src", PokeInfo.sprite(battle.poke(spot), {"back": side}));
	}
}

function playWeather(weather) {
    /* 1 = hail, rain, sand, sun */
    var weathers = {
        1: "hail",
        2: "rain",
        3: "sand",
        4: "sun"
    }

    pause();
    $("#weather-overlay").removeClass().addClass(weathers[weather]);
    $("#weather-overlay").show().animate({"opacity": 0.4}, {duration: 200, easing: "linear"})
                         .animate({"opacity": 0.4}, {duration: 800})
                         .animate({"opacity": 0}, {duration: 200, easing: "linear", complete:unpause}).hide();
}

$(function() {
	battle.on("sendout", function(spot) {
        updateSprite(spot);
		name(spot).text(battle.rnick(spot));
		updateGender(spot);
		updateHP(spot);
		updateStatus(spot);
		hud(spot).show();
		playCry(spot);
	});

	battle.on("reappear", function(spot) {
		updateSprite(spot);
	});

	battle.on("spritechange", function(spot) {
        updateSprite(spot);
	});

	battle.on("sendback", function(spot) {
		sprite(spot).attr("src", "/images/blank.png");
		hud(spot).hide();
	});

	battle.on("vanish", function(spot) {
		sprite(spot).attr("src", "/images/blank.png");
	});

	battle.on("ko", function(spot) {
		playCry(spot);
		sprite(spot).attr("src", "/images/blank.png");
		hud(spot).hide();
	});

	battle.on("hpchange", function(spot) {
		updateHP(spot, true);
	});

	battle.on("statuschange", function(spot) {
		updateStatus(spot);
	});

	battle.on("substitute", function(spot/*, sub */) {
		updateSprite(spot);
	});

    battle.on("weather", function(weather) {
        playWeather(weather);
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
