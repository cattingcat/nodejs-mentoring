'use strict';

const
    exceptions = require('./Exceptions.js'),
    MapperError = exceptions.MapperError;

function setProperty(obj, propPath, value) {
    let len = propPath.length;

    if(len == 1) {
        let item = propPath[0];
        obj[item] = value;

    } else {
        let subObj = obj;
        for(let i = 0; i < len; ++i) {
            let item = propPath[i];

            if(i == len - 1) {
                subObj[item] = value;
                break;
            }

            let o = subObj[item];
            if(o instanceof Object) {
                subObj = o;
            } else {
                o = {};
                subObj[item] = o;
                subObj = o
            }
        }
    }
}

function getProperty(obj, propPath) {
    let len = propPath.length,
        subObj = obj;

    for(let i = 0; i < len; ++i) {
        let propName = propPath[i];
        subObj = subObj[propName];
    }

    return subObj;
}

function relationInfo(path) {
    let len = path.length,
        lastItem = path[len - 1];

    if(lastItem.relatedTo) {
        lastItem.isRelation = true;
    }

    return lastItem;
}

function toObject(arr, mapping) {
    let obj = {};

    let arrayIndex = 0;
    mapping.forEach(path => {
        let info = relationInfo(path),
            stringArrPath = path.map(i => i.name);

        if(info.isRelation) {
            setProperty(obj, stringArrPath, 'To be related to ' + info.relatedTo);
        } else {
            let arrIndex = !isNaN(info.index) ? info.index : arrayIndex;

            setProperty(obj, stringArrPath, arr[arrIndex]);
            ++arrayIndex;
        }
    });

    return obj;
}

function toArray(obj, mapping) {
    if(typeof obj != 'object') throw new MapperError('Wrong obj argument');

    let array = [];

    let arrayIndex = 0;
    mapping.forEach(path => {
        let info = relationInfo(path),
            stringArrPath = path.map(i => i.name);

        if(info.isRelation) {
            //nop
        } else {
            let arrIndex = !isNaN(info.index) ? info.index : arrayIndex;

            let val = getProperty(obj, stringArrPath);

            array[arrIndex] = val;
            ++arrayIndex;
        }
    });

    return array;
}

function processRelations(options) {

    options.forEach(item => {
        let name = item.name,
            collection = item.collection,
            mapping = item.mapping;

        if(!mapping) throw new MapperError('Mapping isnt exist');


        mapping.forEach(path => {
            let info = relationInfo(path);
            if(!info.isRelation) return;

            let relOpt = options.find(i => i.name == info.relatedTo);

            if(!relOpt) throw new MapperError('related mapping isnt exist');

            let relColl = relOpt.collection,
                mainPath = path.map(i => i.name);

            collection.forEach(item => {
                let mainVal = item[info.property],
                    relPath = info.relatedProperty,
                    relPropPath = relPath.split('.');

                let innerObj = relColl.find(i => getProperty(i, relPropPath) == mainVal);

                setProperty(item, mainPath, innerObj);
            });
        });
    });

    return options;
}

function getRelationProcessor(options, mappingName) {
    let mapping = options.find(i => i.name == mappingName).mapping;

    return function(item, callback) {
        mapping.forEach(path => {
            let info = relationInfo(path);
            if(!info.isRelation) return;

            let relOpt = options.find(i => i.name == info.relatedTo);

            if(!relOpt) throw new MapperError('related mapping isnt exist');

            let relColl = relOpt.collection,
                mainPath = path.map(i => i.name);

            let mainVal = item[info.property],
                relPath = info.relatedProperty,
                relPropPath = relPath.split('.');

            let innerObj = relColl.find(i => getProperty(i, relPropPath) == mainVal);

            setProperty(item, mainPath, innerObj);
        });

        callback(null, item);
    };
}


function Mapper() { }
Mapper.prototype.map = toObject;
Mapper.prototype.setProperty = setProperty;
Mapper.prototype.getProperty = getProperty;
Mapper.prototype.toObject = toObject;
Mapper.prototype.toArray = toArray;
Mapper.prototype.processRelations = processRelations;
Mapper.prototype.getRelationProcessor = getRelationProcessor;

exports.Mapper = Mapper;
