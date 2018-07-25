#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

# Executes cleanup function at script exit.
trap cleanup EXIT

cleanup() {
  # Kill the ganache instance that we started (if we started one and if it's still running).
  if [ -n "$ganache_pid" ] && ps -p $ganache_pid > /dev/null; then
    kill -9 $ganache_pid
  fi
}

if [ "$SOLIDITY_COVERAGE" = true ]; then
  ganache_port=8555
else
  ganache_port=8545
fi

ganache_running() {
  nc -z localhost "$ganache_port"
}

start_ganache() {
  # We define 5 accounts with balance 1M ether, needed for high-value tests.
  local accounts=(
    --account="0xa5e6473343d8d6fe4d19317edc764191eadd0621a580855013392548f29a542c,1000000000000000000000000"
    --account="0x7701ad06e40a61b4d8f4af2d674065593d785ea078c8ccef7c4e9be0d9fb2181,1000000000000000000000000"
    --account="0xe57569554633760d0a2ac6e76c78775cbbb3e8a2fda4fa7edf42087fa126eaa0,1000000000000000000000000"
    --account="0xc16e553218c5d9e5ae619dd85d4066c9c8a1e1787cb625f83617ea9a330a8c32,1000000000000000000000000"
    --account="0x0d6d617c06b3161c0976cf36b0381c6ade0b138453aaae232d5817d0dfe9d268,1000000000000000000000000"
  )

  if [ "$SOLIDITY_COVERAGE" = true ]; then
    if [ -e node_modules/.bin/testrpc-sc ]; then
      echo "npm installed"
      # If you installed using npm
      node_modules/.bin/testrpc-sc --gasLimit 0xfffffffffff --port "$ganache_port" "${accounts[@]}" > /dev/null &
    else
      # If you installed using yarn
      echo "yarn installed"
      node_modules/ethereumjs-testrpc-sc/build/cli.node.js  --gasLimit 0xfffffffffff --port "$ganache_port" "${accounts[@]}" > /dev/null &
    fi
  else
    node_modules/.bin/ganache-cli --gasLimit 0xfffffffffff "${accounts[@]}" > /dev/null &
  fi
  ganache_pid=$!
}

if ganache_running; then
  echo "Using existing ganache instance"
else
  echo "Starting our own ganache instance"
  start_ganache
fi

if [ "$SOLC_NIGHTLY" = true ]; then
  echo "Downloading solc nightly"
  wget -q https://raw.githubusercontent.com/ethereum/solc-bin/gh-pages/bin/soljson-nightly.js -O /tmp/soljson.js && find . -name soljson.js -exec cp /tmp/soljson.js {} \;
fi

if [ "$SOLIDITY_COVERAGE" = true ]; then
  node_modules/.bin/solidity-coverage

  if [ "$CONTINUOUS_INTEGRATION" = true ]; then
    cat coverage/lcov.info | node_modules/.bin/coveralls
  fi
else
  node_modules/.bin/truffle test --reset --network rpc "$@"
fi