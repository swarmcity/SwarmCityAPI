'use strict';

const logger = require('../logs')(module);
const jsonHash = require('json-hash');
const eventBus = require('../eventBus');

/**
 * A service that collects all interactions with LevelDb
 */
class DBService {
    /**
     * Create a DBService
     * @param   {levelDb}   db      The connection to leveldb
     * @param   {Object}    options Contains options
     * @todo    Ensure all options are set
     */
    constructor(db, options) {
        this.db = db;
        this.options = options || {
            'hashtagproxycontract': '',
            'hashtagproxycontractstartblock': '',
        };
    }

    /**
     * Parse utility of a db value.
     *
     * @param       {String}    val    value
     * @return      {Promise}   promise
     */
    parse(val) {
        return val ? JSON.parse(val) : val;
    }

    /**
     * Get value of key.
     *
     * @param       {String}    key    key
     * @return      {Promise}   promise
     */
    get(key) {
        // proxy get
        key = key.toLowerCase();
        return this.db.get(key).then(this.parse);
    }

    /**
     * Get values meeting of key followed by a wildcard.
     *
     * @param       {String}    key    key
     * @return      {Promise}   promise
     */
    getRange(key) {
        // proxy get
        key = key.toLowerCase();
        const getUnparsedValues = (key) => {
            return new Promise((resolve, reject) => {
                let values = [];
                this.db.createValueStream({gte: key+'!', lte: key+'~'})
                .on('data', (value) => values.push(value))
                .on('end', () => resolve(values))
                .on('error', (err) => reject(err));
            });
        };
        return getUnparsedValues(key)
        .then((unparsedValues) => unparsedValues.map(this.parse));
    }

    /**
     * Set value of key.
     *
     * @param       {String}    key    key
     * @param       {Object}    data    data
     * @return      {Promise}   promise
     */
    set(key, data) {
        // proxy set
        key = key.toLowerCase();
        const newValue = JSON.stringify(data);
        // First, verify if the value has changed
        return this.db.get(key)
        .catch((err) => {
            if (err.message.includes('Key not found')) return;
            else throw err;
        })
        .then((value) => {
            if (jsonHash.digest(value) !== jsonHash.digest(newValue)) {
                eventBus.emit('dbChange', key, data);
            }
            return this.db.put(key, newValue);
        });
    }

    /**
     * Get all items in database.
     *
     * @return      {Promise}   promise
     */
    getAll() {
        return new Promise((resolve, reject) => {
            let allDb = {};
            this.db.createReadStream({
                gte: '',
            }).on('data', function(data) {
                try {
                    allDb[data.key] = JSON.parse(data.value);
                } catch (e) {
                    //
                }
            }).on('error', function(err) {
                reject('Error on getAll: '+(err.message ? err.message : err));
            }).on('close', function() {
                resolve(allDb);
            });
        });
    }


    /**
     * Get chat the object or create a new one.
     *
     * @param       {String}    itemHash    The hash of the hashtagItem
     * @param       {Object}    info    The hash of the hashtagItem
     * @return      {Promise}   promise
     */
    getChat(itemHash, info = {}) {
        let key = 'chat-' + itemHash;
        return this.get(key).catch((err) => {
            if (err.message.includes('Key not found')) {
                let chat = Object.assign(info, {
                    itemHash,
                    accessKeys: [],
                    messages: [],
                });
                return this.set(key, chat).then(() => {
                    return chat;
                });
            } else {
                throw err;
            }
        });
    }

    /**
     * Add accessKeys to the chat object.
     *
     * @param       {String}    itemHash    The hash of the hashtagItem
     * @param       {Array}    accessKeys    The hash of the hashtagItem
     * @return      {Promise}   promise
     */
    addAccessKeysToChat(itemHash, accessKeys) {
        let key = 'chat-' + itemHash;
        return this.get(key).then((chatObject) => {
            if (!chatObject) chatObject = {};
            // Initialize the members object
            if (!chatObject.accessKeys) {
                chatObject.accessKeys = [];
            }
            for (const accessKey of accessKeys) {
                if (!chatObject.accessKeys.includes(accessKey)) {
                    chatObject.accessKeys.push(accessKey);
                }
            }
            return this.set(key, chatObject).then(() => {
                return chatObject;
            });
        });
    }

    /**
     * Add message to the chat object.
     *
     * @param       {String}    itemHash    The hash of the hashtagItem
     * @param       {Object}    message    message to be stored
     * @return      {Promise}   promise
     */
    addMessageToChat(itemHash, message) {
        let key = 'chat-' + itemHash;
        return this.get(key).then((chatObject) => {
            if (!chatObject) chatObject = {};
            // Initialize the messages array
            if (!chatObject.messages) {
                chatObject.messages = [];
            }
            chatObject.messages.push(message);
            return this.set(key, chatObject).then(() => {
                return chatObject;
            });
        });
    }


    /**
     * Returns true if this clientIp is throttled
     *
     * @param      {String}   clientIp    The ShortCode
     * @return     {Promise}  resolves with a JSON object, rejects with an Error object
     */
    getIpRequestingShortcode(clientIp) {
        return this.db.get(`clientIp-${clientIp}`).catch((err) => {
            if (err.notFound) return null;
            throw err;
        });
    }

    /**
     * Sets if clientIp is throttled
     *
     * @param      {String}   clientIp    The ShortCode
     * @param      {Bool}     throttled    throttled
     * @return     {Promise}  resolves with a JSON object, rejects with an Error object
     */
    setIpRequestingShortcode(clientIp, throttled) {
        return this.db.put(`clientIp-${clientIp}`, throttled);
    }

    /**
     * Returns the cached data for a given
     *
     * @param      {String}   shortcode    The ShortCode
     * @return     {Promise}  resolves with a JSON object, rejects with an Error object
     */
    getShortcodeData(shortcode) {
        let key = 'sc-' + shortcode;
        return this.db.get(key).then((val) => {
            try {
                return JSON.parse(val);
            } catch (e) {
                throw Error(`Error parsing shortcode data: ${e.message}`);
            }
        }).catch((err) => {
            if (err.notFound) return null;
            throw err;
        });
    }

    /**
     * Set data for a shortcode
     *
     * @param      {String}   shortcode    The Shortcode
     * @param      {Object}   data         Data
     * @return     {Promise}  resolves with a JSON object, rejects with an Error object
     */
    setShortcodeData(shortcode, data) {
        return Promise.all([
            this.db.put('sc-' + shortcode, JSON.stringify(data)),
            this.db.get('sc-count').catch((err) => {
                if (err.notFound) return 0;
                else throw err;
            }).then((scCount) => {
                return this.db.put('sc-count', scCount++);
            }),
        ]);
    }

    /**
     * Returns the cached data for a given
     *
     * @param      {String}   shortcode    The ShortCode
     * @return     {Promise}  resolves with a JSON object, rejects with an Error object
     */
    deleteShortcodeData(shortcode) {
        return Promise.all([
            this.db.del('sc-' + shortcode),
            this.db.get('sc-count').catch((err) => {
                if (err.notFound) return 1;
                else throw err;
            }).then((scCount) => {
                return this.db.put('sc-count', scCount--);
            }),
        ]);
    }

    /**
     * Returns the number of current active shortcodes
     *
     * @return     {Promise}  resolves with a JSON object, rejects with an Error object
     */
    getNumberOfShortcodes() {
        return this.db.get('sc-count').catch((err) => {
            if (err.notFound) return 0;
            else throw err;
        });
    }

    /**
     * Returns the cached data for a given
     *
     * @param      {String}   shortCode    The ShortCode
     * @return     {Promise}  resolves with a JSON object, rejects with an Error object
     */
    readShortCode(shortCode) {
        logger.debug('readShortCode start %s', shortCode);
        return new Promise((resolve, reject) => {
            let key = 'shortcode-' + shortCode;
            this.db.get(key).then((val) => {
                // so we have data..
                try {
                    let data = JSON.parse(val);
                    logger.debug('We found data in DB %j', data);
                    // is the code still valid ? If it has not expired, return the data.
                    if (data.validUntil && data.validUntil >= (new Date).getTime()) {
                        logger.debug('data is OK');
                        return resolve(data.payload);
                    }
                    logger.debug('data has expired');
                    return reject();
                } catch (e) {
                    // can't read the data.
                    return reject();
                }
            }).catch((err) => {
                if (err.notFound) {
                    logger.error('key %s not found (yet) in DB.', key);
                }
                return reject(err);
            });
        });
    }

    /**
     * saves ShortCode payload in DB
     *
     * @param      {string}   shortCode  The ShortCode
     * @param      {Number}   validity   The validity of this data in ms
     * @param      {Object}   payload    The payload to store
     * @return     {Promise}  resolves when ready..
     */
    saveDataToShortCode(shortCode, validity, payload) {
        return new Promise((resolve, reject) => {
            let key = 'shortcode-' + shortCode;
            let val = {
                shortCode: shortCode,
                validUntil: (new Date).getTime() + validity,
                payload: payload,
            };
            // logger.debug('Storing %j at %s', val, key);
            this.db.put(key, JSON.stringify(val)).then(() => {
                resolve();
            }).catch((err) => {
                logger.error('Error on saveDataToShortCode: '+(err.message ? err.message : err));
                reject('Error on saveDataToShortCode: '+(err.message ? err.message : err));
            });
        });
    }

    /**
     * Delete a ShortCode
     *
     * @param   {String}    shortCode   ShortCode
     * @return  {Promise}   Promise
     */
    deleteShortCode(shortCode) {
        let key = 'shortcode-' + shortCode;
        logger.debug('Deleting %s', key);
        return this.db.del(key);
    }

    /**
     * get all ShortCodes from the database
     *
     * @return      {stream.Readable}   A readable stream of the ShortCodes
     */
    getShortCodes() {
        return this.db.createReadStream({
            gte: 'shortcode-',
        });
    }

    /**
     * Returns last processed block of the hashtagProxy contract
     * ( or the deployment block if not initialized yet...)
     *
     * @return     {Promise}  The last block.
     */
    getLastBlock() {
        return new Promise((resolve, reject) => {
            let key = 'lastblock-' + this.options.hashtagproxycontract;
            this.db.get(key).then((val) => {
                resolve(parseInt(val));
            }).catch((err) => {
                if (err.notFound) {
                    logger.info(
                        'no lastblock in DB. Falling back to the startblock %i',
                        this.options.hashtagproxycontractstartblock
                    );
                    resolve(parseInt(this.options.hashtagproxycontractstartblock));
                }
                reject('Error on getLastBlock: '+(err.message ? err.message : err));
            });
        });
    }

    /**
     * Returns last processed block of the hashtag contract
     *
     * @param       {String}   hashtag the address of the hashtag
     * @return      {Promise}  The last block.
     */
    getLastHashtagBlock(hashtag) {
        return new Promise((resolve, reject) => {
            let key = 'lastblock-' + hashtag;
            this.db.get(key).then((val) => {
                resolve(parseInt(val));
            }).catch((err) => {
                if (err.notFound) {
                    logger.info(
                        'no lastblock in DB. Falling back to the startblock %i',
                        this.options.hashtagproxycontractstartblock
                    );
                    resolve(parseInt(this.options.hashtagproxycontractstartblock));
                }
                reject('Error on getLastHashtagBlock: '+(err.message ? err.message : err));
            });
        });
    }

    /**
     * Sets the last block.
     *
     * @param      {Number}     blockNumber  The block number
     * @return     {Promise}    promise
     */
    setLastBlock(blockNumber) {
        return this.db.put('lastblock-' + this.options.hashtagproxycontract, blockNumber);
    }

    /**
     * Sets the last block.
     *
     * @param      {Number}     address         The address of the hashtag
     * @param      {Number}     blockNumber     The block number
     * @return     {Promise}    promise
     */
    setLastHashtagBlock(address, blockNumber) {
        return this.db.put('lastblock-' + address, blockNumber);
    }


    /**
     * Set the hashtagindexer to synced
     *
     * @param       {Boolean}   synced  Is it synced or not?
     * @return      {Promise}   promise
     */
    setHashtagIndexerSynced(synced) {
        return this.db.put('hashtagindexer-synced', synced);
    }

    /**
     * Set the hashtagindexer to synced
     *
     * @param      {Number}     address         The address of the hashtag
     * @param       {Boolean}   synced  Is it synced or not?
     * @return      {Promise}   promise
     */
    setHashtagSynced(address, synced) {
        return this.db.put('hashtag-synced-' + address, synced);
    }

    /**
     * Set the hashtaglist
     *
     * @param       {String}    list    The hashtaglist
     * @return      {Promise}   promise
     */
    setHashtagList(list) {
        return this.db.put(this.options.hashtagproxycontract + '-hashtaglist', list);
    }

    /**
     * Set the hashtags
     *
     * @param       {Object}    hashtags    The hashtaglist
     * @return      {Promise}   promise
     */
    setHashtags(hashtags) {
        return this.set('hashtags', hashtags);
    }

    /**
     * Set single hashtag
     *
     * @param       {Number}    hashtagAddress    Hashtag address
     * @param       {Object}    hashtag    The hashtaglist
     * @return      {Promise}   promise
     */
    setHashtag(hashtagAddress, hashtag) {
        return this.set('hashtag-'+hashtagAddress, hashtag);
    }

    /**
     * Get the hashtags
     *
     * @return      {Promise}   promise
     */
    getHashtags() {
        return this.get('hashtags');
    }

    /**
     * Get single hashtags
     *
     * @param       {Number}    hashtagAddress    Hashtag address
     * @return      {Promise}   promise
     */
    getHashtag(hashtagAddress) {
        return this.get('hashtag-'+hashtagAddress);
    }

    /**
     * Set the hashtaglist
     *
     * @param       {Number}    address     The address of the hashtag
     * @param       {String}    itemHash        The hashtaglist
     * @param       {Object}    item        The hashtaglist
     * @return      {Promise}   promise
     */
    setHashtagItem(address, itemHash, item) {
        const key = 'item-' + address + '-' + itemHash;
        return this.get(key).catch((err) => {
            if (err.message.includes('Key not found')) return {};
            else throw err;
        })
        .then((oldItem) => this.set(
            key,
            Object.assign(oldItem, item))
        );
    }

    /**
     * Set the hashtaglist
     *
     * @param       {Number}    address     The address of the hashtag
     * @param       {String}    itemHash    The itemHash
     * @return      {Promise}   promise
     */
    getHashtagItem(address, itemHash) {
        return this.get('item-' + address + '-' + itemHash).catch((err) => {
            if (err.notFound || err.message.includes('Key not found')) {
                logger.debug(
                    'no deal %s for %s in DB',
                    itemHash,
                    address
                );
                return {};
            }
            throw err;
        });
    }

    /**
     * Set the hashtaglist
     *
     * @param       {Number}    address     The address of the hashtag
     * @param       {String}    item        The hashtaglist
     * @param       {String}    metadata    The metadata
     * @return      {Promise}   promise
     */
    updateHashtagItem(address, item, metadata) {
        return new Promise((resolve, reject) => {
            let key = 'item-' + address + '-' + item.itemHash;
            this.get(key).then((newItem) => {
                let data = JSON.parse(metadata);
                newItem.description = data.description || '';
                newItem.location = data.location || '';
                newItem.seeker.username = data.username || '';
                newItem.seeker.avatarHash = data.avatarHash || '';
                this.set(key, newItem).then(() => {
                    resolve({});
                });
            }).catch((err) => {
                if (err.notFound) {
                    logger.debug(
                        'no item %s for %s in DB',
                        item.itemHash,
                        address
                    );
                    resolve({});
                }
                reject('Error on updateHashtagItem: '+(err.message ? err.message : err));
            });
        });
    }

    /**
     * Add reply to the hashtagItem
     *
     * @param       {Number}    hashtagAddress     The hashtagAddress of the hashtag
     * @param       {String}    itemHash    The hash of the hashtagItem
     * @param       {Object}    reply       The metadata
     * @return      {Promise}   promise
     */
    addReplyToHashtagItem(hashtagAddress, itemHash, reply) {
        let key = 'item-' + hashtagAddress + '-' + itemHash;
        return this.get(key).then((hashtagItem) => {
            // Initialize array of replies
            if (!hashtagItem.replies || typeof hashtagItem.replies !== typeof {}) {
                hashtagItem.replies = {};
            }
            // Append reply
            hashtagItem.replies[reply.address] = reply;
            // Store modified item
            return this.set(key, hashtagItem).then(() => hashtagItem);
        });
    }

    /**
     * Add selectee to the hashtagItem
     *
     * @param       {Number}    hashtagAddress     The hashtagAddress of the hashtag
     * @param       {String}    itemHash    The hash of the hashtagItem
     * @param       {Object}    selectee    The metadata
     * @return      {Promise}   promise
     */
    addSelecteeToHashtagItem(hashtagAddress, itemHash, selectee) {
        let key = 'item-' + hashtagAddress + '-' + itemHash;
        return this.get(key).then((hashtagItem) => {
            // Add selectee
            if (hashtagItem.replies
                && typeof hashtagItem.replies === typeof {}
                && hashtagItem.replies[selectee]
            ) {
                hashtagItem.selectee = hashtagItem.replies[selectee];
            } else {
                hashtagItem.selectee = {
                    address: selectee,
                };
            }
            // Store modified item
            return this.set(key, hashtagItem).then(() => hashtagItem);
        });
    }

    /**
     * update items status
     *
     * @param       {Number}    hashtagAddress     The hashtagAddress of the hashtag
     * @param       {String}    itemHash    The hash of the hashtagItem
     * @param       {String}    newStatus    The metadata
     * @return      {Promise}   promise
     */
    updateItemStatus(hashtagAddress, itemHash, newStatus) {
        let key = 'item-' + hashtagAddress + '-' + itemHash;
        return this.get(key).then((hashtagItem) => {
            // update the status
            hashtagItem.status = newStatus;
            // Store modified item
            return this.set(key, hashtagItem).then(() => hashtagItem);
        });
    }


    /**
    * Get all deals for a hashtag
    *
    * @param       {Number}    address     The address of the hashtag
    * @return      {stream.Readable}   A readable stream of the ShortCodes
    */
    getHashtagDeals(address) {
        return this.getRange('item-' + address);
    }

    /**
    * Get all deals for a hashtag
    *
    * @param       {Number}    hashtagAddress     The address of the hashtag
    * @return      {Promise}   A readable stream of the ShortCodes
    */
    getHashtagItems(hashtagAddress) {
        return this.getRange('item-' + hashtagAddress);
    }

    /**
     * Get the hashtaglist
     *
     * @return      {Promise}   promise
     */
    getHashtagList() {
        return new Promise((resolve, reject) => {
            let key = this.options.hashtagproxycontract + '-hashtaglist';
            this.db.get(key).then((val) => {
                try {
                    let hashtags = JSON.parse(val);
                    // this is debug stuff
                    hashtags.push({
                        name: 'Random ' + Math.floor(Math.random() * 10 + 5),
                        deals: Math.floor(Math.random() * 10 + 5),
                        id: '1c9v87bc98v7a',
                        commission: 0.05,
                        maintainer: '0x369D787F3EcF4a0e57cDfCFB2Db92134e1982e09',
                        contact: [{
                            name: 'hashtagman2@gmail.com',
                            link: 'mailto:hashtagman2@gmail.com',
                        }, {
                            name: '@hashtag2 (Twitter)',
                            link: 'http://twitter.com/@hashtag2',
                        }],
                    });
                    resolve(hashtags);
                } catch (e) {
                    logger.debug('Returning empty hashtag list');
                    logger.error('Cannot parse hashtag data from DB. Data: %s. Error: %j', val, e);
                    resolve([]);
                }
            }).catch((err) => {
                logger.error('Error on getHashtagList: '+JSON.stringify(err));
                if (err.notFound) {
                    logger.error('key %s not found (yet) in DB.', key);
                    logger.debug('Returning empty hashtag list');
                    resolve([]);
                }
                reject('Error on getHashtagList: '+(err.message ? err.message : err));
            });
        });
    }

    /**
     * Delete a user's transaction history
     *
     * @param   {String}    pubkey      User's pubkey
     * @return  {Promise}   Promise
     */
    deleteTransactionHistory(pubkey) {
        let key = pubkey + '-transactionHistory';
        return this.db.del(key);
    }

    /**
     * Save a user's transaction history.
     *
     * @param   {String}    pubkey      User's pubkey
     * @param   {Number}    endBlock    Last block that was included in this
     *                                  history.
     * @param   {Object}    transactionHistory  User's transaction history
     * @return  {Promise}   promise
     */
    setTransactionHistory(pubkey, endBlock, transactionHistory) {
        let key = pubkey + '-transactionHistory';
        let val = {
            pubkey: pubkey,
            lastUpdate: (new Date).getTime(),
            lastRead: (new Date).getTime(),
            endBlock: endBlock,
            transactionHistory: transactionHistory,
        };
        // logger.debug('Storing %j at %s', val, key);
        return this.db.put(key, JSON.stringify(val));
    }

    /**
     * Get an empty txHistory.
     *
     * @param   {String}    pubkey  User's pubkey
     * @return  {Object}    Default txHistory
     */
    _getEmptyTxHistory(pubkey) {
        return {
            pubkey: pubkey,
            lastUpdate: (new Date).getTime(),
            lastRead: (new Date).getTime(),
            endBlock: process.env.SWTSTARTBLOCK - 1,
            transactionHistory: [],
        };
    }

    /**
     * Get a user's transactionHistory and some metadata.
     *
     * @param   {String}    pubkey  User's pubkey
     * @return  {Promise}   A promise that resolves to an object containing a
     *                      user's transactionHistory and some metadata, such as
     *                      the time it was last updated. Or rejects when an
     *                      error occurs.
     */
    getTransactionHistory(pubkey) {
        logger.debug('Getting history for %s', pubkey);
        return new Promise((resolve, reject) => {
            let key = pubkey + '-transactionHistory';
            this.db.get(key).then((val) => {
                logger.debug('Going to parse %s', val);
                let history;
                try {
                    history = JSON.parse(val) || this._getEmptyTxHistory(pubkey);
                } catch (e) {
                    logger.error(
                        'Cannot parse transactionHistory data from DB for %s. Data: %s. Error: %j',
                        pubkey,
                        val,
                        e
                    );
                    history = this._getEmptyTxHistory(pubkey);
                }
                history.lastRead = (new Date).getTime();
                this.db.put(key, JSON.stringify(history)).then(() => {
                    logger.debug(history);
                    resolve(history);
                }).catch((err) => {
                    logger.debug('Could not update lastRead value because: %s', err);
                    logger.debug(history);
                    resolve(history);
                });
            }).catch((err) => {
                logger.error('Error on getTransactionHistory: '+JSON.stringify(err));
                if (err.notFound) {
                    logger.debug('key %s not found (yet) in DB.', key);
                    resolve(this._getEmptyTxHistory(pubkey));
                }
                reject('Error on getTransactionHistory: '+(err.message ? err.message : err));
            });
        });
    }
}

module.exports = {
    'DBService': DBService,
};
