'use strict';
const should = require('should');
const logger = require('../src/logs')(module);

const io = require('socket.io-client');
const subscriptions = require('../src/subscriptions')();

const showEnv = require('../src/showEnv');
showEnv.showEnv();

const options = {
	transports: ['websocket', 'xhr-polling'],
	path: '/api',
};


describe('Swarm City API socket client > test pubsub on \'shhsubscribe\'', function() {
    let server;
    let client;
    let subscriptionsArray = [];

    let socketURL;

    before(function(done) {
        if (process.env.TESTSHH && process.env.TESTSHH == '1') {
            // create a server
            server = require('../src/socket');

            server.listen({
                APISOCKETPORT: 12205,
            }).then((con) => {
                socketURL = 'http://localhost:' +
                    con.port;
                logger.info('socketURL=', socketURL);
                done();
            });
        } else {
            this.skip();
        }
    });

    it('should subscribe / receive a subscription ID', function(done) {
        logger.info('connecting to ', socketURL);
        client = io.connect(socketURL, options);

        let messagehandler = function() {
            return new Promise((resolve, reject) => {
                // wait for SHH message to arrive..
                client.on('sshMessage', (reply) => {
                    logger.info('got sshMessage', reply);
                    should(reply).have.property('response', 200);
                    should(reply).have.property('subscriptionId');
                    should(reply).have.property('data').with.a.property('hello', 'world');
                    resolve();
                });
            });
        };

        let subscribe = function() {
            return new Promise((resolve, reject) => {
                client.emit('subscribe', {
                    channel: 'shhsubscribe',
                    args: {
                        mode: 'shortcode',
                    },
                }, (reply) => {
                    logger.info('shhsubscribe reply', reply);

                    should(reply).have.property('response', 200);
                    should(reply).have.property('subscriptionId');
                    should(reply).have.property('data').with.a.property('shortcode');

                    subscriptionsArray.push(reply.subscriptionId);

                    resolve(reply);
                });
            });
        };


        let emitssh = function(shortcode) {
            return new Promise((resolve, reject) => {
                client.emit('sendShhMessage', {
                    shortcode: shortcode, // reply.data.shortcode,
                    payload: {
                        hello: 'world',
                    },
                }, (reply) => {
                    logger.info('sendShhMessage reply>>>', reply);
                    should(reply).have.property('response', 200);
                    should(reply).have.property('data');
                    resolve();
                });
            });
        };

        messagehandler().then(() => {
            logger.info('now unregister & quit.');
            done();
        });

        subscribe().then((reply) => {
            logger.info('got subscribe reply', reply);
            return Promise.resolve(reply.data.shortcode);
        }).then((shortcode) => {
            logger.info('the shortcode is', shortcode);
            return emitssh(shortcode);
        });
    });

    it('should list subscriptions', (done) => {
        subscriptions.status().then(done);
    });

    it('should unsubscribe / receive a confirmation', (done) => {
        let promises = [];
        subscriptionsArray.forEach((subscription) => {
            logger.info('unsubscribe from', subscription);
            promises.push(new Promise((resolve, reject) => {
                client.emit('unsubscribe', {
                    subscriptionId: subscription,
                }, (data) => {
                    should(data).have.property('response', 200);
                    logger.info('unsubscribe>>>', data);
                    resolve();
                });
            }));
        });

        Promise.all(promises).then(() => {
            done();
        }).catch((err) => {
            logger.info(err);
            done();
        });
    });

    after(function(done) {
        if (process.env.TESTSHH && process.env.TESTSHH == '1') {
            logger.info('closing client socket');
            client.close(() => {
                logger.info('client closed...');
            });
            server.close().then(() => {
                logger.info('server closed...');
                done();
            });
        } else {
            done();
        }
    });
});
