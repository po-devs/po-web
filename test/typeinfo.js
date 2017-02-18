var should = require("should");

import {TypeInfo} from "../app/assets/javascript/pokeinfo";
import pokedex from "../app/assets/javascript/pokedex";

describe('typeinfo', function () {
  describe('.list', function () {
    it('should return the list of types', function () {
      TypeInfo.list().should.equal(pokedex.types.types);
      Object.keys(TypeInfo.list()).length.should.equal(19);
    });
  });
  describe('.name', function () {
    it('should return the type name', function () {
      TypeInfo.name(0).should.equal('Normal');
      TypeInfo.name(17).should.equal('Fairy');
      TypeInfo.name(18).should.equal('???');
    });
  });
  describe('.categoryList', function () {
    it('should return the list of categories', function () {
      TypeInfo.categoryList().should.equal(pokedex.types.category);
      Object.keys(TypeInfo.categoryList()).length.should.equal(19);
    });
  });
  describe('.category', function () {
    it('should return the category id', function () {
      TypeInfo.category(0).should.equal(1);
      TypeInfo.category(9).should.equal(2);
      TypeInfo.category(14).should.equal(2);
      TypeInfo.category(18).should.equal(1);
    });
  });
});
