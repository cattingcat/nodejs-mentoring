/*
	Synchronize CSV to Relational-DB
*/
'use strict'

const
	config = require('./config.json'),
	dbUrl = config.db,
	pg = require('pg');

function sync(data) {

	// Add ssl for remote connection
	pg.connect(dbUrl + '?ssl=true', function(err, client, done){
		if(err) return console.error(err);
		console.log('connected to pg!');

		// TODO: Store data to pg
	});
}

exports.sync = sync;
