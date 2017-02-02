var should = require("should");

var {AbilityInfo} = require('../app/assets/javascript/pokeinfo');
import pokedex from "../app/assets/javascript/pokedex";

describe('abilityinfo', function () {
  describe('.list', function () {
    it('should return the list of abilities', function () {
      AbilityInfo.list().should.equal(pokedex.abilities.abilities);
    });
  });
  describe('.name', function () {
    it("should return the ability's name", function () {
      AbilityInfo.name(62).should.equal('Guts');
      AbilityInfo.name(105).should.equal('Super Luck');
      AbilityInfo.name(141).should.equal('Moody');
      AbilityInfo.name(171).should.equal('Fur Coat');
      AbilityInfo.name(187).should.equal('Magician');
    });
  });
  describe('.desc', function () {
    it("should return the ability's description", function () {
      AbilityInfo.desc(62).should.equal("Boosts Attack if there is a status problem.");
      AbilityInfo.desc(105).should.equal("Heightens the critical-hit ratios of moves.");
      AbilityInfo.desc(141).should.equal("Raises a random stat two stages and lowers another one stage after each turn.");
        // Unimplemented
        //AbilityInfo.desc(171).should.equal('');
        //AbilityInfo.desc(187).should.equal('');
      });
  });
  describe('.message', function () {
    it("should return an empty string if the ability doesn't have a message", function () {
      AbilityInfo.message(-1).should.equal('');
      AbilityInfo.message(Object.keys(pokedex.abilities.abilities).length).should.equal('');
    });
    it("should return the ability's message", function () {
      // Wonder Guard
      AbilityInfo.message(71).should.equal("%s's Wonder Guard evades the attack!");
      // Flash Fire
      AbilityInfo.message(19).should.equal("%s's Flash Fire raised the power of its Fire-type moves!");
      AbilityInfo.message(19, 1).should.equal("%s's Flash Fire made %m ineffective!");
    });
    it("it should return an empty string if the requested part doesn't exist", function () {
      // Defiant - Defiant sharply raised %s's Attack!
      AbilityInfo.message(80, 1).should.equal('');
    });
  });
});
