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

function processRelations(arrayToMap, arrays, mappings) {
    if(arrayToMap.length != arrays.length)
        throw new MapperError('Mappings count isnt equals to result arrays count');

    arrayToMap.forEach((arrMapItem, index) => {
        let currArray = arrays[index],
            currMap = mappings[arrMapItem.mapping];

        if(!currMap) throw new MapperError('Mapping isnt exist');

        currMap.forEach(path => {
            let info = relationInfo(path);

            if(info.isRelation) {
                let relatedIndex = arrayToMap.findIndex(i => i.mapping == info.relatedTo),
                    relatedArr = arrays[relatedIndex];

                currArray.forEach(item => {
                    let myRelatedVal = item[info.property],
                        relatedObjProp = info.relatedProperty,
                        propPath = relatedObjProp.split('.');

                    let innerObj = relatedArr.find(i => getProperty(i, propPath) == myRelatedVal);

                    setProperty(item, path.map(i => i.name), innerObj);
                });
            }
        });
    });

    return arrays;
}

function Mapper() { }
Mapper.prototype.map = toObject;
Mapper.prototype.setProperty = setProperty;
Mapper.prototype.getProperty = getProperty;
Mapper.prototype.toObject = toObject;
Mapper.prototype.toArray = toArray;
Mapper.prototype.processRelations = processRelations;

exports.Mapper = Mapper;
