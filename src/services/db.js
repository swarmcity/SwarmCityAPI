'use strict';

const logger = require('../logs')(module);

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
            'parameterscontract': '',
            'parameterscontractstartblock': '',
        };
    }

    /**
     * Returns the cached data for a given shortcode
     *
     * @param      {String}   shortcode    The shortcode
     * @return     {Promise}  resolves with a JSON object, rejects with an Error object
     */
    readShortCode(shortcode) {
        logger.info('readShortCode start %s', shortcode);
        return new Promise((resolve, reject) => {
            let key = 'shortcode-' + shortcode;
            this.db.get(key).then((val) => {
                // so we have data..
                try {
                    let data = JSON.parse(val);
                    logger.info('We found data in DB %j', data);
                    // is the code still valid ? If it has not expired, return the data.
                    if (data.validUntil && data.validUntil >= (new Date).getTime()) {
                        logger.info('data is OK');
                        return resolve(data.payload);
                    }
                    logger.info('data has expired');
                    return reject();
                } catch (e) {
                    // can't read the data.
                    return reject();
                }
            }).catch((err) => {
                if (err.notFound) {
                    logger.error('key %s not found (yet) in DB.', key);
                    return reject();
                }
                reject(new Error(err));
            });
        });
    }

    /**
     * saves shortcode payload in DB
     *
     * @param      {string}   shortcode  The shortcode
     * @param      {Number}   validity   The validity of this data in ms
     * @param      {Object}   payload    The payload to store
     * @return     {Promise}  resolves when ready..
     */
    saveDataToShortCode(shortcode, validity, payload) {
        return new Promise((resolve, reject) => {
            let key = 'shortcode-' + shortcode;
            let val = {
                shortcode: shortcode,
                validUntil: (new Date).getTime() + validity,
                payload: payload,
            };
            logger.info('Storing %j at %s', val, key);
            this.db.put(key, JSON.stringify(val)).then(() => {
                resolve();
            }).catch((err) => {
                logger.error(err);
                return reject(err);
            });
        });
    }

    /**
     * Returns last processed block of the parameters contract
     * ( or the deployment block if not initialized yet...)
     *
     * @return     {Promise}  The last block.
     */
    getLastBlock() {
        return new Promise((resolve, reject) => {
            let key = 'lastblock-' + this.options.parameterscontract;
            this.db.get(key).then((val) => {
                resolve(parseInt(val));
            }).catch((err) => {
                if (err.notFound) {
                    logger.info(
                        'no lastblock in DB. Falling back to the startblock %i',
                        this.options.parameterscontractstartblock
                    );
                    resolve(parseInt(this.options.parameterscontractstartblock));
                }
                reject(new Error(err));
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
        return this.db.put('lastblock-' + this.options.parameterscontract, blockNumber);
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
     * Set the hashtaglist
     *
     * @param       {String}    list    The hashtaglist
     * @return      {Promise}   promise
     */
    setHashtagList(list) {
        return this.db.put(this.options.parameterscontract + '-hashtaglist', list);
    }

    /**
     * Get the hashtaglist
     *
     * @return      {Promise}   promise
     */
    getHashtagList() {
        return new Promise((resolve, reject) => {
            let key = this.options.parameterscontract + '-hashtaglist';
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
                    logger.info('Returning empty hashtag list');
                    logger.error('Cannot parse hashtag data from DB. Data: %s. Error: %j', val, e);
                    resolve([]);
                }
            }).catch((err) => {
                logger.error(JSON.stringify(err));
                if (err.notFound) {
                    logger.error('key %s not found (yet) in DB.', key);
                    logger.info('Returning empty hashtag list');
                    resolve([]);
                }
                reject(new Error(err));
            });
        });
    }
}

module.exports = {
    'DBService': DBService,
};
