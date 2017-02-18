var should = require("should");

import {StatusInfo} from "../app/assets/javascript/pokeinfo";
import pokedex from "../app/assets/javascript/pokedex";

describe('statusinfo', function () {
  describe('.list', function () {
    it('should return the list of statuses', function () {
      StatusInfo.list().should.equal(pokedex.status.status);
      Object.keys(StatusInfo.list()).length.should.equal(7);
    });
  });
  describe('.name', function () {
    it("should return the status' name", function () {
      StatusInfo.name(0).should.equal('fine');
      StatusInfo.name(2).should.equal('asleep');
      StatusInfo.name(5).should.equal('poisoned');
      StatusInfo.name(6).should.equal('confused');
    });
  });
});
