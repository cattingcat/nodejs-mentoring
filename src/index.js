'use strict';
const
    readline = require('readline'),
    fs = require('fs'),
    asyncjs = require('async'),
    Reader =  require('./lib/CsvFsReader.js').CsvReader,
    Mapper = require('./lib/Mapper.js').Mapper,
    StreamReader = require('./lib/CsvStreamReader.js').CsvReader,
    logger = require('./lib/Logger.js').logger;

let options = {
    files:[
        {
            path: __dirname + '/../data/cities.txt',
            mapping: 'city',
            isMain: true
        },
        {
            path: __dirname + '/../data/timezones.txt',
            mapping: 'timezone'
        }
    ],
    config: __dirname + '/config.xml'
};

 let reader = new Reader();
// let reader = new StreamReader();

reader.init(options, function(err, o) {
    var cons = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    cons.on('line', function(input) {
        logger.profile('command');

        if(input.indexOf('file') != -1) {
            let inFile = __dirname + '/cities.txt',
                outFile = __dirname + '/citiesOut.txt';
            fromFile(inFile, outFile, o);
            return;
        }

        let obj = o.get({field: 'name', ignoreCase: true, value: input});

        if(obj.length == 0) {
            obj = o.get({field: 'name', ignoreCase: true, substr: true, value: input});
            console.log('maybe you mean: ', obj.map(i => i.name));
            logger.profile('command');
            return;
        }

        console.log(obj);
        logger.profile('command');
    });
});

function fromFile(inFile, outFile, infoGetter) {
    fs.readFile(inFile, (err, data) => {
        let str = data.toString(),
            cities = str.split(',');

        let funcs = cities.map(i => {
            return function (callback) {
                callback(null, infoGetter.get({
                    field: 'name',
                    ignoreCase: true,
                    value: i.trim()
                }));
            }
        });

        asyncjs.parallel(funcs, function(err, data){
            let mapper = new Mapper(),
                mapping = [
                    [{name: 'name'}],
                    [{name: 'country'}],
                    [{name: 'timeZone'}, {name: 'offset'}]
                ];

            let arrs = data.map(i => {
                let arr = mapper.toArray(i[0], mapping);
                return arr + '\n';
            });

            fs.writeFile(outFile, arrs.join(''), (err, data => {}));
        });
    });
}
