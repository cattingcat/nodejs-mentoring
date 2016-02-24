/*
	NodeJS mentoring, task3 - mongodb.
	https://docs.google.com/document/d/1n3zYrCIZ25V17auwp0nKfK50MlzCe_t4wDWb_tODkZM/edit?pref=2&pli=1
*/

'use strict';
const
	fs = require('fs'),
    Reader =  require('./csv-orm').Reader,
	synchronizer = require('./mongo-db/synchronizer.js');

let options = {
    files:[{
		// CSV with people list
        path: __dirname + '/../data/people/mongo-people/people.csv',
		// entity from XML-config
        mapping: 'people',
        isMain: true
    }],
	// Path to XML config
    config: __dirname + '/../data/people/mongo-people/config.xml'
};

// Store to JSON-file
/* synchronizer.selectPeople(function(err, data) {
	let filepath = __dirname + '/../data/people/mongo-people/people-fromDB.json';

	// Save dump from DB
	fs.writeFile(filepath, JSON.stringify(data), function (err) {
		if (err) return console.log(err);
	});
}); */

// Sync from CSV to DB
let reader = new Reader();
reader.read(options, function(err, data) {
	if(err) return console.error(err);

	let peoples = data.map(i => {
		let addresses = i.addresses.split('|');

		addresses = addresses.map(a => {
			let arr = /(\w+)\((\d+),(\d+)\)/.exec(a);
			return {
				name: arr[1],
				index: '2d',
				type: [arr[2], arr[3]]
			};
		});

		return {
			firstName: i.firstName,
			lastName: i.lastName,
			addresses: addresses
		};
	});

	synchronizer.selectPeople(function(err, data) {
		data.forEach(i => {
			if(!peoples.some(j =>
				j.firstName == i.get('firstName') && j.lastName == i.get('lastName') )) {
					i.remove();
				}
		});
	});

	synchronizer.findNear([10, 10], function(err, data) {
		data.forEach(i => {
			if(!peoples.some(j =>
				j.firstName == i.get('firstName') && j.lastName == i.get('lastName') )) {
					i.remove();
				}
		});
	});

	synchronizer.sync(peoples, (err, data) => {
		console.log('Synchronization done!');
	});
});
