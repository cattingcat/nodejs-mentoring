'use strict';

const
    chai = require("chai"),
    expect = chai.expect,
    Mapper = require('../../lib/Mapper.js').Mapper,
    exceptions = require('../../lib/Exceptions.js'),
    MapperError = exceptions.MapperError;

chai.should();


let mapper = new Mapper();

describe('Mapper', function () {
    describe('#setProperty()', function () {
        it('should set property of empty obj {}', function() {
            let obj = {}
            mapper.setProperty(obj, ['a', 'b', 'c'], 42);
            expect(obj).to.have.deep.property('a.b.c', 42);
        });

        it('should set property of non empty obj {a: 1}', function() {
            let obj = {a: 1}
            mapper.setProperty(obj, ['a', 'b', 'c'], 42);
            expect(obj).to.have.deep.property('a.b.c', 42);
        });
    });

    describe('#getProperty()', function () {
        it('should get property by path', function() {
            let obj = {a: {b: {c: 42}}};
            let val = mapper.getProperty(obj, ['a', 'b', 'c']);

            expect(val).to.equal(42);
        });
    });

    describe('#map()', function () {
        it('should map simple linear objects', function() {
            let map = [
                [{ name: 'first' }],
                [{ name: 'second' }],
                [{ name: 'third' }]
            ];

            let arr = [1, 2, 3];

            let obj = mapper.map(arr, map);

            obj.should.have.property('first');
            obj.should.have.property('second');
            obj.should.have.property('third');

            expect(obj.first).to.equal(1);
            expect(obj.second).to.equal(2);
            expect(obj.third).to.equal(3);
        });

        it('should map nested objects', function() {
            let map = [
                [{ name: 'first' }],
                [{ name: 'nested' }, {name: 'second'}],
                [{ name: 'third' }]
            ];

            let arr = [1, 2, 3];

            let obj = mapper.map(arr, map);

            obj.should.have.property('first');
            obj.should.have.property('nested');
            obj.should.have.property('third');

            (obj.nested).should.have.property('second');

            expect(obj.first).to.equal(1);
            expect(obj.nested.second).to.equal(2);
            expect(obj.third).to.equal(3);
        });
    });

    describe('#processRelations()', function () {
        let map2 =  [
            [{ name: 'a' }],
            [{ name: 'b' }]
        ];
        let objects2 = [
            {a: 'a', b: 'b'}, {a: 'a1', b: 'b1'}, {a: 'a2', b: 'b2'}
        ];

        it('should process simple 1 to 1 relation', function() {
            let map1 = [
                [{ name: 'first' }],
                [{ name: 'second' }],
                [{ name: 'relation' }],
                [{ name: 'relationObj', relatedTo: 'map2', property: 'relation', relatedProperty: 'a' }]
            ];
            let objects1 = [
                {
                    first: 1,
                    second: 2,
                    relation: 'a1'
                }
            ];
            let options = [
                {mapping: 'map1'}, {mapping: 'map2'}
            ];

            let arrs = mapper.processRelations(options, [objects1, objects2], {map1: map1, map2: map2});

            expect(arrs[0]).to.equal(objects1);
            expect(arrs[1]).to.equal(objects2);

            expect(arrs[0][0]).to.equal(objects1[0]);

            expect(arrs[0][0].relationObj).to.equal(objects2[1]);

            expect(arrs[0][0].relationObj.a).to.equal('a1');
        });

        it('should process simple 1 to 1 relation with nesting at recipient entity', function() {
            let map1 = [
                [{ name: 'first' }],
                [{ name: 'second' }],
                [{ name: 'relation' }],
                [{name: 'nesting'},
                    { name: 'relationObj', relatedTo: 'map2', property: 'relation', relatedProperty: 'a' }]
            ];
            let objects1 = [
                {
                    first: 1,
                    second: 2,
                    relation: 'a1'
                }
            ];
            let options = [
                {mapping: 'map1'}, {mapping: 'map2'}
            ];

            let arrs = mapper.processRelations(options, [objects1, objects2], {map1: map1, map2: map2});

            expect(arrs[0]).to.equal(objects1);
            expect(arrs[1]).to.equal(objects2);

            expect(arrs[0][0]).to.equal(objects1[0]);

            expect(arrs[0][0].nesting.relationObj).to.equal(objects2[1]);

            expect(arrs[0][0].nesting.relationObj.a).to.equal('a1');
        });

        it('should process simple 1 to 1 relation with nesting at donor entity', function() {
            let map1 = [
                [{ name: 'first' }],
                [{ name: 'second' }],
                [{ name: 'relation' }],
                [{ name: 'relationObj', relatedTo: 'map2', property: 'relation', relatedProperty: 'nested.a' }]
            ];
            let objects1 = [
                {
                    first: 1,
                    second: 2,
                    relation: 'a1'
                }
            ];
            let map2 =  [
                [{name: 'nested'}, { name: 'a' }],
                [{ name: 'b' }]
            ];
            let objects2 = [
                {nested: { a: 'a'  }, b: 'b'},
                {nested: { a: 'a1' }, b: 'b1'},
                {nested: { a: 'a2' }, b: 'b2'}
            ];

            let options = [
                {mapping: 'map1'}, {mapping: 'map2'}
            ];

            let arrs = mapper.processRelations(options, [objects1, objects2], {map1: map1, map2: map2});

            expect(arrs[0]).to.equal(objects1);
            expect(arrs[1]).to.equal(objects2);

            expect(arrs[0][0]).to.equal(objects1[0]);

            expect(arrs[0][0].relationObj).to.equal(objects2[1]);

            expect(arrs[0][0].relationObj.nested.a).to.equal('a1');
        });

        it('should throws error if arguments incorrect', function() {
            let map1 = [
                [{ name: 'first' }],
                [{ name: 'second' }],
                [{ name: 'relation' }],
                [{ name: 'relationObj', relatedTo: 'map2', property: 'relation', relatedProperty: 'a' }]
            ];
            let objects1 = [
                {
                    first: 1,
                    second: 2,
                    relation: 'a1'
                }
            ];
            let options = [
                {mapping: 'map1'} // error, only one mapping
            ];

            let arrs;
            expect(() => {
                arrs = mapper.processRelations(options, [objects1, objects2], {map1: map1, map2: map2});
            }).to.throw(MapperError)

            expect(() => {
                arrs = mapper.processRelations(options, [objects1, objects2], {map1: map1, map2: map2});
            }).to.throw(Error)
        });
    });
});
