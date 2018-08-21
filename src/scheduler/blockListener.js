const web3 = require('../globalWeb3').web3;
const eventBus = require('../eventBus');
const logger = require('../logs')(module);

let subscription;

const start = () => {
    subscription = web3.eth.subscribe('newBlockHeaders', function(error) {
        if (error) logger.error(error);
    })
    .on('data', function(blockHeader) {
        eventBus.emit('newBlockHeader', blockHeader);
    });
};

// unsubscribes the subscription
const stop = () => {
    subscription.unsubscribe(function(error, success) {
        if (success) {
            logger.info('Successfully unsubscribed!');
        } else if (error) {
            logger.error('Error unsubscribing: '+error);
        }
    });
};

module.exports = {
    start,
    stop,
};


