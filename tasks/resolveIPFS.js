/**
 * resolve an IPFS hash to data
 */
'use strict';
require('../environment');

const ipfsAPI = require('ipfs-api');
const ipfs = ipfsAPI(process.env.IPFSAPI);
const bl = require('bl');

module.exports = function() {
	return ({
		resolveIPFS: function(hash) {
			return new Promise((resolve, reject) => {
				ipfs.files.cat(hash, (err, stream) => {
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
	});
};
