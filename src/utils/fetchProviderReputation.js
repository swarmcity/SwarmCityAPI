'use strict';

const validate = require('../validators');
const web3Default = require('../globalWeb3').web3;

const hashtagSimpleDealContract = require('../contracts/hashtagSimpleDeal.json');
const erc20TokenContract = require('../contracts/erc20Token.json');

/**
 * clean up a task from the scheduler when socket wants to unsubscribe
 *
 * @param      {String}   hashtagAddress The hashtag smart contract address
 * @param      {String}   providerAddress The hashtag smart contract address
 * @param      {Object}   web3 Used for testing, gets defaut value if not passed
 * @return     {Promise}  result of removing the task (no return value)
 */
async function fetchProviderReputation(hashtagAddress, providerAddress, web3 = web3Default) {
    // ### The reputation is a token balance that should be fetch from the blockchain
    // - Follow the procedure (not implemented, use web3)
    // HashtagAddress = smart contract simple deal
    // => Get the providerRep smart contract address
    // => Do balanceOf(replier.address)
    const hashtagContractInstance = new web3.eth.Contract(
        hashtagSimpleDealContract.abi,
        hashtagAddress
    );

    if (!hashtagContractInstance.methods.ProviderRep) {
        throw Error('Incorrect contrat ABI, ProviderRep method not found');
    }
    // eslint-disable-next-line new-cap
    return hashtagContractInstance.methods.ProviderRep().call()
    .then((providerRepContractAddress) => {
        if (!providerRepContractAddress || !validate.isAddress(providerRepContractAddress)) {
            throw Error('Incorrect providerRepContractAddress: '+providerRepContractAddress);
        }
        const providerRepContract = new web3.eth.Contract(
            erc20TokenContract.abi,
            providerRepContractAddress
        );
        return providerRepContract.methods.balanceOf(providerAddress).call();
    });
}

module.exports = fetchProviderReputation;
