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
        let path = ['a', 'b', 'c'];

        it('should set property of empty obj {}', function() {
            let obj = {}

            mapper.setProperty(obj, path, 42);

            expect(obj).to.have.deep.property('a.b.c', 42);
        });

        it('should set property of non empty obj {a: 1}', function() {
            let obj = {a: 1}

            mapper.setProperty(obj, path, 42);

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

    describe('#toObject()', function () {
        let arr = [1, 2, 3];

        it('should process mapping without indexes', function() {
            let mapping = [
                [{name: 'a'}],
                [{name: 'b'}],
                [{name: 'c'}]
            ];

            let obj = mapper.toObject(arr, mapping);

            expect(obj.a).to.equal(1);
            expect(obj.b).to.equal(2);
            expect(obj.c).to.equal(3);
        });

        it('should process mapping with indexes', function() {
            let mapping = [
                [{name: 'a', index: 2}],
                [{name: 'b', index: 0}],
                [{name: 'c', index: 1}]
            ];

            let obj = mapper.toObject(arr, mapping);

            expect(obj.a).to.equal(3);
            expect(obj.b).to.equal(1);
            expect(obj.c).to.equal(2);
        });

        it('should map simple linear objects', function() {
            let map = [
                [{ name: 'first' }],
                [{ name: 'second' }],
                [{ name: 'third' }]
            ];

            let arr = [1, 2, 3];

            let obj = mapper.toObject(arr, map);

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

            let obj = mapper.toObject(arr, map);

            obj.should.have.property('first');
            obj.should.have.property('nested');
            obj.should.have.property('third');

            (obj.nested).should.have.property('second');

            expect(obj.first).to.equal(1);
            expect(obj.nested.second).to.equal(2);
            expect(obj.third).to.equal(3);
        });
    });

    describe('#toArray()', function () {
         let obj = {a:1, b:2, c:3};

        it('should process mapping without indexex', function() {
            let mapping = [
                [{name: 'a'}],
                [{name: 'b'}],
                [{name: 'c'}]
            ];

            let arr = mapper.toArray(obj, mapping);

            expect(arr[0]).to.equal(obj.a);
            expect(arr[1]).to.equal(obj.b);
            expect(arr[2]).to.equal(obj.c);
        });

        it('should process mapping with indexex', function() {
            let mapping = [
                [{name: 'a', index: 2}],
                [{name: 'b', index: 0}],
                [{name: 'c', index: 1}]
            ];

            let arr = mapper.toArray(obj, mapping);

            expect(arr[0]).to.equal(obj.b);
            expect(arr[1]).to.equal(obj.c);
            expect(arr[2]).to.equal(obj.a);
        });

        it('should process mapping with nested properties', function() {
            let obj = {a:1, b:{d: 3}, c:2};
            let mapping = [
                [{name: 'a'}],
                [{name: 'b'}, {name: 'd'}],
                [{name: 'c'}]
            ];

            let arr = mapper.toArray(obj, mapping);

            expect(arr[0]).to.equal(obj.a);
            expect(arr[1]).to.equal(obj.b.d);
            expect(arr[2]).to.equal(obj.c);
        });

        it('should process mapping with not all properties', function() {
            let obj = {a:1, c:{d: 3}};
            let mapping = [
                [{name: 'a'}],
                [{name: 'c'}, {name: 'd'}]
            ];

            let arr = mapper.toArray(obj, mapping);

            expect(arr[0]).to.equal(obj.a);
            expect(arr[1]).to.equal(obj.c.d);
        });
    });

    describe('#processRelations()', function () {
        let map1,
            map2 =  [
                [{ name: 'a' }],
                [{ name: 'b' }]
            ];
        let objects1,
            objects2 = [
                {a: 'a', b: 'b'}, {a: 'a1', b: 'b1'}, {a: 'a2', b: 'b2'}
            ];

        it('should process simple 1 to 1 relation', function() {
            map1 = [
                [{ name: 'first' }],
                [{ name: 'second' }],
                [{ name: 'relation' }],
                [{ name: 'relationObj', relatedTo: 'map2', property: 'relation', relatedProperty: 'a' }]
            ];
            objects1 = [
                {
                    first: 1,
                    second: 2,
                    relation: 'a1'
                }
            ];

            let options = [
                {
                    name: 'map1',
                    mapping: map1,
                    collection: objects1
                },
                {
                    name: 'map2',
                    mapping: map2,
                    collection: objects2
                }
            ];

            let arrs = mapper.processRelations(options);

            expect(arrs[0].collection).to.equal(objects1);
            expect(arrs[1].collection).to.equal(objects2);

            expect(arrs[0].collection[0]).to.equal(objects1[0]);

            expect(arrs[0].collection[0].relationObj).to.equal(objects2[1]);

            expect(arrs[0].collection[0].relationObj.a).to.equal('a1');
        });

        it('should process simple 1 to 1 relation with nesting at recipient entity', function() {
            map1 = [
                [{ name: 'first' }],
                [{ name: 'second' }],
                [{ name: 'relation' }],
                [{name: 'nesting'},
                    { name: 'relationObj', relatedTo: 'map2', property: 'relation', relatedProperty: 'a' }]
            ];
            objects1 = [
                {
                    first: 1,
                    second: 2,
                    relation: 'a1'
                }
            ];

            let options = [
                {
                    name: 'map1',
                    mapping: map1,
                    collection: objects1
                },
                {
                    name: 'map2',
                    mapping: map2,
                    collection: objects2
                }
            ];

            let arrs = mapper.processRelations(options);

            expect(arrs[0].collection).to.equal(objects1);
            expect(arrs[1].collection).to.equal(objects2);

            expect(arrs[0].collection[0]).to.equal(objects1[0]);

            expect(arrs[0].collection[0].nesting.relationObj).to.equal(objects2[1]);

            expect(arrs[0].collection[0].nesting.relationObj.a).to.equal('a1');
        });

        it('should process simple 1 to 1 relation with nesting at donor entity', function() {
            map1 = [
                [{ name: 'first' }],
                [{ name: 'second' }],
                [{ name: 'relation' }],
                [{ name: 'relationObj', relatedTo: 'map2', property: 'relation', relatedProperty: 'nested.a' }]
            ];
            objects1 = [
                {
                    first: 1,
                    second: 2,
                    relation: 'a1'
                }
            ];
            map2 =  [
                [{name: 'nested'}, { name: 'a' }],
                [{ name: 'b' }]
            ];
            objects2 = [
                {nested: { a: 'a'  }, b: 'b'},
                {nested: { a: 'a1' }, b: 'b1'},
                {nested: { a: 'a2' }, b: 'b2'}
            ];

            let options = [
                {
                    name: 'map1',
                    mapping: map1,
                    collection: objects1
                },
                {
                    name: 'map2',
                    mapping: map2,
                    collection: objects2
                }
            ];

            let arrs = mapper.processRelations(options);

            expect(arrs[0].collection).to.equal(objects1);
            expect(arrs[1].collection).to.equal(objects2);

            expect(arrs[0].collection[0]).to.equal(objects1[0]);

            expect(arrs[0].collection[0].relationObj).to.equal(objects2[1]);

            expect(arrs[0].collection[0].relationObj.nested.a).to.equal('a1');
        });

        it('should throws error if arguments incorrect', function() {
            map1 = [
                [{ name: 'first' }],
                [{ name: 'second' }],
                [{ name: 'relation' }],
                [{ name: 'relationObj', relatedTo: 'map2', property: 'relation', relatedProperty: 'a' }]
            ];
            objects1 = [
                {
                    first: 1,
                    second: 2,
                    relation: 'a1'
                }
            ];
            let options = [
                {
                    name: 'map1',
                    mapping: map1,
                    collection: objects1
                }
            ];

            let arrs;
            expect(() => {
                arrs = mapper.processRelations(options);
            }).to.throw(MapperError);

            expect(() => {
                arrs = mapper.processRelations(options);
            }).to.throw(Error);
        });
    });
});
