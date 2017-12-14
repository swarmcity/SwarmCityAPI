'use strict';
require('./environment');

const ipfsAPI = require('ipfs-api');
const bl = require('bl');
const logger = require('./logs')('globalIPFS');

let ipfs;
if (process.env.IPFSAPIHOST && process.env.IPFSAPIPORT) {
	logger.info('connecting via IPFSAPIHOST/IPFSAPIPORT',
		process.env.IPFSAPIHOST,
		process.env.IPFSAPIPORT);
	ipfs = ipfsAPI({
		host: process.env.IPFSAPIHOST,
		port: process.env.IPFSAPIPORT,
		protocol: 'http'
	});
} else {
	logger.info('connecting via multiaddr IPFSAPI', process.env.IPFSAPI);
	ipfs = ipfsAPI(process.env.IPFSAPI);
}

module.exports = function() {
	return ({
		cat: function(hash) {
			logger.info('CAT hash', hash);
			return new Promise((resolve, reject) => {
				ipfs.files.cat(hash, (err, stream) => {
					if (err) {
						return reject(new Error(err));
					}
					stream.pipe(bl((err, data) => {
						if (err) {
							reject(new Error(err));
						} else {
							resolve(data.toString());
						}
					}));
				});
			});
		},

		isIPFSHash: function(possibleHash) {
			return (
				possibleHash &&
				possibleHash.length === 46 &&
				possibleHash.substring(0, 2) === 'Qm'
			);
		},
	});
};
