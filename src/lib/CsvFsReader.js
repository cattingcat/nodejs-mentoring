'use strict';

const
    fs = require('fs'),
    CsvParser = require('./CsvParser.js').get('state'),
    ConfigReader = require('./XmlConfigReader.js').ConfigReader,
    Mapper = require('./Mapper.js').Mapper,
    logger = require('./Logger.js').logger;

function readSingleFile(path, mapping, callback) {
    logger.info('begin reading file: %s', path);

    fs.readFile(path, (err, data) => {
        let str = data.toString(),
            lines = str.split('\n');

        logger.info('done reading file: %s', path);

        let objects = lines.map(i => {
            let csvString = i.replace('\r', ''),
                csvArr = this.parser.parse(csvString),
                obj = this.mapper.map(csvArr, mapping);

            return obj;
        });

        logger.info('done mapping objects from file: %s', path);
        callback(null, objects);
    });
}

function read(options, callback) {
    logger.info('#read() wjth options: %j', options);

    this.configReader.readMappings(options.config, (err, mappings) => {
        if(err) {
            logger.error('error while config-file readign: %j', err);
            callback(err);
        }

        logger.info('done config-file reading; mappings: %j', mappings);

        let promises = [];

        options.files.forEach(option => {
            let path = option.path,
                mapping = mappings[option.mapping];

            logger.info('begin file reading: %s', path);

            let promise = new Promise((resolve, reject) => {
                this.readSingleFile(path, mapping, (err, data) => {
                    if(err) {
                        logger.error('error while file reading: %s ; err: %j', path, err);
                        promise.reject(err);
                    }

                    logger.info('file read successfully records num: %s', data.length);

                    resolve(data);
                });
            });

            promises.push(promise);
        });

        Promise.all(promises).then(results => {
            logger.info('files reading promise resolved');

            // TODO: fing main entity, and make relation between main and secondary entities,  return Array[main entity]
            let mainCollectionIndex = options.files.findIndex(i => i.isMain),
                mainCollection = results[mainCollectionIndex];

                this.mapper.processRelations(options.files, results, mappings);

            callback(null, mainCollection);
        }).catch(err => {
            logger.info('files reading promise rejected with: %j', err);
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
