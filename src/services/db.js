'use strict';

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
}

module.exports = {
    'DBService': DBService,
};
