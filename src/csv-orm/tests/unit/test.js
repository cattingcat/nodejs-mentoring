'use strict';

const
    chai = require("chai"),
    expect = chai.expect;

chai.should();

describe('Common tests', function () {
    it('always true', function(){
        [1,2,3,4].should.have.length(4);
    });
});
