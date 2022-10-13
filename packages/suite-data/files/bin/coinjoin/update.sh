#!/usr/bin/env bash
set -e

# TODO: this file should download the binaries from https://github.com/trezor/coinjoin-backend
# once those files are available in releases.
# For now we include unzip and copying to right directory.

7z x -y CoinjoinClientLibrary-binary.zip

for p in linux-x64 linux-arm64 osx-x64 osx-arm64 win-x64; do
    cp -r ${p}/publish/* ${p}/
    rm -rf ${p}/publish
done

rm CoinjoinClientLibrary-binary.zip
