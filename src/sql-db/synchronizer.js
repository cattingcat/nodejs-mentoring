/*
	Synchronize CSV to Relational-DB
*/
'use strict'

const
	config = require('./config.json'),
	dbUrl = config.db + '?ssl=true', // Add ssl for remote connection
	pg = require('pg'),
	fs = require('fs');

/* select people and addresses, mapping */
function selectPeople(client, callback) {
	let query = `SELECT p.id, p.firstName, p.lastName, p.birthdate, a.address
				FROM people AS p LEFT JOIN addresses AS a ON p.id = a.peopleId`;

	client.query(query, function(err, result) {
	    if(err) {
			console.error('error running query', err);
			if(callback) callback(err);
		}

		let map  = new Map();
		// make map of results
		for(let r of result.rows) {
			let mapEntry = map.get(r.id);

			if(mapEntry) {
				mapEntry.addresses.push(r.address);
			} else {
				let obj = {
					id: r.id,
					firstName: r.firstname,
					lastName: r.lastname,
					birthdate: r.birthdate,
					addresses: [r.address]
				};

				map.set(r.id, obj);
			}
		}

		let peopleArray = [];
		for(let mapEntry of map.values()){
			peopleArray.push(mapEntry);
		}

	    client.end();

		if(callback) callback(null, peopleArray);
	});
}

/* changes between two People-collections */
function getChanges(actual, old) {
	let changes = {
		insert: [],
		update: [],
		delete: []
	};

	let map = new Map();
	for(let i of old) {
		let key = i.firstName + i.lastName;
		map.set(key, i);
	}

	for(let i of actual) {
		let key = i.firstName + i.lastName;

		let mapEntry = map.get(key);

		if(mapEntry) {
			mapEntry.exist = true;
			let objChanges = compareObjects(mapEntry, i);
			for(let change of objChanges) {
				changes[change.type].push(change);
			}
		} else {
			changes.insert.push({
				table: 'people',
				values: i
			});
		}
	}

	for(let i of map.values()) {
		if(!i.exist) {
			changes.delete.push({
				table: 'people',
				id: i.id
			});
		}
	}

	return changes;
}

/* compare two People-obejcts */
function compareObjects(oldPeople, newPeople) {
	let id = oldPeople.id,
		objChanges = [];

	if(oldPeople.birthdate != newPeople.birthdate) {
		objChanges.push({
			type: 'update',
			table: 'people',
			field: 'birthdate',
			id: id,
			value: newPeople.birthdate
		});
	}

	let indexes = [];
	for(let adr of newPeople.addresses) {
		let index = oldPeople.addresses.findIndex(a => a == adr);

		if(index != -1) {
			indexes.push(index);
			// same element exist in new onject
		} else {
			objChanges.push({
				type: 'insert',
				table: 'addresses',
				values: {
					peopleId: id,
					address: adr
				}
			});
		}
	}

	let addrToDelete = oldPeople.addresses
		.filter((item, index) => indexes.indexOf(index) == -1);

	objChanges.push({
		type: 'delete',
		table: 'addresses',
		values: addrToDelete
	});

	return objChanges;
}

function applyChanges(client, changes, callback) {
	//TODO Store changes to db
}

/* sync data from CSV to pg-DB */
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

		selectPeople(client, function(err, dbData) {
			let changes = getChanges(data, dbData);
			applyChanges(client, changes, function(err, data){

				// TODO after changes saved
			});
		});
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
