const erc20TokenContract = require('../contracts/erc20Token.json');
const hashtagContractAbiMin = [
    {
        'constant': true,
        'inputs': [],
        'name': 'ProviderRep',
        'outputs': [{'name': '', 'type': 'address'}],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function',
    },
    {
        'constant': true,
        'inputs': [],
        'name': 'SeekerRep',
        'outputs': [{'name': '', 'type': 'address'}],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function',
    },
];


const getReputationFactory = (
	db,
	web3
) => async (data) => {
	// data = {
	// 	address: <some user address>
    // }
    const address = data.address;

	// 1. Should get the list of addresses of hashtags
    const hashtags = await db.getHashtags();

    // role = 'Provider', 'Seeker'
    const getBalance = async (hashtagContract, address, method) => {
        const repAddress = await hashtagContract.methods[method]().call();
        const repContract = new web3.eth.Contract(
            erc20TokenContract.abi,
            repAddress
        );
        return await repContract.methods.balanceOf(address).call();
    };

    const res = await Promise.all(hashtags.map((hashtag) => {
        const {hashtagAddress, hashtagName} = hashtag;
        // 2. Should get the address of the reputation contract
        const hashtagContract = new web3.eth.Contract(
            hashtagContractAbiMin,
            hashtagAddress,
        );
        // 3. Should get the reputation balance of the user
        return Promise.all([
            getBalance(hashtagContract, address, 'ProviderRep'),
            getBalance(hashtagContract, address, 'SeekerRep'),
        ]).then(([providerRep, seekerRep]) => ({
            providerRep,
            seekerRep,
            hashtagName,
        }));
    }));

    // 4. Should return all balances
    return res;
};

module.exports = getReputationFactory;
