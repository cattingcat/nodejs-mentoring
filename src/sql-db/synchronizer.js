/*
	Synchronize CSV to Relational-DB
*/
'use strict';

const
	config = require('./config.json'),
	dbUrl = config.db + '?ssl=true', // Add ssl for remote connection
	pg = require('pg'),
	fs = require('fs'),
	when = require('when'),
	PeopleRepository = require('./people-repo').PeopleRepository,
	AddressRepository = require('./address-repo').AddressRepository;

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

	let dbDate = oldPeople.birthdate,
		csvDate = new Date(newPeople.birthdate).toUTCString();

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

function Synchronizer(client) {
	this.peopleRepo = new PeopleRepository(client);
	this.addressRepo = new AddressRepository(client);

	// run test query
	client.query('SELECT NOW() AS "theTime"', function(err, result) {
		if(err) return console.error('error running query', err);
		console.log('Synchronizer ctor: ', result.rows[0].theTime);
	});
}

Synchronizer.prototype.sync = function(data, callback) {
	this.peopleRepo.selectPeople((err, dbData) => {
		let changes = getChanges(data, dbData);
		this.applyChanges(changes, (err, data) => {

			// TODO after changes saved

			callback();
		});
	});
};


Synchronizer.prototype.applyChanges = function(changes, callback) {
	let promises = [];

	// insert people
	for(let ins of changes.insert.filter(i => i.table == 'people')) {
		let dfd = when.defer();
		this.peopleRepo.insertPeople(ins.values, function(err, data) {
			console.log(err, data);
			dfd.resolve();
		});
		promises.push(dfd.promise);
	}

	// del ppls
	let delPpl = changes.delete.filter(i => i.table == 'people');
	let delPeopleDfd = when.defer();
	this.peopleRepo.deletePeople(delPpl, function(err, data) {
		console.log(err, data);
		delPeopleDfd.resolve();
	});
	promises.push(delPeopleDfd.promise);

	// upd people
	let updPpls = changes.update.filter(i => i.table == 'people');
	for(let ppl of updPpls) {
		let dfd = when.defer();
		this.peopleRepo.updatePeople(ppl, function(err, data) {
			console.log(err, data);
			dfd.resolve();
		});
		promises.push(dfd.promise);
	}

	// insert addresses
	let insAddrs = changes.insert
		.filter(i => i.table == 'addresses')
		.map(i => i.values);
	let insertAddrDfd = when.defer();
	this.addressRepo.insertAddresses(insAddrs, function(err, data) {
		console.log(err, data);
		insertAddrDfd.resolve();
	});
	promises.push(insertAddrDfd.promise);

	// delete addrs
	let delAddrs = changes.delete
		.filter(i => i.table == 'addresses');
	let deleteAddrDfd = when.defer();
	this.addressRepo.deleteAddresses(delAddrs, function(err, data) {
		console.log(err, data);
		deleteAddrDfd.resolve();
	});
	promises.push(deleteAddrDfd.promise);

	when.all(promises).then(function () {
	    callback(null, 'Synchronization done');
	});
}




function selectPeople(callback) {
	pg.connect(dbUrl , function(err, client, done){
		if(err) return callback(err);

		const synchronizer = new Synchronizer(client);
		
		synchronizer.peopleRepo.selectPeople(function(err, data) {
			client.end();

			if(err) return callback(err);

			callback(null, data);
		});
	});
}

/* sync data from CSV to pg-DB */
function sync(data, callback) {
	pg.connect(dbUrl , function(err, client, done){
		if(err) return console.error(err);
		console.log('connected to pg!');

		const synchronizer = new Synchronizer(client);
		synchronizer.sync(data, function(err, data) {

			client.end();

			callback(data);
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
exports.selectPeople = selectPeople;
