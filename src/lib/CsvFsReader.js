'use strict';

const
    fs = require('fs'),
    CsvParser = require('./CsvParser.js').get('state'),
    ConfigReader = require('./XmlConfigReader.js').ConfigReader,
    Mapper = require('./Mapper.js').Mapper;

function readSingleFile(path, mapping, callback) {
    fs.readFile(path, (err, data) => {
        let str = data.toString(),
            lines = str.split('\n');

        let objects = lines.map(i => {
            let csvString = i.replace('\r', ''),
                csvArr = this.parser.parse(csvString),
                obj = this.mapper.map(csvArr, mapping);

            return obj;
        });

        callback(null, objects);
    });
}

function read(options, callback) {
    this.configReader.readMappings(options.config, (err, mappings) => {
        if(err) {
            callback(err);
        }

        let promises = [];

        options.files.forEach(option => {
            let path = option.path,
                mapping = mappings[option.mapping];

            let promise = new Promise((resolve, reject) => {
                this.readSingleFile(path, mapping, (err, data) => {
                    if(err) {
                        promise.reject(err);
                    }

                    resolve(data);
                });
            });

            promises.push(promise);
        });

        Promise.all(promises).then(results => {
            let mainCollectionIndex = options.files.findIndex(i => i.isMain),
                mainCollection = results[mainCollectionIndex];

                this.mapper.processRelations(options.files, results, mappings);

            callback(null, mainCollection);
        }).catch(err => {
            // TODO
        })
    });
}

function init(options, callback) {
    this.options = options;

    if(callback) {
        this.read(options, (err, data) => {
            if(err) return callback(err);

            let o = {}
            o.get = function(criteria){
                let filtered = data.filter(i => compare(criteria, i));
                return filtered;
            };

            callback(null, o);
        });
    }
}

function compare(criteria, item) {
    let field = criteria.field,
        val = criteria.value,
        actualVal = item[field];

    if(val instanceof RegExp) {
        return val.test(actualVal);
    }

    if(criteria.ignoreCase) {
        val = val.toLowerCase();
        actualVal = actualVal && actualVal.toLowerCase();
    }

    if(criteria.substr && actualVal) {
        return (actualVal.indexOf(val) != -1);
    }

    return val == actualVal;
}

function get(criteria, callback) {
    this.read(this.options, (error, data) => {
        if(error) return callback(error);

        let filtered = data.filter(i => compare(criteria, i));

        callback(null, filtered);
    });
}

function CsvReader() {
    this.parser = new CsvParser();
    this.configReader = new ConfigReader();
    this.mapper = new Mapper();
}

CsvReader.prototype.read = read;
CsvReader.prototype.readSingleFile = readSingleFile;

CsvReader.prototype.init = init;
CsvReader.prototype.get = get;

exports.CsvReader = CsvReader;
