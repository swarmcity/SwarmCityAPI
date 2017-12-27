'use strict';

const logger = require('../logs')('globalIPFS');

const bl = require('bl');

class IPFSService {

    constructor(ipfs) {
        this.ipfs = ipfs
    }

    isIPFSHash(possibleHash) {
        return (
            possibleHash &&
            possibleHash.length === 46 &&
            possibleHash.substring(0, 2) === 'Qm'
        );
    }

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
