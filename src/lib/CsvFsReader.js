'use strict';

const
    fs = require('fs'),
    CsvParser = require('./CsvParser.js').get('state');

function readSingleFile(path, mapping, callback) {
    fs.readFile(path, (err, data) => {
        let str = data.toString(),
            lines = str.split('\n');

        let objects = lines.map(i => {
            let csvString = i.replace('\r', ''),
                csvArr = this.parser.parse(csvString);

            return csvArr;
        });

        callback(null, objects);
    });
}

function CsvReader() {
    this.parser = new CsvParser();
}

CsvReader.prototype.readSingleFile = readSingleFile;

exports.CsvReader = CsvReader;
