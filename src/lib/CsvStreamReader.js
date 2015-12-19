'use strict';

const
    fs = require('fs'),
    CsvParser = require('./CsvParser.js').get('state'),
    FsReader = require('./CsvFsReader.js').CsvReader,
    ConfigReader = require('./XmlConfigReader.js').ConfigReader,
    Mapper = require('./Mapper.js').Mapper,
    logger = require('./Logger.js').logger;

function readSingleFile(filename, mapping, callback) {
    let inStream = fs.createReadStream(filename);
    let arr = [],
        tail = '';

    logger.info('reading file: %s', filename);

    inStream.on('data', data => {
        let str = tail + data.toString(),
            lines = str.split('\n'),
            len = lines.length;

        tail = lines[len - 1];

        let objects = lines.map(l => {
            let arr = this.parser.parse(l),
                obj = this.mapper.map(arr, mapping);

            return obj;
        });

        arr = arr.concat(objects);

    }).on('error', error => {
        logger.error('error: %j while reading file: %s', error, filename);

        callback(error);
    }).on('end', () => {
        logger.info('done reading file: %s', filename);

        callback(null, arr);
    });
}


function CsvStreamReader() {
    this.parser = new CsvParser();
    this.configReader = new ConfigReader();
    this.mapper = new Mapper();
}

CsvStreamReader.prototype = Object.create(FsReader.prototype);
CsvStreamReader.prototype.readSingleFile = readSingleFile;

exports.CsvReader = CsvStreamReader;
