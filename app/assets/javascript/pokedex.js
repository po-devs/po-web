import pokedex from "./pokedex-basic";

import moves from '../../../db/moves/moves.js';
import moveMessages from '../../../db/moves/move_message.js';
import moveTypes from '../../../db/moves/type.js';
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

[moves, moveMessages, moveTypes, abilities, abilityMessages, items, berries, 
itemMessages, berryMessages, stats, status, types, typeCategories, categories].forEach(item => item(pokedex));

export default pokedex;