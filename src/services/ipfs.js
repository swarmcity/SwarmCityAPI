'use strict';

const logger = require('../logs')(module);

const bl = require('bl');

/**
 * A service that collects all interactions with IPFS
 */
class IPFSService {
    /**
     * Create an IPFSService
     * @param   {ipfsAPI}   ipfs    The connection to ipfs
     */
    constructor(ipfs) {
        this.ipfs = ipfs;
    }

    /**
     * Checks if the given string is a valid IPFS hash
     *
     * @param      {string}   possibleHash  The string to test
     * @return     {boolean}  True if it validates as an ipfs hash, False otherwise.
     */
    isIPFSHash(possibleHash) {
        return (
            possibleHash &&
            possibleHash.length === 46 &&
            possibleHash.substring(0, 2) === 'Qm'
        );
    }

    /**
     * Returns a Buffer with the IPFS data of the given hash
     *
     * @param      {String}   hash    The IPFS hash
     * @return     {Promise}  resolves with a Buffer object, rejects with an Error object
     */
    cat(hash) {
        logger.info('CAT hash: %s', hash);
        if (!this.isIPFSHash(hash)) {
            return Promise.reject(new Error(hash + ' is not a valid IPFS hash'));
        }
        return new Promise((resolve, reject) => {
            this.ipfs.files.cat(hash, (err, stream) => {
                if (err) {
                    return reject(new Error(err));
                }
                stream.pipe(bl((err, data) => {
                    if (err) {
                        reject(new Error(err));
                    } else {
                        resolve(data);
                    }
                }));
            });
        });
    }

    /**
     * Returns the ipfsHash for that payload
     *
     * @param      {String}   payload string data
     * @return     {Promise}  resolves with a IPFS hash ex. "Qm......."
     */
    add(payload) {
        return new Promise((resolve, reject) => {
            this.ipfs.files.add(Buffer.from(payload, 'utf8'), (err, result) => {
                if (err) {
                    return reject(new Error(err));
                }
                return resolve(result[0].hash);
            });
        });
    }
}

module.exports = {
    'IPFSService': IPFSService,
};
