/*
	NodeJS mentoring, task3.
	https://docs.google.com/document/d/1n3zYrCIZ25V17auwp0nKfK50MlzCe_t4wDWb_tODkZM/edit?pref=2&pli=1
*/

'use strict';
const
	fs = require('fs'),
    Reader =  require('./csv-orm').Reader,
	synchronizer = require('./sql-db/synchronizer.js');

let options = {
    files:[{
		// CSV with people list
        path: __dirname + '/../data/people/people.csv',
		// entity from XML-config
        mapping: 'people',
        isMain: true
    }],
	// Path to XML config
    config: __dirname + '/../data/people/config.xml'
};

// Store to JSON-file
synchronizer.selectPeople(function(err, data) {
	let filepath = __dirname + '/../data/people/people-fromDB.json';

	// Save dump from DB
	fs.writeFile(filepath, JSON.stringify(data), function (err) {
		if (err) return console.log(err);
	});
});

// Sync from CSV to DB
let reader = new Reader();
reader.read(options, function(err, data) {
	if(err) return console.error(err);

	// Synchronize data from CSV file to Relational-DB
	//synchronizer.createSchema();
	synchronizer.sync(data, (err, data) => {
		console.log('Synchronization done!');
	});
});
