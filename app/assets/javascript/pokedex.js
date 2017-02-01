const pokedex = {};

import moves from '../../../db/moves/moves.js';
import moveMessages from '../../../db/moves/move_message.js';
import moveTypes from '../../../db/moves/type.js';
import pokemons from '../../../db/pokes/pokemons.js';
import generations from '../../../db/generations.js';
import generationsOptions from '../../../db/generations.options.js';
import abilities from '../../../db/abilities/abilities.js';
import abilityMessages from '../../../db/abilities/ability_messages.js';
import items from '../../../db/items/items.js';
import berries from '../../../db/items/berries.js';
import itemMessages from '../../../db/items/item_messages.js';
import berryMessages from '../../../db/items/berry_messages.js';
import stats from '../../../db/status/stats.js';
import status from '../../../db/status/status.js';
import types from '../../../db/types/types.js';
import typeCategories from '../../../db/types/category.js';
import categories from '../../../db/categories/categories.js';
import versions from '../../../db/gens/versions.js';

[moves, moveMessages, moveTypes, pokemons, generations, generationsOptions, abilities, abilityMessages, items, berryMessages, 
 stats, status, types, typeCategories, categories, versions].forEach(item => item(pokedex));

export default pokedex;