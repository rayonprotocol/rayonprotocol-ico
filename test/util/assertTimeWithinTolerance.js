const BigNumber = web3.BigNumber;

/**
 * assert time for block within small tolerance
 * @param actual
 * @param expected
 * @param tolerance tolerance time in seconds (default: 1 second)
 */
const assertTimeWithinTolerance = (actual, expected, tolerance = 1) => {
  const actualBigNumber = actual instanceof BigNumber ? actual : new BigNumber(actual);
  const expectedBigNumber = expected instanceof BigNumber ? expected : new BigNumber(expected);
  actualBigNumber.should.be.bignumber
    .least(expectedBigNumber.minus(tolerance))
    .most(expectedBigNumber.plus(tolerance));
}

export default assertTimeWithinTolerance;