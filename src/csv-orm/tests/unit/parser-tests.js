'use strict';

const
    chai = require("chai"),
    expect = chai.expect,
    parserLib = require('../../src/CsvParser.js'),
    Parser = parserLib.get('state');

chai.should();

let parser = new Parser();


describe('Parser', function(){
    describe('#parse()', function(){
       it('should parse simple CSV', function(){
           let csv = 'qwe,asd,1,2';
           var arr = parser.parse(csv);

           arr.should.have.length(4);

           expect(arr[0]).to.equal('qwe');
           expect(arr[1]).to.equal('asd');
           expect(arr[2]).to.equal('1');
           expect(arr[3]).to.equal('2');
       });

       it('should parse CSV with quotes and whitespaces', function(){
           let csv = '"qwe","a sd",1,2';
           var arr = parser.parse(csv);

           arr.should.have.length(4);

           expect(arr[0]).to.equal('qwe');
           expect(arr[1]).to.equal('a sd');
           expect(arr[2]).to.equal('1');
           expect(arr[3]).to.equal('2');
       });

       it('should parse CSV with commas inside quotes', function(){
           let csv = '"q,w,e","a sd",1,2';
           var arr = parser.parse(csv);

           arr.should.have.length(4);

           expect(arr[0]).to.equal('q,w,e');
           expect(arr[1]).to.equal('a sd');
           expect(arr[2]).to.equal('1');
           expect(arr[3]).to.equal('2');
       });

       it('should parse CSV with commas-value at end', function(){
           let csv = '"q,w,e","a sd",1,"22"';
           var arr = parser.parse(csv);

           arr.should.have.length(4);

           expect(arr[0]).to.equal('q,w,e');
           expect(arr[1]).to.equal('a sd');
           expect(arr[2]).to.equal('1');
           expect(arr[3]).to.equal('22');
       });

       it('should parse CSV with empty elements', function(){
           let csv = 'qwe,asd,,1,2';
           var arr = parser.parse(csv);

           arr.should.have.length(5);

           expect(arr[0]).to.equal('qwe');
           expect(arr[1]).to.equal('asd');
           expect(arr[2]).to.equal(null);
           expect(arr[3]).to.equal('1');
           expect(arr[4]).to.equal('2');
       });

       it('should parse CSV with ALL empty elements', function(){
           let csv = ',,,,';
           var arr = parser.parse(csv);

           arr.should.have.length(5);

           expect(arr[0]).to.equal(null);
           expect(arr[1]).to.equal(null);
           expect(arr[2]).to.equal(null);
           expect(arr[3]).to.equal(null);
           expect(arr[4]).to.equal(null);
       });

       it('should throw exception if CSV file invalid (no close quote)', function(){
           let csv = 'qwe,333,"dfg,77';

           expect(() => {
               var arr = parser.parse(csv);
           }).to.throw(SyntaxError, /missed/)
       });

       it('should throw exception if CSV file invalid (comma in middle of value)', function(){
           let csv = 'qwe,333,sdf"dfg,77';

           expect(() => {
               var arr = parser.parse(csv);
           }).to.throw(SyntaxError, /middle/)
       });
   });
});
