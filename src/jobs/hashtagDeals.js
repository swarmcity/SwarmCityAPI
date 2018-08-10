'use strict';

require('../environment');
const logger = require('../logs')(module);
const web3 = require('../globalWeb3').web3;
const hashtagContract = require('../contracts/hashtagSimpleDeal.json');

const ipfs = require('../scheduler/IPFSQueueLight');

const dbService = require('../services').dbService;
const eventBus = require('../eventBus');

/**
 * @param   {Object}    log     Log of a token transfer as returned by the
 *                              contract.
 * @param   {Number}    blockHeight Height of the current block
 * @return  {Object}    Promise that resolves to a SWT log.
 */
async function createItem(log, blockHeight) {
    let block;

    try {
        block = await web3.eth.getBlock(log.blockNumber);
    } catch (e) {
        logger.error(
            'Unable to fetch block to determine time of block. Error: %s',
            e
        );
        block = {
            'dateTime': (new Date).getTime(),
        };
    }

    return {
        'itemHash': log.returnValues.itemHash,
        'hashtagFee': log.returnValues.hashtagFee,
        'ipfsMetadata': log.returnValues.ipfsMetadata,
        /* 'totalValue': log.returnValues.totalValue, */
        'value': log.returnValues.itemValue,
        'seeker': {
            address: log.returnValues.owner,
            username: '',
            avatarHash: '',
            rep: log.returnValues.seekerRep,
        },
        'description': '',
        'dateTime': block.timestamp,
        'location': '',
    };
}

/**
 * handles a FundItem event.
 *
 * @param      {Object}   log                         The start block
 * @param      {Object}   hashtagAddress              The hashtag contract address
 */
function handleEventFundItem(log, hashtagAddress) {
    let itemHash = log.returnValues.itemHash;
    dbService.changeSelecteeToProvider(hashtagAddress, itemHash).then(() => {
        // No use for the result
    });
}

/**
 * handles a ItemStatusChange event.
 *
 * @param      {Object}   log                         The start block
 * @param      {Object}   hashtagAddress              The hashtag contract address
 */
function handleEventItemStatusChange(log, hashtagAddress) {
    // ItemStatusChange(
    //     address owner,
    //     bytes32 itemHash,
    //     itemStatuses newstatus,
    //     string ipfsMetadata
    // )
    let itemHash = log.returnValues.itemHash;
    let newstatus = log.returnValues.newstatus;
    dbService.updateItemStatus(hashtagAddress, itemHash, newstatus).then(() => {
        // No use for the result
    });
}

/**
 * Gets the NewItemForTwo past events.
 *
 * @param      {Object}   log                         The start block
 * @param      {Object}   hashtagAddress              The hashtag contract address
 */
async function handleEventNewItemForTwo(log, hashtagAddress) {
    const item = await createItem(log, log.blockNumber);
    await dbService.setHashtagItem(hashtagAddress, item);
    const res = await ipfs.cat(item.ipfsMetadata).catch((err) => {
        logger.error('Metadata unavailable, '
        +'hashtag: '+hashtagAddress+', item: '+item.itemHash);
        return JSON.stringify({});
    });
    await dbService.updateHashtagItem(hashtagAddress, item, res);
}


const handleEvent = (event, hashtagAddress) => {
    logger.info('Got event: '+event.event+' from hashtag: '+hashtagAddress);
    switch (event.event) {
        case 'NewItemForTwo':
            handleEventNewItemForTwo(event, hashtagAddress);
            break;
        case 'FundItem':
            handleEventFundItem(event, hashtagAddress);
            break;
        case 'ItemStatusChange':
            handleEventItemStatusChange(event, hashtagAddress);
    }
};

/**
 * Start this job
 */
async function start() {
    // When we have the list of hashtags it will be necessary to add an
    // array of tasks, one for each hashtag

    eventBus.on('hashtagChange', (hashtag) => {
        // Construct wrap
        const handleEventWrap = (event) => {
            handleEvent(event, hashtag.hashtagAddress);
        };

        // Get past events
        const hashtagContractInstance = new web3.eth.Contract(
            hashtagContract.abi,
            hashtag.hashtagAddress
        );
        const fromDeploy = false;
        hashtagContractInstance.getPastEvents('NewItemForTwo', {
            fromBlock: fromDeploy ? 8149489 : 0,
            toBlock: 'latest',
        })
        .then((events) => {
            logger.info('Got '+events.length+' past items from: '+hashtag.hashtagAddress);
            events.forEach(handleEventWrap);
        });

        // Subscribe to new events
        hashtagContractInstance.events.allEvents()
        .on('data', handleEventWrap);
    });
}

// Upcoming
// events.forEach((event) => {
//     // NewItemForTwo Event sample return (event)
//     // { owner: '0x26DfDB612e9226A07f5C3387cb191A43AC4491b0',
//     //   itemHash: '0xa7618111e055533192d0b8773126e356985b28f60cdaa30967f8670e2d391c6f',
//     //   ipfsMetadata: 'QmT4hKD7TcKMpUh6Hwjmp6QMduX7LQvr3RNkap3ZNA44oM',
//     //   itemValue: '10000000000000000000',
//     //   hashtagFee: '600000000000000000',
//     //   totalValue: '10300000000000000000',
//     //   seekerRep: '0' }
//     hashtagContractInstance.methods.readItem(event.returnValues.itemHash).call()
//     .then((item) => {
//         // readItem().call() sample return (item)
//         // { status: '0',
//         //   hashtagFee: '600000000000000000',
//         //   itemValue: '10000000000000000000',
//         //   providerRep: '0',
//         //   seekerRep: '0',
//         //   providerAddress: '0x0000000000000000000000000000000000000000',
//         //   ipfsMetadata: 'QmT4hKD7TcKMpUh6Hwjmp6QMduX7LQvr3RNkap3ZNA44oM' }
//         console.log(item);
//         console.log('Got item from '+hashtag.hashtagAddress);
//     });
//     // console.log('Got event: '+event.event+' from hashtag: '+hashtag.hashtagAddress);
// });

/**
 * Start this job
 * @return      {Promise}
 */
function stop() {
    // TODO
    return new Promise((resolve, reject) => {
        resolve();
    });
}

/**
 * Reset this job
 * @return      {Promise}
 */
function reset() {
    // TODO
    logger.info('Resetting the shortCodeCleader.');
    return new Promise((resolve, reject) => {
        stop().then(() => {
            resolve(start());
        }).catch((error) => {
            logger.error('Could not stop shortCodeCleaner during reset. Restarting anyway.', error);
            resolve(start());
        });
    });
}

module.exports = {
    start: start,
    stop: stop,
    reset: reset,
};
