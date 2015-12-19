'use strict';

const
    fs = require('fs'),
    CsvParser = require('./CsvParser.js').get('state');

function readSingleFile(filename, mapping, callback) {
    let inStream = fs.createReadStream(filename);
    let arr = [],
        tail = '';

    inStream.on('data', data => {
        let str = tail + data.toString(),
            lines = str.split('\n'),
            len = lines.length;

        tail = lines[len - 1];

        let objects = lines.map(l => {
            let arr = this.parser.parse(l);

            return arr;
        });

        arr = arr.concat(objects);

    }).on('error', error => {
        callback(error);
    }).on('end', () => {
        callback(null, arr);
    });
}


function CsvStreamReader() {
    this.parser = new CsvParser();
}

CsvStreamReader.prototype.readSingleFile = readSingleFile;

exports.CsvReader = CsvStreamReader;
