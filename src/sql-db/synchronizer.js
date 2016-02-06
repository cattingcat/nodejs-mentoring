/*
	Synchronize CSV to Relational-DB
*/
'use strict'

const
	config = require('./config.json'),
	dbUrl = config.db + '?ssl=true', // Add ssl for remote connection
	pg = require('pg'),
	fs = require('fs');

function sync(data) {

	pg.connect(dbUrl , function(err, client, done){
		if(err) return console.error(err);
		console.log('connected to pg!');

		// run test query
		client.query('SELECT NOW() AS "theTime"', function(err, result) {
		    if(err) return console.error('error running query', err);
		    console.log(result.rows[0].theTime);
		    client.end();
		});

		// TODO: Store data to pg
	});
}

/* Recreate tables and sequences */
function createSchema() {
	// open file with SQL schema definition
	fs.readFile(__dirname + '/create-schema.sql', function(err, data){
		if(err) return console.error('Error while SQL schema creating: ', err);

		let str = data.toString();

		// connect to DB
		pg.connect(dbUrl , function(err, client, done){
			if(err) return console.error(err);
			console.log('connected to pg!');

			// run test query
			client.query(str, function(err, result) {
			    if(err) return console.error('Create schema: error running query', err);
			    console.log('Success: ', result);
			    client.end();
			});
		});
	});
}

exports.sync = sync;
exports.createSchema = createSchema;
