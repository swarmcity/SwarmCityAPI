'use strict';

const logs = require('../logs.js')(module);
const web3 = require('../globalWeb3').web3;
const ethereumjsutil = require('ethereumjs-util');

module.exports = function() {
    return ({
        sendSignedTransaction: (data) => {
            return new Promise((resolve, reject) => {
                if (!data.tx) {
                    reject('No tx present. Can\'t send.');
                }
                let tx = ethereumjsutil.addHexPrefix(data.tx);
                logs.debug('Sending signed transaction: %s', tx);
                web3.eth.sendSignedTransaction(tx)
                    .once('transactionHash', (hash) => {
                        logs.debug('transactionHash %s', hash);
                        resolve({'transactionHash': hash});
                    })
                    .on('error', (err, receipt) => {
                        if (err.message &&
                            err.message.startsWith('Failed to check for transaction receipt')
                        ) {
                            logs.debug('Another complaint about the receipt ignored.');
                        } else {
                            logs.error(err);
                            if (receipt) {
                                logs.error('We might be out of Gas: %j', receipt);
                            }
                            reject('Transaction error: ' + err);
                        }
                    });
            });
        },
    });
};
