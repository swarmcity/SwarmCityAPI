'use strict';

const logger = require('./logs')('globalIPFS');

const ipfs = require('./connections/ipfs').ipfs;
const bl = require('bl');

module.exports = function() {
	return ({
		/**
		 * Returns a Buffer with the IPFS data of the given hash
		 *
		 * @param      {String}   hash    The IPFS hash
		 * @return     {Promise}  resolves with a Buffer object, rejects with an Error object
		 */
		cat: function(hash) {
			logger.info('CAT hash', hash);
			if (!this.isIPFSHash(hash)) {
				return Promise.reject(new Error(hash + ' is not a valid IPFS hash'));
			}
			return new Promise((resolve, reject) => {
				ipfs.files.cat(hash, (err, stream) => {
					if (err) {
						return reject(new Error(err));
					}
					stream.pipe(bl((err, data) => {
						if (err) {
							reject(new Error(err));
						} else {
							resolve(data);
						}
					}));
				});
			});
		},

		/**
		 * Checks if the given string is a valid IPFS hash
		 *
		 * @param      {string}   possibleHash  The string to test
		 * @return     {boolean}  True if it validates as an ipfs hash, False otherwise.
		 */
		isIPFSHash: function(possibleHash) {
			return (
				possibleHash &&
				possibleHash.length === 46 &&
				possibleHash.substring(0, 2) === 'Qm'
			);
		},
	});
};
