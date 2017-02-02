var should = require("should");

import {GenInfo} from "../app/assets/javascript/pokeinfo";
import pokedex from "../app/assets/javascript/pokedex";

describe('geninfo', function () {
  var numGens = GenInfo.lastGen.num;

  describe('.getGen', function () {
    it('should convert non-objects', function () {
      GenInfo.getGen(1).should.eql({num: 1, subnum: 0});
      GenInfo.getGen(6).should.eql({num: 6, subnum: 0});
    });
    it('should range test generations', function () {
      GenInfo.getGen(-1).should.eql({num: 7, subnum: 0});
      GenInfo.getGen(numGens + 1).should.eql({num: 7, subnum: 0});
    });
    it('should not range test generations if correct is false', function () {
      GenInfo.getGen(10*65536, false).should.eql({num: 0, subnum: 10});
      GenInfo.getGen(numGens + 1, false).should.eql({num: numGens + 1, subnum: 0});
      GenInfo.getGen(undefined, false).should.eql({num: undefined, subnum: undefined});
    });
  });
  describe('.list', function () {
    it('should return the list of versions', function () {
      Object.assign(...GenInfo.list().map(d => ({[d]: GenInfo.version(d)}))).should.eql(pokedex.gens.versions);
      GenInfo.list().length.should.equal(Object.keys(pokedex.gens.versions).length);
    });
  });
  describe('.name', function () {
    it('should return the generation name if it exists', function () {
      GenInfo.name(3).should.equal("Generation 3");
      GenInfo.name({num: 4}).should.equal("Generation 4");
      GenInfo.name(6).should.equal("Generation 6");
      should(GenInfo.name(-1)).equal(undefined);
      should(GenInfo.name({num: "Generation 1"})).equal(undefined);
    });
  });
  describe('.options', function () {
    it('should return the list of generation options', function () {
      GenInfo.options().should.equal(pokedex.generations.options);
      Object.keys(GenInfo.options()).length.should.equal(numGens);
    });
  });
  describe('.option', function () {
    it('should return options specific to a generation if given', function () {
      GenInfo.option(1).sprite_folder.should.equal('yellow/');
      GenInfo.option(2).ability.should.equal(false);
      GenInfo.option({num: 4}).gender.should.equal(true);
      should(GenInfo.option(-1)).equal(undefined);
      GenInfo.option(6).animated.should.equal(true);
      GenInfo.option(7).animated.should.equal(false);
    });
  });
  describe('.hasOption', function () {
    it('should return true or false depending on if given gen has that option enabled', function () {
      GenInfo.hasOption(1, 'sprite_folder').should.equal(true);
      GenInfo.hasOption(2, 'ability').should.equal(false);
      GenInfo.hasOption({num: 4}, 'gender').should.equal(true);
    });
  });
});
