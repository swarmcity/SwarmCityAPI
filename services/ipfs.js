'use strict';

const logger = require('../logs')('services/ipfs');

const bl = require('bl');

class IPFSService {

    constructor(ipfs) {
        this.ipfs = ipfs
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
        logger.info('CAT hash', hash);
        return new Promise((resolve, reject) => {
            this.ipfs.files.cat(hash, (err, stream) => {
                if (err) {
                    return reject(new Error(err));
                }
                stream.pipe(bl((err, data) => {
                    if (err) {
                        reject(new Error(err));
                    } else {
                        resolve(data.toString());
                    }
                }));
            });
        });
    }

}

module.exports = {
    'IPFSService': IPFSService
};
