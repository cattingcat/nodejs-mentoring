'use strict';

const
    xml2js = require('xml2js'),
    fs = require('fs');

function readMappings(filename, callback) {
    fs.readFile(filename, (err, data) => {
        if(err) {
            callback(err);
            return;
        }

        this.processXml(data, callback);
    });
}

function processXml(str, callback) {
    xml2js.parseString(str, (err, data) => {
        if(err) {
            callback(err);
            return;
        }

        let mappings = data.root.mapping;
        this.mappings = {};

        if(Array.isArray(mappings)) {
            mappings.forEach(i => {
                this.mappings[i.$.name] = this.processMapping(i);
            });

        } else {
            this.mappings[mappings.$.name] =
                this.processMapping(mappings);
        }

        callback(null, this.mappings);
    });
}

function processMapping(mapping) {
    let rootProperty = mapping.property;

    if(!Array.isArray(rootProperty)) rootProperty = [rootProperty];

    let stack = [],
        res = [];

    stack.push({node: rootProperty, index: 0});

    while(stack.length != 0) {
        let item = stack.pop(),
            props = item.node,
            len = props.length;

        for(let i = item.index; i < len; ++i) {
            let p = props[i];

            if(p.property) {
                stack.push({ node: props, index: i + 1 });
                stack.push({ node: p.property, index: 0 });
                break;

            } else {
                let item = []
                for(let j = 0; j < stack.length; ++j) {
                    let stackItem = stack[j];
                    item.push(stackItem.node[stackItem.index - 1].$);
                }
                item.push(p.$);
                res.push(item);
            }
        }
    }

    return res;
}


function XmlConfigReader() { }
XmlConfigReader.prototype.processMapping = processMapping;
XmlConfigReader.prototype.processXml = processXml;
XmlConfigReader.prototype.readMappings = readMappings;

exports.ConfigReader = XmlConfigReader;
