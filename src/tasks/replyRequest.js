'use strict';

// const web3 = require('../globalWeb3').web3;
const validate = require('../validators');
// const logger = require('../logs')(module);
// const http = require('http');
const dbService = require('../services').dbService;

module.exports = function() {
	return ({
		replyRequest: function(data) {
			return new Promise((resolve, reject) => {
				if (!data || !data.address) {
					return reject(new Error('No data/address supplied'));
				}

				if (!validate.isAddress(data.address)) {
					return reject(new Error('No valid address supplied'));
				}

				dbService.replyRequest(data.address, data.ItemHash, data.reply).then(() => {
					resolve();
				});
			});
		},
	});
};
