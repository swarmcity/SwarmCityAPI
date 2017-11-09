'use strict';

const web3 = require('../globalWeb3').web3;

module.exports = function() {
	return ({
		/**
		 * Get Balance
		 * @param {object} data - { address: <The user's pub key> }
		 * @return {Array} - Balances of that user
		 */
		getBalance: function(data) {
			return new Promise((resolve, reject) => {
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
								publicKey: data.address,
								tokenSymbol: token,
								tokenContractAddress: tokenIndex[token],

							};
						}));
				});
				promisesList.push(web3.eth.getBalance(data.address)
					.then((res) => {
						return {
							balance: res,
							publicKey: data.address,
							tokenSymbol: 'ETH',
							tokenContractAddress: '0x0',
						};
					}));
				resolve(Promise.all(promisesList));
			});
		},
	});
};
