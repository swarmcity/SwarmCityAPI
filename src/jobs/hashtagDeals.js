'use strict';

require('../environment');
const logger = require('../logs')(module);
const web3 = require('../globalWeb3').web3;
const hashtagContract = require('../contracts/hashtagSimpleDeal.json');

const ipfs = require('../scheduler/IPFSQueueLight');

const dbService = require('../services').dbService;
const eventBus = require('../eventBus');

const fetchProviderReputation = require('../utils/fetchProviderReputation');

/**
 * @param   {Number}    blockNumber     Log of a token transfer as returned by the
 *                              contract.
 * @return  {String}    Promise that resolves to a SWT log.
 */
async function getBlockTime(blockNumber) {
    let dateTime;
    try {
        const block = await web3.eth.getBlock(blockNumber);
        dateTime = parseInt(block.timestamp);
    } catch (e) {
        dateTime = Math.floor(Date.now()/1000);
    }
    return dateTime;
}

/**
 * @param   {Object}    log     Log of a token transfer as returned by the
 *                              contract.
 * @return  {Object}    Promise that resolves to a SWT log.
 */
async function createItem(log) {
    return {
        'itemHash': log.returnValues.itemHash,
        'hashtagAddress': log.address,
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
        'dateTime': await getBlockTime(log.blockNumber),
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
    try {
        const item = await createItem(log, log.blockNumber);

        const hashtagContractInstance = new web3.eth.Contract(
            hashtagContract.abi,
            '0xCeb2F510DE0945e6540cf507d0E18ED9A7e1B3fE'
        );

        const _item = await hashtagContractInstance.methods.readItem('0xa920a4d63006a48c791571690399db8c38c7d2c07218e32f823dfbbf493d7b3f').call();
        console.log('GOT READ ITEM');
        console.log(_item);

        // Resolve its metadata
        const metadata = await ipfs.cat(item.ipfsMetadata).catch((err) => {
            logger.error('Metadata unavailable, '
            +'hashtag: '+hashtagAddress+', item: '+item.itemHash);
            return JSON.stringify({});
        });
        let data = JSON.parse(metadata);
        item.description = data.description || '';
        item.location = data.location || '';
        item.seeker.username = data.username || '';
        item.seeker.avatarHash = data.avatarHash || '';

        // Store hashtagItem
        await dbService.setHashtagItem(hashtagAddress, item);
    } catch (e) {
        logger.error('Error handling event NewItemForTwo: %s', e);
    }
}

/**
 * Gets the ReplyItem past events.
 *
 * @param      {Object}   log                         The start block
 * @param      {Object}   hashtagAddress              The hashtag contract address
 */
async function handleEventReplyItem(log, hashtagAddress) {
    // @dev Event ReplyItem - This event is fired when a new reply is added.
    // event ReplyItem(bytes32 indexed itemHash, string ipfsMetadata, address provider);
    try {
        const itemHash = log.returnValues.itemHash;
        const ipfsMetadata = log.returnValues.ipfsMetadata;
        const provider = log.returnValues.provider;

        const providerRep = await fetchProviderReputation(hashtagAddress, provider);

        // Resolve its metadata
        const metadata = await ipfs.cat(ipfsMetadata).catch((err) => {
            logger.error('Metadata unavailable, '
            +'hashtag: '+hashtagAddress+', item: '+itemHash);
            return JSON.stringify({});
        }).then(JSON.parse);

        const reply = Object.assign(metadata.replier || {}, {
            reputation: providerRep, // '5'
            description: metadata.description || 'unavailable', // 'I can help you better'
            dateTime: await getBlockTime(log.blockNumber), // 1528215492, unix timestamp in seconds
        });

        logger.info('Storing replyRequest for item %s', itemHash);
        // Returns the new hashtagItem
        await dbService.addReplyToHashtagItem(
            hashtagAddress,
            itemHash,
            reply
        );
    } catch (e) {
        logger.error('Error handling event ReplyItem: %s', e);
    }
}

/**
 * Gets the ReplyItem past events.
 *
 * @param      {Object}   log                         The start block
 * @param      {Object}   hashtagAddress              The hashtag contract address
 */
async function handleEventSelectReplier(log, hashtagAddress) {
    // @dev Event SelectReplier - This event is fired when a replier is set.
    // event SelectReplier(bytes32 itemHash, address selectedReplier);
    try {
        const itemHash = log.returnValues.itemHash;
        const selectedReplier = log.returnValues.selectedReplier;

        logger.info('Storing selectee for item %s', itemHash);
        // Returns the new hashtagItem
        await dbService.addSelecteeToHashtagItem(
            hashtagAddress,
            itemHash,
            selectedReplier
        );
    } catch (e) {
        logger.error('Error handling event ReplyItem: %s', e);
    }
}


const handleEvent = (event, hashtagAddress) => {
    let itemHash;
    if (event && event.returnValues && event.returnValues.itemHash) {
        itemHash = event.returnValues.itemHash;
    }
    logger.info('Got event: '+event.event+' from hashtag: '
        +hashtagAddress+(itemHash ? ', itemHash: '+itemHash : ''));
    switch (event.event) {
        case 'NewItemForTwo':
            handleEventNewItemForTwo(event, hashtagAddress);
            break;
        case 'FundItem':
            handleEventFundItem(event, hashtagAddress);
            break;
        case 'ItemStatusChange':
            handleEventItemStatusChange(event, hashtagAddress);
            break;
        case 'ReplyItem':
            handleEventReplyItem(event, hashtagAddress);
            break;
        case 'SelectReplier':
            handleEventSelectReplier(event, hashtagAddress);
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
