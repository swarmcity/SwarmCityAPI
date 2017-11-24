'use strict';

// wraps db in a singleton object for re-use across the API

const level = require('level');
const db = level('localCache');

// for the interface of this , refer to
// https://www.npmjs.com/package/level#api
module.exports = {
	db,
};
