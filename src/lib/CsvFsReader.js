'use strict';

const
    fs = require('fs'),
    asyncjs = require('async'),
    CsvParser = require('./CsvParser.js').get('state'),
    ConfigReader = require('./XmlConfigReader.js').ConfigReader,
    Mapper = require('./Mapper.js').Mapper,
    logger = require('./Logger.js').logger;

function readDataFile(path, mapping, callback) {
    logger.info('begin reading file: %s', path);

    fs.readFile(path, (err, data) => {
        let str = data.toString(),
            lines = str.split('\n');

        logger.info('done reading file: %s', path);

        let objects = this.processLines(lines, mapping);

        logger.info('done mapping objects from file: %s', path);
        callback(null, objects);
    });
}

function readFiles(options, callback) {
    // read config-file, and files with data
    logger.info('#read() wjth options: %j', options);

    let configFileName = options.config,
        dataFiles = options.files;

    // config-file loaded
    this.configReader.readMappings(configFileName, (err, mappings) => {
        if(err) {
            logger.error('error while config-file readign: %j', err);
            callback(err);
        }
        logger.info('done config-file reading; mappings: %j', mappings);

        // run loading data-files
        let promises = dataFiles.map(file => {
            let path = file.path,
                mapping = mappings[file.mapping];

            logger.info('begin file reading: %s', path);

            let p = new Promise((resolve, reject) => {
                // read and parse one data-file
                this.readDataFile(path, mapping, (err, data) => {
                    if(err) {
                        logger.error('error while file reading: %s ; err: %j', path, err);
                        promise.reject(err);
                    }
                    logger.info('file read successfully records num: %s', data.length);

                    resolve(data);
                });
            });

            return p;
        });

        // all data-filed loaded
        Promise.all(promises).then(dataFilesRes => {
            logger.info('files reading promise resolved');

            // pack mappings, result collections and names of collections
            let res = dataFiles.map((v, i) => {
                return {
                    name: v.mapping,
                    mapping: mappings[v.mapping],
                    collection: dataFilesRes[i]
                };
            });

            callback(null, res);
        }).catch(err => {
            logger.error('files reading promise rejected with: %j', err);
            callback(err);
        })
    });
}

function processLines(lines, mapping) {
    return lines.map(i => {
        let csvString = i.replace('\r', ''),
            csvArr = this.parser.parse(csvString),
            obj = this.mapper.map(csvArr, mapping);

        return obj;
    });
}

function read(options, callback) {
    let resInd = options.files.findIndex(i => i.isMain);

    this.readFiles(options, (err, data) => {
        if(err) {
            logger.error('files reading err: %j', err);
            callback(err);
        }
        let mainResult = data[resInd];

        // find relations between collections
        //this.mapper.processRelations(data);
        //callback(null, mainResult.collection);

        let proc = this.mapper.getRelationProcessor(data, mainResult.name);
        asyncjs.map(mainResult.collection, proc, callback);
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
CsvReader.prototype.readFiles = readFiles;
CsvReader.prototype.readDataFile = readDataFile;
CsvReader.prototype.processLines = processLines;

CsvReader.prototype.init = init;
CsvReader.prototype.get = get;

exports.CsvReader = CsvReader;
