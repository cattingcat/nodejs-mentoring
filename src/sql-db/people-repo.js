'use strict';

function PeopleRepository(dbClient) {
	this.client = dbClient;
}

PeopleRepository.prototype.updatePeople = function(changes, callback) {
	let updateStatement = `UPDATE people SET ${changes.field}='${changes.value}'
							WHERE id=${changes.id};`;
	this.client.query(updateStatement, (err, result) => {
		if(err) return callback(err);

		callback(null, 'updated');
	});
};

PeopleRepository.prototype.insertPeople = function (people, callback) {
	let insertPeople = `INSERT INTO people(id, firstName, lastName, birthdate)
						VALUES(default, '${people.firstName}', '${people.lastName}',
						'${people.birthdate}') RETURNING id;`;

	this.client.query(insertPeople, (err, result) => {
		if(err) return callback(err);
		let pplId = result.rows[0].id;

		let vals = people.addresses.map(a => `(default, '${a}', ${pplId})`).join(',');
		let insertAddr = `INSERT INTO addresses(id, address, peopleId)
							VALUES ${vals} ;`;

		this.client.query(insertAddr, (err, result) => {
			if(err) return callback(err);

			callback(null, pplId);
		});
	});
};

PeopleRepository.prototype.deletePeople = function(peoples, callback) {
	let statement = peoples.map(v => `(id=${v.id})`).join(' OR ');

	if(!statement) return callback();

	let query = `DELETE FROM people WHERE ${statement};`;
	this.client.query(query, (err, result) => {
		if(err) return callback(err);

		callback(null, 'deleted');
	});
};

/* select people and addresses, mapping */
PeopleRepository.prototype.selectPeople = function (callback) {
	let query = `SELECT p.id, p.firstName, p.lastName, p.birthdate, a.address
				FROM people AS p LEFT JOIN addresses AS a ON p.id = a.peopleId`;

	this.client.query(query, function(err, result) {
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
					birthdate: r.birthdate.toUTCString(),
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
};

exports.PeopleRepository = PeopleRepository;