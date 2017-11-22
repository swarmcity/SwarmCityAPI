'use strict';

const logs = require('../logs')();
const db = require('../globaldb').db;

module.exports = function() {
	return ({
		getHashtags: function(address) {
			return new Promise((resolve, reject) => {
				db.get(process.env.PARAMETERSCONTRACT + '-hashtaglist').then((val) => {
					logs.info('Hashtags: ', hashtags);
					resolve(hashtags);
				});
			});
		},
	});
};
