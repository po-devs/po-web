if(!pokedex.generations)pokedex.generations={};
pokedex.generations.options = {
1:{
	gender:false, // if this gen has gender selection
	shiny:false, // if this gen has shinies
	special_stat:true, // if this gen has a single special stat
	special_stats_same:true, // if all special stats have the same value/ivs/evs
	damage_classes_move_specific:false, // if the category of a move is specific to it or is it depending on its type
	happiness:false, // if this gen has happiness
	ivs_limit:15, // the maximum number of ivs
	hidden_power:false,
	hidden_power_bp:false,
	ability:false,
	nature:false,
	item:false,
	evs:false,
	types_ids:[0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15],
	num_pokemon: 151,
	num_moves: 165,
	sprite_folder:'http://pokemon-online.eu/images/pokemon/red-blue/'
},
2:{
	gender:true,
	shiny:true,
	special_stat:false,
	special_stats_same:true,
	damage_classes_move_specific:false,
	happiness:true,
	ivs_limit:15,
	hidden_power:true,
	hidden_power_bp:false,
	ability:false,
	nature:false,
	item:true,
	evs:false,
	types_ids:[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
	num_pokemon: 251,
	num_moves: 251,
	sprite_folder:'http://pokemon-online.eu/images/pokemon/crystal/'
},
3:{
	gender:true,
	shiny:true,
	special_stat:false,
	special_stats_same:false,
	damage_classes_move_specific:false,
	happiness:true,
	ivs_limit:31,
	hidden_power:true,
	hidden_power_bp:false,
	ability:true,
	nature:true,
	item:true,
	evs:true,
	types_ids:[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
	num_pokemon: 386,
	num_moves: 353,
	sprite_folder:'http://pokemon-online.eu/images/pokemon/emerald/'
},
4:{
	gender:true,
	shiny:true,
	special_stat:false,
	special_stats_same:false,
	damage_classes_move_specific:true,
	happiness:true,
	ivs_limit:31,
	hidden_power:true,
	hidden_power_bp:false,
	ability:true,
	nature:true,
	item:true,
	evs:true,
	types_ids:[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
	num_pokemon: 493,
	num_moves: 467,
	sprite_folder:'http://pokemon-online.eu/images/pokemon/platinum/'
},
5:{
	gender:true,
	shiny:true,
	special_stat:false,
	special_stats_same:false,
	damage_classes_move_specific:true,
	happiness:true,
	ivs_limit:31,
	hidden_power:true,
	hidden_power_bp:false,
	ability:true,
	nature:true,
	item:true,
	evs:true,
	types_ids:[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
	num_pokemon: 649,
	num_moves: 559,
	sprite_folder:'http://pokemon-online.eu/images/pokemon/black-white/'
},
6:{
	gender:true,
	shiny:true,
	special_stat:false,
	special_stats_same:false,
	damage_classes_move_specific:true,
	happiness:true,
	ivs_limit:31,
	hidden_power:true,
	hidden_power_bp:60,
	ability:true,
	nature:true,
	item:true,
	evs:true,
	types_ids:[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
	num_pokemon: 718,
	num_moves: 607,
	sprite_folder:'http://pokemon-online.eu/images/pokemon/x-y/'
}
};