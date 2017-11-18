'use strict';

// wraps db in a singleton object for re-use across the API

const level = require('level');
const db = level('localCache');

module.exports = {
	db: db,
};
