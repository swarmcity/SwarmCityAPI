'use strict';
require('../environment');

const ipfsAPI = require('ipfs-api');
const bl = require('bl');
const logger = require('../logs')();

let ipfs;
if (process.env.IPFSAPIHOST && process.env.IPFSAPIPORT) {
	logger.info('connecting via IPFSAPIHOST/IPFSAPIPORT',
		process.env.IPFSAPIHOST,
		process.env.IPFSAPIPORT);
	ipfs = ipfsAPI({
		host: process.env.IPFSAPIHOST,
		port: process.env.IPFSAPIPORT,
		protocol: 'http',
	});
} else {
	logger.info('connecting via multiaddr IPFSAPI', process.env.IPFSAPI);
	ipfs = ipfsAPI(process.env.IPFSAPI);
}

module.exports = {
    ipfs: ipfs
};
