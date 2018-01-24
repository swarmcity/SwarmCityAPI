'use strict';

const web3 = require('../globalWeb3').web3;

const validate = require('../validators');

module.exports = function() {
	return ({
		/**
		 * Get Balance
		 * @param {object} data - { address: <The user's pub key> }
		 * @return {Array} - Balances of that user
		 */
		getBalance: function(data) {
			return new Promise((resolve, reject) => {
				if (!data || !data.address) {
					return reject(new Error('No data/address supplied'));
				}

				if (!validate.isAddress(data.address)) {
					return reject(new Error('No valid address supplied'));
				}

				let promisesList = [];
				const minimeContract = require('../contracts/miniMeToken.json');
				const tokens = ['SWT', 'ARC'];
				const tokenIndex = require('../contracts/index.json');
				tokens.forEach((token) => {
					let tokenContract = new web3.eth.Contract(
						minimeContract.abi,
						tokenIndex[token]
					);
					promisesList.push(tokenContract.methods.balanceOf(data.address).call()
						.then((res) => {
							return {
								balance: res,
								tokenSymbol: token,
								contractAddress: tokenIndex[token],
							};
						})
						.catch((e) => {
							reject(Error(e));
						}));
				});
				promisesList.push(web3.eth.getBalance(data.address)
					.then((res) => {
						return {
							balance: res,
							tokenSymbol: 'ETH',
						};
					}));
                resolve(Promise.all(promisesList).then((res) => {
					return res.reduce((accumulator, currentValue) => {
						let symbol = currentValue.tokenSymbol;
						delete currentValue.tokenSymbol;
						accumulator[symbol.toLowerCase()] = currentValue;
						return accumulator;
					}, {});
				}));
			});
		},
	});
};
