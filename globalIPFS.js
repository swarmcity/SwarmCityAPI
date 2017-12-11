'use strict';
require('./environment');

const ipfsAPI = require('ipfs-api');
const ipfs = ipfsAPI(process.env.IPFSAPI);
const logger = require('./logs')('globalIPFS');

module.exports = function() {
	return ({
		cat: function(hash) {
			logger.info('CAT hash', hash);
			return new Promise((resolve, reject) => {
				ipfs.files.cat(hash, (err, buf) => {
					if (err) {
						return reject(new Error(err));
					}
					resolve(buf.toString('utf8'));
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
