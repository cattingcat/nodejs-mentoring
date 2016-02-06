/*
	File for debugging
*/

'use strict';

const
	Mapper = require('./csv-orm').Mapper,
	synchronizer = require('./sql-db/synchronizer.js');

console.log('Hello world!');

synchronizer.createSchema();
