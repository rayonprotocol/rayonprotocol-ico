#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

# Check if command exists
exists() {
  command -v "$1" >/dev/null 2>&1
}

if !(exists solidity_flattener); then
  echo 'Error: `solidity_flattener` is not installed.' >&2
  exit 1
fi

flatten() {
  local target_solidity_file_names=(
    "./contracts/RayonTokenCrowdsale"
    "./contracts/RayonToken"
  )
  local suffix="Flattened";
  for target_solidity_file_name in "${target_solidity_file_names[@]}"
    do
      solidity_flattener --solc-paths="openzeppelin-solidity=$(pwd)/node_modules/openzeppelin-solidity" --output=${target_solidity_file_name}${suffix}.sol ${target_solidity_file_name}.sol
    done

  echo ""
  echo ""
  echo "=================================== Contracts are flattened =================================== "
  for target_solidity_file_name in "${target_solidity_file_names[@]}"
    do
      echo "  ${target_solidity_file_names[0]}.sol => $target_solidity_file_name${suffix}.sol"
    done
}

flatten
