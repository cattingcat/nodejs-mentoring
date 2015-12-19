'use strict';

const
    chai = require("chai"),
    asyncjs = require('async'),
    expect = chai.expect;

chai.should();

describe('Async tests', function () {
    it('always true', function(){

        asyncjs.map([1, 2, 3], i => i + 5, o => {
            console.log(i)
            console.log('hi')
        });


    });
});
