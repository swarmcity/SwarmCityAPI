'use strict';

const logger = require('../logs')();

module.exports = function() {
	const request = require('request');
	let result;
	return ({
		updateFx: function() {
			return new Promise((resolve, reject) => {
				request('https://api.coinmarketcap.com/v1/ticker/swarm-city/?convert=EUR',
					(error, response, body) => {
						if (error || (response && response.statusCode !== 200)) {
							return reject(error);
						}
						try {
							let parsedBody = JSON.parse(body);
							let result = {
								price_btc: parsedBody[0].price_btc,
								price_eur: Number(parsedBody[0].price_eur).toFixed(2),
								price_usd: Number(parsedBody[0].price_usd).toFixed(2),
								symbol: parsedBody[0].symbol,
							};
							logger.info('updateFx result=', result);
							return resolve(result);
						} catch (e) {
							logger.error('updateFx err=', e);
							return reject(e);
						}
					});
			});
		},
		getFx: function() {
			return new Promise((resolve, reject) => {
				resolve(result || this.updateFx());
			});
		},
	});
};
