'use strict';

const
    chai = require("chai"),
    expect = chai.expect,
    parserLib = require('../../lib/CsvParser.js'),
    Parser = parserLib.get('state');

chai.should();

let parser = new Parser();


describe('Parser', function(){
    describe('#parse()', function(){
       it('should parse simple CVS', function(){
           let cvs = 'qwe,asd,1,2';
           var arr = parser.parse(cvs);

           arr.should.have.length(4);

           expect(arr[0]).to.equal('qwe');
           expect(arr[1]).to.equal('asd');
           expect(arr[2]).to.equal('1');
           expect(arr[3]).to.equal('2');
       });

       it('should parse CVS with quotes and whitespaces', function(){
           let cvs = '"qwe","a sd",1,2';
           var arr = parser.parse(cvs);

           arr.should.have.length(4);

           expect(arr[0]).to.equal('qwe');
           expect(arr[1]).to.equal('a sd');
           expect(arr[2]).to.equal('1');
           expect(arr[3]).to.equal('2');
       });

       it('should parse CVS with commas inside quotes', function(){
           let cvs = '"q,w,e","a sd",1,2';
           var arr = parser.parse(cvs);

           arr.should.have.length(4);

           expect(arr[0]).to.equal('q,w,e');
           expect(arr[1]).to.equal('a sd');
           expect(arr[2]).to.equal('1');
           expect(arr[3]).to.equal('2');
       });

       it('should parse CVS with commas-value at end', function(){
           let cvs = '"q,w,e","a sd",1,"22"';
           var arr = parser.parse(cvs);

           arr.should.have.length(4);

           expect(arr[0]).to.equal('q,w,e');
           expect(arr[1]).to.equal('a sd');
           expect(arr[2]).to.equal('1');
           expect(arr[3]).to.equal('22');
       });

       it('should parse CVS with empty elements', function(){
           let cvs = 'qwe,asd,,1,2';
           var arr = parser.parse(cvs);

           arr.should.have.length(5);

           expect(arr[0]).to.equal('qwe');
           expect(arr[1]).to.equal('asd');
           expect(arr[2]).to.equal(null);
           expect(arr[3]).to.equal('1');
           expect(arr[4]).to.equal('2');
       });

       it('should parse CVS with ALL empty elements', function(){
           let cvs = ',,,,';
           var arr = parser.parse(cvs);

           arr.should.have.length(5);

           expect(arr[0]).to.equal(null);
           expect(arr[1]).to.equal(null);
           expect(arr[2]).to.equal(null);
           expect(arr[3]).to.equal(null);
           expect(arr[4]).to.equal(null);
       });
   });
});
