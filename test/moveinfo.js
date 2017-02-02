var should = require("should");

import {MoveInfo} from '../app/assets/javascript/pokeinfo';
import '../app/assets/javascript/pokedex-full';

describe('moveinfo', function () {
  describe('.accuracy', function () {
    it('should resolve data from older/newer gens when not found', function () {
      MoveInfo.accuracy(3, 1).should.equal(85);
    });
  });
  describe('.category', function () {
    it('should resolve data from older/newer gens when not found', function () {
      MoveInfo.category(44, 3).should.equal(1);
    });
  });
  describe('.effect', function () {
    it('should resolve data from older/newer gens when not found', function () {
      MoveInfo.effect(34, 4).should.equal("Has a $effect_chance% chance to paralyze the target.");
    });
  });
  describe('.pp', function () {
    it('should resolve data from older/newer gens when not found', function () {
      MoveInfo.pp(26, 2).should.equal(25);
    });
  });
  describe('.type', function () {
    it('should resolve data from older/newer gens when not found', function () {
      // Flower Shield
      MoveInfo.type(592).should.equal(17);
    });
  });
  describe('.power', function () {
    it('should resolve data from older/newer gens when not found', function () {
      MoveInfo.power(143, 2).should.equal(140);
    });
    it("should use the given gen's data", function () {
      // Crabhammer: 90 in 5th, 100 in 6th
      MoveInfo.power(152, 5).should.equal(90);
      MoveInfo.power(152, 6).should.equal(100);
    });
  });
});
