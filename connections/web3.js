'use strict';

// wraps web3 in a singleton object for re-use across the API
require('../environment');

const logger = require('../logs')();
const Web3 = require('web3');
const web3WebsocketProvider = new Web3.providers.WebsocketProvider(process.env.ETHWS);

web3WebsocketProvider.on('error', (e) => {
	logger.error('WEB3 ERROR', e.message);
});
web3WebsocketProvider.on('end', (e) => {
	logger.info('WEB3 WS DISCONNECTED', e);
});
web3WebsocketProvider.on('connect', (e) => {
	logger.info('WEB3 WS CONNECTED', e.message);
});

const web3 = new Web3(web3WebsocketProvider);

module.exports = {
	web3: web3,
};
