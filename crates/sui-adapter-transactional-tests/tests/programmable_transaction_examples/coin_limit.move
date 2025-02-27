// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

//# init --addresses test=0x0 --accounts A

//# publish
module test::m1 {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;

    struct CoolMarker has key, store { id: UID }

    public entry fun purchase(coin: Coin<SUI>, ctx: &mut TxContext) {
        transfer::public_transfer(purchase_(coin, ctx), tx_context::sender(ctx))
    }

    public fun purchase_(coin: Coin<SUI>, ctx: &mut TxContext): CoolMarker {
        assert!(coin::value(&coin) >= 100, 0);
        transfer::public_transfer(coin, @0x70DD);
        CoolMarker { id: object::new(ctx) }
    }

}

// call an entry function
//# programmable --sender A --inputs 100

//> 0: SplitCoins(Gas, [Input(0)]); // split the coin as a limit
//> 1: test::m1::purchase(Result(0));

//# view-object 107

//# view-object 108

// call a non-entry function, but forget the object
//# programmable --sender A --inputs 100

//> 0: SplitCoins(Gas, [Input(0)]); /* split the coin as a limit */
//> 1: test::m1::purchase_(Result(0));

// call a non-entry function, and transfer the object
//# programmable --sender A --inputs 100 @A

//> 0: SplitCoins(Gas, [Input(0), Input(0)]); /* /* nested */*/
//> 1: test::m1::purchase_(NestedResult(0, 0));
//> 2: test::m1::purchase_(NestedResult(0, 1));
//> TransferObjects([Result(1), Result(2)], Input(1));

//# view-object 111

//# view-object 112

//# view-object 113

//# view-object 114
