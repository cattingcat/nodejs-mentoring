/*
	Nodejs mentoring task1
*/

'use strict';
const
    readline = require('readline'),
    fs = require('fs'),
    //asyncjs = require('async'),
    Reader =  require('./csv-orm').Reader,
    Mapper = require('./csv-orm').Mapper;

let options = {
    files:[
        {
            path: __dirname + '/../data/cities/cities.txt',
            mapping: 'city',
            isMain: true
        },
        {
            path: __dirname + '/../data/cities/timezones.txt',
            mapping: 'timezone'
        }
    ],
    config: __dirname + '/../data/cities/config.xml'
};

let reader = new Reader();
reader.init(options, function(err, o) {
    var cons = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    cons.on('line', function(input) {
        /*if(input.indexOf('file') != -1) {
            let inFile = __dirname + '/../data/cities/test/cities.txt',
                outFile = __dirname + '/../data/cities/test/citiesOut.txt';
            fromFile(inFile, outFile, o);
            return;
        }*/

        let obj = o.get({field: 'name', ignoreCase: true, value: input});

        if(obj.length == 0) {
            obj = o.get({field: 'name', ignoreCase: true, substr: true, value: input});
            console.log('maybe you mean: ', obj.map(i => i.name));
            return;
        }

        console.log(obj);
    });
});

/*
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
*/
