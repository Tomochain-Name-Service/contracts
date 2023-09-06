//SPDX-License-Identifier: MIT
pragma solidity >=0.8.12 <0.9.0;

import {TomoNs} from "../registry/TomoNs.sol";
import {IReverseRegistrar} from "../registry/IReverseRegistrar.sol";

contract ReverseClaimer {
    bytes32 constant ADDR_REVERSE_NODE =
        0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2;

    constructor(TomoNs tomoNs, address claimant) {
        IReverseRegistrar reverseRegistrar = IReverseRegistrar(
            tomoNs.owner(ADDR_REVERSE_NODE)
        );
        reverseRegistrar.claim(claimant);
    }
}