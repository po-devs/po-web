import pokedex from "./pokedex";

import moves from '../../../db/pokes/all_moves.js';
import stats from '../../../db/pokes/stats.js';
import type1 from '../../../db/pokes/type1.js';
import type2 from '../../../db/pokes/type2.js';
import ab1 from '../../../db/pokes/ability1.js';
import ab2 from '../../../db/pokes/ability2.js';
import ab3 from '../../../db/pokes/ability3.js';
import fitem from '../../../db/pokes/item_for_forme.js';
import released from '../../../db/pokes/released.js';
import item_useful from '../../../db/items/item_useful.js';
import released_items from '../../../db/items/released_items.js';
import released_berries from '../../../db/items/released_berries.js';
import items_description from '../../../db/items/items_description.js';
import berries_description from '../../../db/items/berries_description.js';
import effect from '../../../db/moves/effect.js';
import effect_chance from '../../../db/moves/effect_chance.js';
import power from '../../../db/moves/power.js';
import accuracy from '../../../db/moves/accuracy.js';
import damage_class from '../../../db/moves/damage_class.js';
import pp from '../../../db/moves/pp.js';
import abilities from '../../../db/abilities/ability_desc.js';
import natures from '../../../db/natures/nature.js';

[moves, stats, type1, type2, ab1, ab2, ab3, fitem, released, item_useful, released_berries, released_items, items_description,
berries_description, effect, effect_chance, power, accuracy, damage_class, pp, abilities, natures].forEach(item => item(pokedex));

export default pokedex;