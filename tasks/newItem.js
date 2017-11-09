module.exports = function(web3) {
// const hashtagContract = require('../contracts/hashtagSimpleDeal.json');
  return ({
    _newItem: function(data) {
      return new Promise((resolve, reject) => {
        // let hashtag = new web3.eth.Contract(hashtagContract.abi,
        // '0x7243895edadbBFE84b619792F7384E67972A1894');
        resolve('0x000');
      });
    },
  });
};
