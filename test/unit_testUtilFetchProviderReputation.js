'use strict';

const logger = require('../src/logs.js')(module);
const should = require('should');
const Web3 = require('web3');

const fetchProviderReputation = require('../src/functions/utils/fetchProviderReputation');

describe('fetchProviderReputation', function() {
    const infura = 'wss://kovan.infura.io/ws';
    const infura2 = 'wss://kovan.infura.io/_ws';
    const dappnode = 'ws://my.kovan.dnp.dappnode.eth:8546';
    const url = infura;

    let web3;

    before('connect to web3', (done) => {
        const web3WebsocketProvider = new Web3.providers.WebsocketProvider(url);
        web3WebsocketProvider.on('connect', () => {
            logger.info('Test web3 instance connected to '+url);
            web3WebsocketProvider.on('connect', () => {});
            web3 = new Web3(web3WebsocketProvider);
            done();
        });
    });

    it('should fetch the reputation of a provider', async () => {
        const hashtagAddress = '0xeba08e7a1d8145b25c78b473fbc35aa24973d908';
        const providerAddress = '0x369d787f3ecf4a0e57cdfcfb2db92134e1982e09';
        const providerRep = await fetchProviderReputation(
            hashtagAddress,
            providerAddress,
            web3
        );
        should(providerRep).equal('0');
    }).timeout(5000);
});
