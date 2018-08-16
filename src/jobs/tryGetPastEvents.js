process.env.ETHWS = 'wss://kovan.infura.io/ws';
process.env.HASHTAG_LIST_ADDRESS = '0x5148944fc8CC745A53258a61509f33165026A9B8';
const web3 = require('../globalWeb3').web3;
const hashtagContract = require('../contracts/hashtagSimpleDeal.json');
const hashtagListContract = require('../contracts/hashtagList.json');

const hashtagListContractInstance = new web3.eth.Contract(
    hashtagListContract.abi,
    process.env.HASHTAG_LIST_ADDRESS
);
hashtagListContractInstance.methods.readHashtag(4).call()
.then(console.log);


const hashtagAddress = '0x3a1A67501b75FBC2D0784e91EA6cAFef6455A066';
const deployBlock = 8149489;

const getPastEvents = (blockDiff) => {
    const fromBlock = 8319554 - blockDiff;
    return hashtagContractInstance.getPastEvents('allEvents', {
        fromBlock,
        toBlock: 'latest',
    })
    .then((logs) => {
        console.log('Got '+logs.length+' logs');
    });
};

let hashtagContractInstance = new web3.eth.Contract(
    hashtagContract.abi,
    hashtagAddress
);

const init = async () => {
    for (let i=0; i < 100; i++) {
        const blockDiff = i * 100000;
        const tag = blockDiff+' blocks';
        console.time(tag);
        await (getPastEvents(blockDiff));
        console.timeEnd(tag);
    }
};

// init();


