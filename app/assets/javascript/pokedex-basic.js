const pokedex = {};

import pokemons from '../../../db/pokes/pokemons.js';
import generations from '../../../db/generations.js';
import generationsOptions from '../../../db/generations.options.js';
import versions from '../../../db/gens/versions.js';

[pokemons, generations, generationsOptions, versions].forEach(item => item(pokedex));

export default pokedex;