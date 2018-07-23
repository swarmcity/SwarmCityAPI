'use strict';

const should = require('should');
const sinon = require('sinon');

const DBService = require('../src/services/db').DBService;


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

        it('should reject on unreadable data', function() {
            let mockDB = {
                get: function(key) { },
            };

            sinon.stub(mockDB, 'get').returns(Promise.resolve(null));
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

        it('should fetch a ShortCode from the database that has not expired', function() {
            let mockDB = {
                get: function(key) { },
            };

            let spy = sinon.stub(mockDB, 'get')
                .returns(Promise.resolve(JSON.stringify({
                    'shortCode': 12345,
                    'validUntil': (new Date).getTime() + 1000,
                    'payload': {},
                })));
            let dbService = new DBService(mockDB);

            dbService
                .readShortCode('12345')
                .then((value) => {
                    value.should.be.Object;
                });

            let key = 'shortcode-12345';
            should(spy.calledWith(key)).be.ok;
        });

        it('should not fetch a shortcode from the database that has expired', function() {
            let mockDB = {
                get: function(key) { },
            };

            let spy = sinon.stub(mockDB, 'get')
                .returns(Promise.resolve(JSON.stringify({
                    'shortCode': 12345,
                    'validUntil': (new Date).getTime() - 1000,
                    'payload': {},
                })));
            let dbService = new DBService(mockDB);

            dbService
                .readShortCode('12345')
                .then(() => {
                    return Promise.reject('Expected rejection');
                })
                .catch((e) => {
                    return Promise.resolve(e);
                })
                .then((err) => {
                    should(err).be.ok;
                });

            let key = 'shortcode-12345';
            should(spy.calledWith(key)).be.ok;
        });
    });

    describe('saveDataToShortCode()', function() {
        it('should put correct information in the database', function() {
            let mockDB = {
                put: function(key) { },
            };

            let spy = sinon.stub(mockDB, 'put').returns(Promise.resolve('thing'));

            let dbService = new DBService(
                mockDB,
                {
                    'hashtagproxycontract': 'mockContract',
                }
            );

            dbService.saveDataToShortCode(12345, 100, {});

            let key = 'shortcode-12345';
            let data = {
                'shortCode': 12345,
                'validUntil': (new Date).getTime() + 100,
                'payload': {},
            };
            should(spy.calledWith(key, JSON.stringify(data))).be.ok;
        });

        it('should reject on error', function() {
            let mockDB = {
                put: function(key) { },
            };

            sinon.stub(mockDB, 'put').returns(Promise.reject('Some error'));

            let dbService = new DBService(
                mockDB,
                {
                    'hashtagproxycontract': 'mockContract',
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
        });
    });

    describe('deleteShortCode', function() {
        it('should delete an existing ShortCode', function() {
            let mockDB = {
                del: function(key) { },
            };

            let spy = sinon.stub(mockDB, 'del').returns(true);

            let dbService = new DBService(
                mockDB,
                {
                    'hashtagproxycontract': 'mockContract',
                }
            );

            dbService.deleteShortCode(666);
            let key = 'shortcode-666';
            should(spy.calledWith(key)).be.ok();
        });

        it('should not delete an unexisting ShortCode', function() {
            let mockDB = {
                del: function(key) { },
            };

            let spy = sinon.stub(mockDB, 'del').returns(false);

            let dbService = new DBService(
                mockDB,
                {
                    'hashtagproxycontract': 'mockContract',
                }
            );

            dbService.deleteShortCode(666);
            let key = 'shortcode-666';
            should(spy.calledWith(key)).be.ok();
        });
    });

    describe('setLastHashtagBlock()', function() {
        it('should put correct information in the database', function() {
            let mockDB = {
                put: function(key) { },
            };

            let spy = sinon.stub(mockDB, 'put').returns(Promise.resolve('thing'));

            let dbService = new DBService(
                mockDB,
                {
                    'hashtagproxycontract': 'mockContract',
                }
            );

            dbService.setLastHashtagBlock(150);
            let key = 'lastblock-mockContract';
            should(spy.calledWith(key, 150)).be.ok;
        });
    });

    describe('setHashtagItem(()', function() {
        it('should put correct information in the database', function() {
            let mockDB = {
                put: function(key) { },
            };

            let spy = sinon.stub(mockDB, 'put').returns(Promise.resolve('thing'));

            let dbService = new DBService(
                mockDB,
                {
                    'hashtagproxycontract': 'mockContract',
                }
            );
            let address = '0x1234';
            let item = {temHash: 'Qm13'};
            dbService.setHashtagItem(address, item);
            let key = 'deal-' + address + '-' + item.itemHash;
            should(spy.calledWith(key, item)).be.ok;
        });
    });
    describe('getHashtagItem(()', function() {
        it('should reject on non existing getHashtagItem', function() {
            let mockDB = {
                get: function(key) { },
            };

            let dbService = new DBService(
                mockDB,
                {
                    'hashtagproxycontract': 'mockContract',
                }
            );

            dbService.getHashtagItem('x0123', {itemHash: '123'}).then((res) => {
                Promise.reject('Expected rejection');
            }).catch((err) => {
                return Promise.resolve(err);
            }).then((err) => {
                should(err).be.ok();
            });
        });
    });

    describe('addReplyToHashtagItem()', function() {
        const hashtagItem = {'hash': 'someHash'};
        const db = {
            'deal-0x1234-hash': JSON.stringify(hashtagItem),
        };
        let mockDB = {
            get: async (key) => db[key],
            put: async (key, val) => {db[key] = val;},
        };
        const reply = 'reply';

        let dbService = new DBService(mockDB);

        it('should reject on non existing getHashtagItem', () => {
            return dbService.addReplyToHashtagItem('address', 'hash', {})
            .should.be.rejected();
        });

        it('should add a reply to the hashtagItem object', async () => {
            let res = await dbService.addReplyToHashtagItem('0x1234', 'hash', reply);
            should(res).deepEqual(Object.assign(hashtagItem, {
                replies: [reply],
            }));
        });
    });

    describe('addSelecteeToHashtagItem()', function() {
        const hashtagItem = {'hash': 'someHash'};
        const db = {
            'deal-0x1234-hash': JSON.stringify(hashtagItem),
        };
        let mockDB = {
            get: async (key) => db[key],
            put: async (key, val) => {db[key] = val;},
        };
        const selectee = 'selectee';

        let dbService = new DBService(mockDB);

        it('should reject on non existing getHashtagItem', () => {
            return dbService.addSelecteeToHashtagItem('address', 'hash', {})
            .should.be.rejected();
        });

        it('should add a selectee to the hashtagItem object', async () => {
            let res = await dbService.addSelecteeToHashtagItem('0x1234', 'hash', selectee);
            should(res).deepEqual(Object.assign(hashtagItem, {selectee}));
        });
    });

    describe('getLastHashtagBlock()', function() {
        it('should return the last block number from the database', function() {
            let mockDB = {
                get: function(key) { },
            };
            let spy = sinon.stub(mockDB, 'get').returns(Promise.resolve('4456'));

            let dbService = new DBService(
                mockDB,
                {
                    'hashtagproxycontract': 'mockContract',
                }
            );

            dbService.getLastHashtagBlock().then((value) => {
                should(value).be.equal(4456);
            });

            let key = 'lastblock-mockContract';
            should(spy.calledWith(key));
        });

        it('should reject on DB lookup failure', function() {
            let mockDB = {
                get: function(key) { },
            };
            let spy = sinon.stub(mockDB, 'get')
                .returns(Promise.reject('Unknown DB Error'));

            let dbService = new DBService(
                mockDB,
                {
                    'hashtagproxycontract': 'mockContract',
                }
            );

            dbService.getLastHashtagBlock()
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

        it('should return the startvalue on entry not found', function() {
            let mockDB = {
                get: function(key) { },
            };
            let spy = sinon.stub(mockDB, 'get')
                .returns(Promise.reject({'notFound': true}));

            let dbService = new DBService(
                mockDB,
                {
                    'hashtagproxycontract': 'mockContract',
                    'hashtagproxycontractstartblock': '12345',
                }
            );

            dbService.getLastHashtagBlock().then((value) => {
                should(value).be.equal(12345);
            });

            let key = 'lastblock-mockContract';
            should(spy.calledWith(key));
        });
    });

    describe('setLastBlock()', function() {
        it('should put correct information in the database', function() {
            let mockDB = {
                put: function(key) { },
            };

            let spy = sinon.stub(mockDB, 'put').returns(Promise.resolve('thing'));

            let dbService = new DBService(
                mockDB,
                {
                    'hashtagproxycontract': 'mockContract',
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
                get: function(key) { },
            };
            let spy = sinon.stub(mockDB, 'get').returns(Promise.resolve('456'));

            let dbService = new DBService(
                mockDB,
                {
                    'hashtagproxycontract': 'mockContract',
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
                get: function(key) { },
            };
            let spy = sinon.stub(mockDB, 'get')
                .returns(Promise.reject('Unknown DB Error'));

            let dbService = new DBService(
                mockDB,
                {
                    'hashtagproxycontract': 'mockContract',
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

        it('should return the startvalue on entry not found', function() {
            let mockDB = {
                get: function(key) { },
            };
            let spy = sinon.stub(mockDB, 'get')
                .returns(Promise.reject({'notFound': true}));

            let dbService = new DBService(
                mockDB,
                {
                    'hashtagproxycontract': 'mockContract',
                    'hashtagproxycontractstartblock': '1234',
                }
            );

            dbService.getLastBlock().then((value) => {
                should(value).be.equal(1234);
            });

            let key = 'lastblock-mockContract';
            should(spy.calledWith(key));
        });
    });

    describe('setHashtagList()', function() {
        it('should put correct information in the database', function() {
            let mockDB = {
                put: function(key) { },
            };

            let spy = sinon.stub(mockDB, 'put').returns(Promise.resolve('thing'));

            let dbService = new DBService(
                mockDB,
                {
                    'hashtagproxycontract': 'mockContract',
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
                get: function(key) { },
            };

            let spy = sinon.stub(mockDB, 'get').returns(Promise.resolve('[]'));

            let dbService = new DBService(
                mockDB,
                {
                    'hashtagproxycontract': 'mockContract',
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
                get: function(key) { },
            };

            let spy = sinon.stub(mockDB, 'get').returns(Promise.resolve(null));

            let dbService = new DBService(
                mockDB,
                {
                    'hashtagproxycontract': 'mockContract',
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
                get: function(key) { },
            };

            let spy = sinon.stub(mockDB, 'get').returns(Promise.reject({'notFound': true}));

            let dbService = new DBService(
                mockDB,
                {
                    'hashtagproxycontract': 'mockContract',
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
                get: function(key) { },
            };

            let spy = sinon.stub(mockDB, 'get').returns(Promise.reject('Unknown error'));

            let dbService = new DBService(
                mockDB,
                {
                    'hashtagproxycontract': 'mockContract',
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
                put: function(key) { },
            };

            let spy = sinon.stub(mockDB, 'put').returns(Promise.resolve('thing'));

            let dbService = new DBService(
                mockDB,
                {
                    'hashtagproxycontract': 'mockContract',
                }
            );

            dbService.setHashtagIndexerSynced(true);
            let key = 'hashtagindexer-synced';
            should(spy.calledWith(key, true)).be.ok();
        });
    });

    describe('setHashtagSynced()', function() {
        it('should put correct information in the database', function() {
            let mockDB = {
                put: function(key) { },
            };

            let spy = sinon.stub(mockDB, 'put').returns(Promise.resolve('things'));

            let dbService = new DBService(
                mockDB,
                {
                    'hashtagproxycontract': 'mockContract',
                }
            );
            let address = '0x123456789';
            dbService.setHashtagSynced(address, true);
            let key = 'hashtag-synced-' + address;
            should(spy.calledWith(key, true)).be.ok();
        });
    });


    describe('getTransactionHistory()', function() {
        it('should return an empty list when the database contains invalid data', function() {
            let mockDB = {
                get: function(key) { },
                put: function(key, value) { },
            };

            let spyGet = sinon.stub(mockDB, 'get').returns(Promise.resolve('{]'));
            let spyPut = sinon.stub(mockDB, 'put').returns(Promise.resolve());

            let dbService = new DBService(
                mockDB,
                {
                    'hashtagproxycontract': 'mockContract',
                }
            );

            let pubkey = '0x123456789';

            dbService
                .getTransactionHistory(pubkey)
                .then((history) => {
                    should(history).be.Object;
                    should(history).have.ownProperty('pubkey');
                    should(history.pubkey).be.equal(pubkey);
                    should(history).have.ownProperty('lastUpdate');
                    should(history).have.ownProperty('lastRead');
                    should(history).have.ownProperty('endBlock');
                    should(history).have.ownProperty('transactionHistory');
                    should(history.transactionHistory).be.Array;
                });
            let key = pubkey + '-transactionHistory';
            should(spyGet.calledWith(key)).be.ok();
            should(spyPut.calledOnce);
        });

        it('should return an empty list when the database contains null', function() {
            let mockDB = {
                get: function(key) { },
                put: function(key, value) { },
            };

            let spyGet = sinon.stub(mockDB, 'get').returns(Promise.resolve(null));
            let spyPut = sinon.stub(mockDB, 'put').returns(Promise.resolve());

            let dbService = new DBService(
                mockDB,
                {
                    'hashtagproxycontract': 'mockContract',
                }
            );

            let pubkey = '0x123456789';

            dbService
                .getTransactionHistory(pubkey)
                .then((history) => {
                    should(history).be.Object;
                    should(history).have.ownProperty('pubkey');
                    should(history.pubkey).be.equal(pubkey);
                    should(history).have.ownProperty('lastUpdate');
                    should(history).have.ownProperty('lastRead');
                    should(history).have.ownProperty('endBlock');
                    should(history).have.ownProperty('transactionHistory');
                    should(history.transactionHistory).be.Array;
                });
            let key = pubkey + '-transactionHistory';
            should(spyGet.calledWith(key)).be.ok();
            should(spyPut.calledOnce);
        });

        it('should return an empty list when there is nothing in the database', function() {
            let mockDB = {
                get: function(key) { },
                put: function(key, value) { },
            };

            let spyGet = sinon.stub(mockDB, 'get').returns(Promise.reject({'notFound': true}));
            let spyPut = sinon.stub(mockDB, 'put').returns(Promise.resolve());

            let dbService = new DBService(
                mockDB,
                {
                    'hashtagproxycontract': 'mockContract',
                }
            );

            let pubkey = '0x123456789';

            dbService
                .getTransactionHistory(pubkey)
                .then((history) => {
                    should(history).be.Object;
                    should(history).have.ownProperty('pubkey');
                    should(history.pubkey).be.equal(pubkey);
                    should(history).have.ownProperty('lastUpdate');
                    should(history).have.ownProperty('lastRead');
                    should(history).have.ownProperty('endBlock');
                    should(history).have.ownProperty('transactionHistory');
                    should(history.transactionHistory).be.Array;
                });
            let key = pubkey + '-transactionHistory';
            should(spyGet.calledWith(key)).be.ok();
            should(spyPut.calledOnce);
        });

        it('should return data when there is something in the database', function() {
            let mockDB = {
                get: function(key) { },
                put: function(key, value) { },
            };

            let pubkey = '0x123456789';

            let historyBeforeRead = {
                pubkey: pubkey,
                lastUpdate: (new Date).getTime(),
                lastRead: (new Date).getTime(),
                endBlock: 123456,
                transactionHistory: [],
            };

            let spyGet = sinon.stub(mockDB, 'get').returns(
                Promise.resolve(JSON.stringify(historyBeforeRead))
            );
            let spyPut = sinon.stub(mockDB, 'put').returns(Promise.resolve());

            let dbService = new DBService(
                mockDB,
                {
                    'hashtagproxycontract': 'mockContract',
                }
            );

            dbService
                .getTransactionHistory(pubkey)
                .then((history) => {
                    should(history).be.Object;
                    should(history).have.ownProperty('pubkey');
                    should(history.pubkey).be.equal(pubkey);
                    should(history).have.ownProperty('lastUpdate');
                    should(history).have.ownProperty('lastRead');
                    should(history.lastRead).be.greaterThan(historyBeforeRead.lastRead);
                    should(history).have.ownProperty('endBlock');
                    should(history).have.ownProperty('transactionHistory');
                    should(history.transactionHistory).be.Array;
                });
            let key = pubkey + '-transactionHistory';
            should(spyGet.calledWith(key)).be.ok();
            should(spyPut.calledOnce);
        });

        it('should reject on DB lookup failure', function() {
            let mockDB = {
                get: function(key) { },
            };

            let spy = sinon.stub(mockDB, 'get').returns(Promise.reject('Unknown error'));

            let dbService = new DBService(
                mockDB,
                {
                    'hashtagproxycontract': 'mockContract',
                }
            );

            let pubkey = '0x123456789';

            dbService
                .getTransactionHistory(pubkey)
                .then(() => {
                    return Promise.reject('Expected rejection');
                })
                .catch((e) => {
                    return Promise.resolve(e);
                })
                .then((err) => {
                    should(err).be.ok();
                });

            let key = pubkey + '-transactionHistory';
            should(spy.calledWith(key)).be.ok();
        });
    });

    describe('setTransactionHistory()', function() {
        it('should put correct information in the database', function() {
            let mockDB = {
                put: function(key) { },
            };

            let spy = sinon.stub(mockDB, 'put').returns(Promise.resolve('thing'));

            let dbService = new DBService(
                mockDB,
                {
                    'hashtagproxycontract': 'mockContract',
                }
            );

            let pubkey = '0x123456789';

            let history = [{
                timeDate: 234234234,
                direction: 'in',
                amount: 666,
                symbol: 'SWT',
                from: '0x0',
                to: '0x0',
                confirmations: 1,
            }, {
                timeDate: 234234234,
                direction: 'out',
                amount: 69,
                symbol: 'SWT',
                from: '0x0',
                to: '0x0',
                confirmations: 60,
            }];

            dbService.setTransactionHistory(pubkey, 9876, history);
            let key = pubkey + '-transactionHistory';
            should(spy.calledWith(key)).be.ok();
        });
    });
});
