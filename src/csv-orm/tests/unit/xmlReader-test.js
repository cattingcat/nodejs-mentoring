'use strict';

const
    chai = require("chai"),
    expect = chai.expect,
    ConfigReader = require('../../src/XmlConfigReader.js').ConfigReader;

chai.should();

let reader = new ConfigReader();


reader.readMappings(__dirname + '/data/test-config.xml', function(err, mappings) {
    describe('ConfigReader', function () {
        describe('#readMappings()', function () {
            it('should read all mappings', function() {
                mappings.should.have.property('onePropMapping');
                mappings.should.have.property('lineMapping');
                mappings.should.have.property('treeMapping');
				mappings.should.have.property('mappingWithRest');
            });

            it('should read onePropMapping correctly', function() {
                let map = mappings.onePropMapping;

                let propertyCount = map.length;
                propertyCount.should.equal(1);

                let nesting = map[0].length;
                nesting.should.equal(1);

                let propertyName = map[0][0].name;
                propertyName.should.equal('name');
            });

            it('should read lineMapping correctly', function() {
                let map = mappings.lineMapping;

                let propertyCount = map.length;
                propertyCount.should.equal(5);

                map.forEach(i => {
                    let nesting = i.length;
                    nesting.should.equal(1);
                });
            });

            it('should read treeMapping correctly', function() {
                let map = mappings.treeMapping;

                let propertyCount = map.length;
                propertyCount.should.equal(5);

                let nestings = [1, 1, 2, 2, 1];

                map.forEach((item, index) => {
                    let nesting = item.length;
                    nesting.should.equal(nestings[index]);
                });
            });

			it('should read mappingWithRest correctly', function() {
                let map = mappings.mappingWithRest;

                let propertyCount = map.length;
                propertyCount.should.equal(3);

				var restProp = map[2][0];
        		restProp.type.should.equal('rest');
            });
        });
    });
});
