'use strict';

const logger = require('./logs')('globalIPFS');

const ipfs = require('./connections/ipfs').ipfs;

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
