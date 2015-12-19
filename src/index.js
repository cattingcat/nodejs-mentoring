'use strict';
const
    readline = require('readline'),
    Reader =  require('./lib/CsvFsReader.js').CsvReader,
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
