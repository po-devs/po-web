var should = require("should");
import {StatInfo} from "../app/assets/javascript/pokeinfo";
import pokedex from "../app/assets/javascript/pokedex";

describe('statinfo', function () {
  describe('.list', function () {
    it('should return the list of stats', function () {
      StatInfo.list().should.equal(pokedex.status.stats);
      Object.keys(StatInfo.list()).length.should.equal(8);
    });
  });
  describe('.name', function () {
    it("should return the stat's name", function () {
      StatInfo.name(0).should.equal('HP');
      StatInfo.name(3).should.equal('Sp. Att.');
      StatInfo.name(5).should.equal('Speed');
      StatInfo.name(7).should.equal('Evasion');
    });
  });
});
