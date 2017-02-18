var should = require("should");

import {GenderInfo} from "../app/assets/javascript/pokeinfo";

describe('genderinfo', function () {
    describe('.name', function () {
        it("should return the gender's name", function () {
            GenderInfo.name(1).should.equal('male');
            GenderInfo.name(2).should.equal('female');
            GenderInfo.name(3).should.equal('neutral');
        });
    });
});
