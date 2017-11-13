const logs = require('../logs.js')();

const web3 = require('../globalWeb3').web3;

module.exports = function() {
	return ({
		getGasPrice: () => {
			return new Promise((resolve, reject) => {
				web3.eth.getGasPrice().then((gasPrice) => {
					logs._eventLog('GasPrice: ', gasPrice.toString(10));
					resolve(gasPrice.toString(10));
				});
			});
		},
	});
};
