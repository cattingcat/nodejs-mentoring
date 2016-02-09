'use strict';

function AddressRepository(dbClient) {
	this.client = dbClient;
}

AddressRepository.prototype.insertAddresses = function (addresses, callback) {
	let vals = addresses.map(a => `(default, '${a.address}', ${a.peopleId})`).join(',');
	let insertAddr = `INSERT INTO addresses(id, address, peopleId)
						VALUES ${vals} ;`;

	if(!vals) return callback();

	this.client.query(insertAddr, (err, result) => {
		if(err) return callback(err);

		callback(null, result);
	});
}

AddressRepository.prototype.deleteAddresses = function (addresses, callback) {
	let statement = addresses.map(v => {
		let del = `(peopleId=${v.peopleId} AND address='${v.address}')`;
		return del;
	}).join(' OR ');

	if(!statement) return callback();

	let query = `DELETE FROM addresses WHERE ${statement};`;
	this.client.query(query, (err, result) => {
		if(err) return callback(err);

		callback(null, 'deleted');
	});
}

exports.AddressRepository = AddressRepository;