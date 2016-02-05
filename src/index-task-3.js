/*
	NodeJS mentoring, task3.
	https://docs.google.com/document/d/1n3zYrCIZ25V17auwp0nKfK50MlzCe_t4wDWb_tODkZM/edit?pref=2&pli=1
*/

'use strict';
const
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

let reader = new Reader();

reader.read(options, function(err, data) {
	if(err) return console.error(err);

	console.log('Data: ', data);

	// Synchronize data from CSV file to Relational-DB
	synchronizer.sync(data);
});
