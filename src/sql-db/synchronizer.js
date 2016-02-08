/*
	Synchronize CSV to Relational-DB
*/
'use strict';

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

	let dbDate = oldPeople.birthdate.toLocaleDateString(),
		csvDate = new Date(newPeople.birthdate).toLocaleDateString();

	if(dbDate != csvDate) {
		objChanges.push({
			type: 'update',
			table: 'people',
			field: 'birthdate',
			id: id,
			old: dbDate,
			value: csvDate
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

	let addrsToDelete = oldPeople.addresses
		.filter((item, index) => indexes.indexOf(index) == -1)
		.forEach(i => {
			objChanges.push({
				type: 'delete',
				table: 'addresses',
				peopleId: oldPeople.id,
				address: i
			});
		});

	return objChanges;
}

function applyChanges(client, changes, callback) {
	// insert people
	for(let ins of changes.insert.filter(i => i.table == 'people')) {
		insertPeople(client, ins.values, function(err, data) {
			console.log(err, data);
		});
	}

	// insert addresses
	let insAddrs = changes.insert
		.filter(i => i.table == 'addresses')
		.map(i => i.values);

	insertAddresses(client, insAddrs, function(err, data) {
		console.log(err, data);
	});


	let delAddrs = changes.delete
		.filter(i => i.table == 'addresses');
	deleteAddresses(client, delAddrs, function(err, data) {
		console.log(err, data);
	});

	let delPpl = changes.delete
		.filter(i => i.table == 'people');
	deletePeople(client, delPpl, function(err, data) {
		console.log(err, data);
	});





	// TODO
}

function insertPeople(client, people, callback) {
	let insertPeople = `INSERT INTO people(id, firstName, lastName, birthdate)
						VALUES(default, '${people.firstName}', '${people.lastName}',
						'${people.birthdate}') RETURNING id;`;

	client.query(insertPeople, (err, result) => {
	    if(err) return callback(err);
		let pplId = result.rows[0].id;

		let vals = people.addresses.map(a => `(default, '${a}', ${pplId})`).join(',');
		let insertAddr = `INSERT INTO addresses(id, address, peopleId)
							VALUES ${vals} ;`;

		client.query(insertAddr, (err, result) => {
			if(err) return callback(err);

			callback(null, pplId);
		});
	});
}

function insertAddresses(client, addresses, callback) {
	let vals = addresses.map(a => `(default, '${a.address}', ${a.peopleId})`).join(',');
	let insertAddr = `INSERT INTO addresses(id, address, peopleId)
						VALUES ${vals} ;`;

	if(!vals) return callback();

	client.query(insertAddr, (err, result) => {
		if(err) return callback(err);

		callback(null, result);
	});
}

function deleteAddresses(client, addresses, callback) {
	let statement = addresses.map(v => {
		let del = `(peopleId=${v.peopleId} AND address='${v.address}')`;
		return del;
	}).join(' OR ');

	if(!statement) return callback();

	let query = `DELETE FROM addresses WHERE ${statement};`;
	client.query(query, (err, result) => {
		if(err) return callback(err);

		callback(null, 'deleted');
	});
}

function deletePeople(client, peoples, callback) {
	let statement = peoples.map(v => `(id=${v.id})`).join(' OR ');

	if(!statement) return callback();

	let query = `DELETE FROM people WHERE ${statement};`;
	client.query(query, (err, result) => {
		if(err) return callback(err);

		callback(null, 'deleted');
	});
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
		});

		selectPeople(client, function(err, dbData) {
			let changes = getChanges(data, dbData);
			applyChanges(client, changes, function(err, data){
				// TODO after changes saved
				client.end();
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
