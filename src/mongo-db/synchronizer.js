/*
	Synchronize CSV to Document oriented DB
*/
'use strict';

const
	config = require('./config.json'),
	dbUrl = config.db,
	fs = require('fs'),
	mongoose = require('mongoose'),
	when = require('when');

mongoose.connect(dbUrl);
const peopleSchema = new mongoose.Schema({
	firstName: String,
	lastName: String,
	addresses: [{
		type: [mongoose.Schema.Types.Number],
		index: '2d'
	}]
})
const People = mongoose.model('People', peopleSchema);


function Synchronizer(client) {
}

Synchronizer.prototype.sync = function(data, callback) {

};

Synchronizer.prototype.applyChanges = function(changes, callback) {
};


function selectPeople(callback) {
	People.find({}).exec(callback);
}

function sync(data, callback) {
	let peoples = data.map(i => new People(i));
	let promises = [];

	data.forEach(i => {
		var dfd = when.defer();
		People.update({firstName: i.firstName, lastName: i.lastName}, i, {upsert: true}, function(err, data) {
			dfd.resolve();
		});
		promises.push(dfd.promise);
	});

	when.all(promises).then(function () {
	    callback(null, 'Synchronization done');
	});
}

function createSchema() {
}

function findNear(coords, callback) {
	People.find({
		addresses: {
			$elemMatch: {
				$near: coords,
        		$maxDistance: 100
			}
		}
	}).exec(callback);
}

exports.sync = sync;
exports.createSchema = createSchema;
exports.selectPeople = selectPeople;
exports.findNear = findNear;
