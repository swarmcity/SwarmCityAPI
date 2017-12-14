'use strict';

// wraps web3 in a singleton object for re-use across the API
require('./environment');

const logger = require('./logs')('globalWEB3');
const Web3 = require('web3');
const web3WebsocketProvider = new Web3.providers.WebsocketProvider(process.env.ETHWS);

web3WebsocketProvider.on('error', (e) => {
	logger.error('WEB3 ERROR', e.message);
});
web3WebsocketProvider.on('end', (e) => {
	logger.error('WEB3 WS DISCONNECTED', e);
});
web3WebsocketProvider.on('connect', (e) => {
	logger.error('WEB3 WS CONNECTED', e.message);
});

const web3 = new Web3(web3WebsocketProvider);
const sha3 = require('crypto-js/sha3');

/**
 * Create a 32 bit hash from an input
 *
 * @param      {string}  input   The input
 * @return     {string}  32 bit hex string , prefixed with '0x'
 */
function shhHash(input) {
	return '0x' + sha3(input, {
		outputLength: 32,
	}).toString();
}

const shhHelpers = {
	shhHash: shhHash,
	shhBaseTopic: 'Swarm City 1.0',
};

module.exports = {
	web3: web3,
	shhHelpers: shhHelpers,
};
