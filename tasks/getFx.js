'use strict';

const logger = require('../logs')('getFx');

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
						if (error && error.code === 'ETIMEDOUT'){
							logger.error('updateFx timeout on request');
							return reject(new Error(error));
						}
						if (error || (response && response.statusCode !== 200)) {
							return reject(new Error(error));
						}
						try {
							let parsedBody = JSON.parse(body);
							result = {
								price_btc: parsedBody[0].price_btc,
								price_eur: Number(parsedBody[0].price_eur).toFixed(2),
								price_usd: Number(parsedBody[0].price_usd).toFixed(2),
								symbol: parsedBody[0].symbol,
							};
							logger.info('updateFx success');
							logger.debug('updateFx result=', result);
							return resolve(result);
						} catch (e) {
							logger.error('updateFx err=', new Error(e));
							return reject(e);
						}
					});
			});
		},
		getFx: function() {
			if (result){
				return Promise.resolve(result);
			}else{
				return this.updateFx();
			}
		},
	});
};
