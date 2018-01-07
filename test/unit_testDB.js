'use strict';

const should = require('should');
const sinon = require('sinon');

const DBService= require('../services/db').DBService;


describe('services/db/DBService', function() {
    describe('readShortCode()', function() {
        it('should reject on DB lookup failure', function() {
            let mockDB = {
                get: function(key) {
                    return Promise.reject('Unknown error.');
                },
            };
            let dbService = new DBService(mockDB);

            return dbService
                    .readShortCode('shortCodeString')
                    .then(() => {
                        return Promise.reject('Expected rejection');
                    })
                    .catch((e) => {
                        return Promise.resolve(e);
                    })
                    .then((err) => {
                        should(err).be.ok;
                    });
        });

        it('should reject on DB entry not found', function() {
            let mockDB = {
                get: function(key) {
                    return Promise.reject({
                        'notFound': true,
                    });
                },
            };
            let dbService = new DBService(mockDB);

            return dbService
                    .readShortCode('shortCodeString')
                    .then(() => {
                        return Promise.reject('Expected rejection');
                    })
                    .catch((e) => {
                        return Promise.resolve(e);
                    })
                    .then((err) => {
                        should(err).be.ok;
                    });
        });
    });

    describe('saveDataToShortCode()', function() {
        it('should put correct information in the database', function() {
            let mockDB = {
                put: function(key) {},
            };

            let spy = sinon.stub(mockDB, 'put').returns(Promise.resolve('thing'));

            let dbService = new DBService(
                mockDB,
                {
                    'parameterscontract': 'mockContract',
                }
            );

            dbService.saveDataToShortCode(12345, 100, {});

            let key = 'shortcode-12345';
            let data = {
                'shortCode': 12345,
                'validUntil': (new Date).getTime() + 100,
                'payload': {}
            };
            should(spy.calledWith(key, JSON.stringify(data))).be.ok;
        });

        it('should reject on error', function() {
            let mockDB = {
                put: function(key) {},
            };

            let spy = sinon.stub(mockDB, 'put').returns(Promise.reject('Some error'));

            let dbService = new DBService(
                mockDB,
                {
                    'parameterscontract': 'mockContract',
                }
            );

            return dbService
                .saveDataToShortCode(12345, 100, {})
                .then(() => {
                    return Promise.reject('Expected rejection');
                }).catch((e) => {
                    return Promise.resolve(e);
                }).then((err) => {
                    should(err).be.ok;
                });

            let key = 'shortcode-12345';
            let data = {
                'shortCode': 12345,
                'validUntil': (new Date).getTime() + 100,
                'payload': {}
            };
            should(spy.calledWith(key, JSON.stringify(data))).be.ok;
        });

    });

    describe('setLastBlock()', function() {
        it('should put correct information in the database', function() {
            let mockDB = {
                put: function(key) {},
            };

            let spy = sinon.stub(mockDB, 'put').returns(Promise.resolve('thing'));

            let dbService = new DBService(
                mockDB,
                {
                    'parameterscontract': 'mockContract',
                }
            );

            dbService.setLastBlock(15);
            let key = 'lastblock-mockContract';
            should(spy.calledWith(key, 15)).be.ok;
        });
    });

    describe('getLastBlock()', function() {
        it('should return the last block number from the database', function() {
            let mockDB = {
                get: function(key) {},
            };
            let spy = sinon.stub(mockDB, 'get').returns(Promise.resolve('456'));

            let dbService = new DBService(
                mockDB,
                {
                    'parameterscontract': 'mockContract',
                }
            );

            dbService.getLastBlock().then((value) => {
                should(value).be.equal(456);
            });

            let key = 'lastblock-mockContract';
            should(spy.calledWith(key));
        });

        it('should reject on DB lookup failure', function() {
            let mockDB = {
                get: function(key) {},
            };
            let spy = sinon.stub(mockDB, 'get')
                           .returns(Promise.reject('Unknown DB Error'));

            let dbService = new DBService(
                mockDB,
                {
                    'parameterscontract': 'mockContract',
                }
            );

            dbService.getLastBlock()
                    .then(() => {
                        return Promise.reject('Expected rejection');
                    })
                    .catch((e) => {
                        return Promise.resolve(e);
                    })
                    .then((err) => {
                        should(err).be.ok;
                    });

            let key = 'lastblock-mockContract';
            should(spy.calledWith(key));
        });

        it('should reject on DB entry not found', function() {
            let mockDB = {
                get: function(key) {},
            };
            let spy = sinon.stub(mockDB, 'get')
                           .returns(Promise.reject({'notFound': true}));

            let dbService = new DBService(
                mockDB,
                {
                    'parameterscontract': 'mockContract',
                }
            );

            dbService.getLastBlock()
                    .then(() => {
                        return Promise.reject('Expected rejection');
                    })
                    .catch((e) => {
                        return Promise.resolve(e);
                    })
                    .then((err) => {
                        should(err).be.ok;
                    });

            let key = 'lastblock-mockContract';
            should(spy.calledWith(key));
        });
    });

    describe('setHashtagList()', function() {
        it('should put correct information in the database', function() {
            let mockDB = {
                put: function(key) {},
            };

            let spy = sinon.stub(mockDB, 'put').returns(Promise.resolve('thing'));

            let dbService = new DBService(
                mockDB,
                {
                    'parameterscontract': 'mockContract',
                }
            );

            dbService.setHashtagList([].toString());
            let key = 'mockContract-hashtaglist';
            should(spy.calledWith(key, '[]')).be.ok;
        });
    });

    describe('getHashtagList()', function() {
        it('should get the hashtaglist from the database', function() {
            let mockDB = {
                get: function(key) {},
            };

            let spy = sinon.stub(mockDB, 'get').returns(Promise.resolve('[]'));

            let dbService = new DBService(
                mockDB,
                {
                    'parameterscontract': 'mockContract',
                }
            );

            dbService
                .getHashtagList()
                .then((hashtaglist) => {
                    should(hashtaglist).be.Array;
                });
            let key = 'mockContract-hashtaglist';
            should(spy.calledWith(key)).be.ok;
        });

        it('should return an empty list when the database contains invalid data', function() {
            let mockDB = {
                get: function(key) {},
            };

            let spy = sinon.stub(mockDB, 'get').returns(Promise.resolve(null));

            let dbService = new DBService(
                mockDB,
                {
                    'parameterscontract': 'mockContract',
                }
            );

            dbService
                .getHashtagList()
                .then((hashtaglist) => {
                    should(hashtaglist).be.Array;
                    should(hashtaglist).have.lengthOf(0);
                });
            let key = 'mockContract-hashtaglist';
            should(spy.calledWith(key)).be.ok;
        });

        it('should return an empty list when the database is empty', function() {
            let mockDB = {
                get: function(key) {},
            };

            let spy = sinon.stub(mockDB, 'get').returns(Promise.reject({'notFound': true}));

            let dbService = new DBService(
                mockDB,
                {
                    'parameterscontract': 'mockContract',
                }
            );

            dbService
                .getHashtagList()
                .then((hashtaglist) => {
                    should(hashtaglist).be.Array;
                    should(hashtaglist).have.lengthOf(0);
                });
            let key = 'mockContract-hashtaglist';
            should(spy.calledWith(key)).be.ok;
        });

        it('should reject on DB lookup failure', function() {
            let mockDB = {
                get: function(key) {},
            };

            let spy = sinon.stub(mockDB, 'get').returns(Promise.reject('Unknown error'));

            let dbService = new DBService(
                mockDB,
                {
                    'parameterscontract': 'mockContract',
                }
            );

            dbService
                .getHashtagList()
                .then(() => {
                    return Promise.reject('Expected rejection');
                })
                .catch((e) => {
                    return Promise.resolve(e);
                })
                .then((err) => {
                    should(err).be.ok;
                });

            let key = 'mockContract-hashtaglist';
            should(spy.calledWith(key)).be.ok;
        });
    });

    describe('setHashtagIndexerSynced()', function() {
        it('should put correct information in the database', function() {
            let mockDB = {
                put: function(key) {},
            };

            let spy = sinon.stub(mockDB, 'put').returns(Promise.resolve('thing'));

            let dbService = new DBService(
                mockDB,
                {
                    'parameterscontract': 'mockContract',
                }
            );

            dbService.setHashtagIndexerSynced(true);
            let key = 'hashtagindexer-synced';
            should(spy.calledWith(key, true)).be.ok;
        });
    });
});
