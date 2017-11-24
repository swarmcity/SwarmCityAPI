'use strict';

// wraps web3 in a singleton object for re-use across the API
require('./environment');

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.ETHWS));

module.exports = {
	web3: web3,
};
