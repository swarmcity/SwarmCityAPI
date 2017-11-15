'use strict';
require('../environment');

const logs = require('../logs')();
const ipfsAPI = require('ipfs-api');
const ipfs = ipfsAPI(process.env.IPFSAPI);
const bl = require('bl');

module.exports = function() {
	return ({
		resolveIPFS: function(hash) {

			return new Promise((resolve, reject) => {
				ipfs.files.cat(hash, (err, stream) => {
					//expect(err).to.not.exist()
					stream.pipe(bl((err, data) => {
						if (err) {
							reject(new Error(err));
						} else {
							resolve(data.toString());
						}
						// expect(err).to.not.exist()
						// expect(data.toString()).to.contain('Plz add me!')
						// done()
					}));
				});

				// return new Promise((resolve, reject) => {
				// 	logs._eventLog('Hashtags: ', hashtags);
				// 	resolve(hashtags);
				// });

			});
		}
	});
}
