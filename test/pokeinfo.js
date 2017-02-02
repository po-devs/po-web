var should = require("should");

import {PokeInfo} from '../app/assets/javascript/pokeinfo';
import '../app/assets/javascript/pokedex-full';

describe('pokeinfo', function () {
  describe('.toNum', function () {
    it('should return a number if given one', function () {
      PokeInfo.toNum(40).should.equal(40);
    });
    it('should deal with formes', function () {
      PokeInfo.toNum({num: 3, forme: 1}).should.equal((1 << 16) + 3);
    });
  });

  describe('.toArray', function () {
    it('should convert numbers to arrays', function () {
      PokeInfo.toArray(493).should.eql([493, 0]);
      PokeInfo.toArray(200).should.eql([200, 0]);
    });
    it('should convert strings to arrays', function () {
      PokeInfo.toArray("493").should.eql([493, 0]);
      PokeInfo.toArray("493-2").should.eql([493, 2]);
      PokeInfo.toArray("262637").should.eql([493, 4]);
    });
    it('should fix up arrays', function () {
      PokeInfo.toArray(["493", "0"]).should.eql([493, 0]);
    });
  });

  describe('.types', function () {
    it('should resolve data from older/newer gens when not found', function () {
      // Pidgeot
      PokeInfo.types(18, 4).should.eql([0, 2]); // Normal Flying

      // Clefairy in gen 1
      PokeInfo.types(35, 1).should.eql([0]); // Normal
      // Clefairy in gen 6
      PokeInfo.types(35).should.eql([17]); // Fairy

      // Retest, to make sure internal expand didn't touch anything
      // Clefairy in gen 1
      PokeInfo.types(35, 1).should.eql([0]); // Normal
      // Clefairy in gen 6
      PokeInfo.types(35).should.eql([17]); // Fairy
    });
  });

  describe('.stats', function () {
    it("should use the given gen's data", function () {
      // Butterfree
      PokeInfo.stats(12, 3).should.eql([60, 45, 50, 80, 80, 70]);
      PokeInfo.stats(12, 6).should.eql([60, 45, 50, 90, 80, 70]);
    });
  });

  describe('.sprite', function () {
    it('should generate sprite urls from parameters', function () {
      PokeInfo.sprite({num: 1, gen: 6}).should.equal("http://pokemon-online.eu/images/pokemon/x-y/animated/001.gif");
      PokeInfo.sprite({num: 1, gen: {num: 6}}).should.equal("http://pokemon-online.eu/images/pokemon/x-y/animated/001.gif");
      PokeInfo.sprite({num: 1}).should.equal("http://pokemon-online.eu/images/pokemon/x-y/animated/001.gif");
      PokeInfo.sprite({num: 3, forme: 1, gen: {num: 6}}).should.equal("http://pokemon-online.eu/images/pokemon/x-y/animated/003-1.gif");
      PokeInfo.sprite({num: 3, forme: 1, gen: {num: 6}}, {back: true}).should.equal("http://pokemon-online.eu/images/pokemon/x-y/animated/back/003-1.gif");
    });
  });

  describe('.trainerSprite', function () {
    it('should generate sprite urls from parameters', function () {
      PokeInfo.trainerSprite(200).should.equal('http://pokemon-online.eu/images/trainers/200.png');
    });
  });
});
