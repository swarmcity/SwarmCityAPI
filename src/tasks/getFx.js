'use strict';

const logger = require('../logs')(module);

module.exports = function() {
	const request = require('request');
	let result;
	return ({
		updateFx: function() {
			return new Promise((resolve, reject) => {
				request({
						url: 'https://api.coinmarketcap.com/v1/ticker/swarm-city/?convert=EUR',
						timeout: 15 * 1000,
					},
					(error, response, body) => {
						if (error && error.code === 'ETIMEDOUT') {
							logger.error('updateFx timeout on request');
							return reject(error);
						}
						if (error || (response && response.statusCode !== 200)) {
							return reject(error);
						}
						try {
							let parsedBody = JSON.parse(body);
							result = {
								priceBtc: parsedBody[0].price_btc,
								priceEur: Number(parsedBody[0].price_eur).toFixed(2),
								priceUsd: Number(parsedBody[0].price_usd).toFixed(2),
								symbol: parsedBody[0].symbol.toLowerCase(),
							};
							logger.debug('updateFx result=', result);
							return resolve(result);
						} catch (e) {
							logger.error('updateFx err: '+ e.message);
							return reject(e);
						}
					});
			});
		},
		getFx: function() {
			if (result) {
				return Promise.resolve(result);
			} else {
				return this.updateFx();
			}
		},
	});
};
