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
	addresses: [mongoose.Schema.Types.Mixed]
})
const People = mongoose.model('People', peopleSchema);


function Synchronizer(client) {
}

Synchronizer.prototype.sync = function(data, callback) {
};

Synchronizer.prototype.applyChanges = function(changes, callback) {
};


function selectPeople(callback) {
}

function sync(data, callback) {
}

function createSchema() {
}

exports.sync = sync;
exports.createSchema = createSchema;
exports.selectPeople = selectPeople;
