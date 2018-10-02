function ether (n) {
  return new web3.BigNumber(web3.toWei(n, 'ether'));
}

const tokenToWei = n => (new BigNumber(10)).pow(18).times(n);

const getEthBalance = (address) => web3.eth.getBalance(address);
const getTxFee = async ({ tx, receipt }) => {
  return (await web3.eth.getTransaction(tx).gasPrice).times(receipt.gasUsed);
};

module.exports = {
  ether,
  tokenToWei,
  getEthBalance,
  getTxFee
};
