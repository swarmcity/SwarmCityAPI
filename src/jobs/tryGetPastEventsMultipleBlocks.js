process.env.ETHWS = 'wss://kovan.infura.io/ws';
const web3 = require('../globalWeb3').web3;
const hashtagContract = require('../contracts/hashtagSimpleDeal.json');

const hashtagAddress = '0x9Ffe60f2A9153BD0a5bb9446A06286B67FADf1bE';

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

init();


