use core::starknet::SyscallResultTrait;
use snforge_std::{
    declare, test_address, start_cheat_caller_address, start_cheat_block_timestamp,
    ContractClassTrait
};
use contracts::starkloop::{
    Subscription, SubscriptionTrait, IStarkloopDispatcher, IStarkloopDispatcherTrait
};
use starknet::{ContractAddress, contract_address_const, get_block_timestamp, get_caller_address};
use starknet::contract_address::ContractAddressZeroable;

fn deploy_contract() -> ContractAddress {
    let contract = declare("Starkloop").unwrap();

    let owner: ContractAddress = contract_address_const::<'owner'>();
    let mut constructor_calldata = array![owner.into()];

    let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap_syscall();

    contract_address
}
const DAY: u64 = 86400;
const WEEK: u64 = 7 * DAY;
const GWEI: u256 = 1000000000;

#[test]
fn test_create_subscription() {
    // First deploy a new contract
    let contract_address = deploy_contract();

    let dispatcher = IStarkloopDispatcher { contract_address };

    let user1 = contract_address_const::<'user1'>();
    let user2 = contract_address_const::<'user2'>();
    // println!("user1 = {:?}", user2);
    // println!("user1 = {:?}", user2);

    // Check if users are different. I miss a print function :-( (that for sure exits)
    assert(user1 != user2, 'user1 != user2 fails');

    let eth_token_address = contract_address_const::<
        0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7
    >();
    let _strk_token_address = contract_address_const::<
        0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d
    >();
    let _usdc_token_address = contract_address_const::<
        0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8
    >();
    let _usdt_token_address = contract_address_const::<
        0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8
    >();
    let _wbtc_token_address = contract_address_const::<
        0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac
    >();

    // println!("ETH = {:?}", eth_token_address);

    //Starts a subscription on September 21 at 9 a.m.
    start_cheat_block_timestamp(contract_address, 1726909200);
    let current_block_timestamp = get_block_timestamp();
    // println!("current_block_timestamp = {}", current_block_timestamp);

    // This values will be defined by user in the front-end.
    let amount = 2 * GWEI;
    let payment_count = 10_u64;
    let periodicity = WEEK;
    // Computed in the front-end
    let expires_on = current_block_timestamp + payment_count * periodicity;

    let subscription = SubscriptionTrait::new(
        user1, user2, amount, eth_token_address, periodicity, expires_on, 0_u64, true
    );
    assert(dispatcher.create_subscription(subscription) == 1, 'First Id must be 1');

    // This values will be defined by user in the front-end.
    let amount = 1 * GWEI;
    let payment_count = 15_u64;
    let periodicity = 4 * WEEK;
    // Computed in the front-end
    let expires_on = current_block_timestamp + payment_count * periodicity;

    let subscription = SubscriptionTrait::new(
        user2, user1, amount, eth_token_address, periodicity, expires_on, 0_u64, true
    );
    assert(dispatcher.create_subscription(subscription) == 2, 'Second Id must be 2');
}

#[test]
fn test_get_subscription() {
    // First deploy a new contract
    let contract_address = deploy_contract();

    let dispatcher = IStarkloopDispatcher { contract_address };

    // Create 3 users
    let user1 = contract_address_const::<'user1'>();
    let user2 = contract_address_const::<'user2'>();

    let eth_token_address = contract_address_const::<
        0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7
    >();

    //Starts a subscription on September 21 at 9 a.m.
    start_cheat_block_timestamp(contract_address, 1726909200);
    let current_block_timestamp = get_block_timestamp();

    // This values will be defined by user in the front-end.
    let amount = 5 * GWEI;
    let payment_count = 15_u64;
    let periodicity = 4 * WEEK;
    // Computed in the front-end
    let expires_on = current_block_timestamp + payment_count * periodicity;

    // Define a subscription
    let subscription = SubscriptionTrait::new(
        user2, user1, amount, eth_token_address, periodicity, expires_on, 0_u64, true
    );

    // Note to myself : To be able to print a struct, it must have #[derive(Debug)]
    // println!("subscription1 = {:?}", subscription1);

    let new_subscription = Subscription { ..subscription };
    // Create subscription
    // start_cheat_caller_address(contract_address, user1);
    let first_subscription_id = dispatcher.create_subscription(subscription);
    // println!("first_subscription_id = {}", first_subscription_id);

    // Get subscription
    let ret_subscription = dispatcher.get_subscription(first_subscription_id);
    // println!("first_subscription = {:?}", first_subscription);

    // It should return the correct values
    assert(ret_subscription.user == new_subscription.user, 'Wrong user');
    assert(ret_subscription.recipient == new_subscription.recipient, 'Wrong recipient');
    assert(ret_subscription.amount == new_subscription.amount, 'Wrong amount');
    assert(ret_subscription.token_address == new_subscription.token_address, 'Wrong token_address');
    assert(ret_subscription.periodicity == new_subscription.periodicity, 'Wrong periodicity');
    assert(ret_subscription.expires_on == new_subscription.expires_on, 'Wrong expires_ons');
    assert(ret_subscription.last_payment == new_subscription.last_payment, 'Wrong last_payment');
    assert(ret_subscription.is_active == new_subscription.is_active, 'Wrong is_active');

    // Note to myself : To be able to compare struct, it must have #[derive(PartialEq)]
    assert(ret_subscription == new_subscription, 'Wrong subscription');
}

#[test]
fn test_undefined_subscription() {
    let contract_address = deploy_contract();
    let dispatcher = IStarkloopDispatcher { contract_address };

    let empty_subscription = SubscriptionTrait::new(
        ContractAddressZeroable::zero(),
        ContractAddressZeroable::zero(),
        0_u256,
        ContractAddressZeroable::zero(),
        0_u64,
        0_u64,
        0_u64,
        false
    );

    let undefined_subscription = dispatcher.get_subscription(8_u256);
    assert(undefined_subscription == empty_subscription, 'transaction should not exist')
}

#[test]
fn test_subscription_ids() {
    // First deploy a new contract
    let contract_address = deploy_contract();

    let dispatcher = IStarkloopDispatcher { contract_address };

    // Create 3 users
    let user1 = contract_address_const::<'user1'>();
    let user2 = contract_address_const::<'user2'>();

    let eth_token_address = contract_address_const::<
        0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7
    >();

    //Starts a subscription on September 21 at 9 a.m.
    start_cheat_block_timestamp(contract_address, 1726909200);
    let current_block_timestamp = get_block_timestamp();

    // This values will be defined by user in the front-end.
    let amount = 5 * GWEI;
    let payment_count = 15_u64;
    let periodicity = 4 * WEEK;
    // Computed in the front-end
    let expires_on = current_block_timestamp + payment_count * periodicity;

    // Define a subscription
    let subscription = SubscriptionTrait::new(
        user2, user1, amount, eth_token_address, periodicity, expires_on, 0_u64, true
    );

    // Note to myself : To be able to print a struct, it must have #[derive(Debug)]
    // println!("subscription1 = {:?}", subscription1);

    let mut subscription1 = Subscription { ..subscription };
    subscription1.user = user1;
    let mut subscription2 = Subscription { ..subscription };
    subscription2.user = user2;
    let mut subscription3 = Subscription { ..subscription };
    subscription3.user = user2;
    let mut subscription4 = Subscription { ..subscription };
    subscription4.user = user1;

    let wanted_result_for_user1 = array![1, 4];
    let wanted_result_for_user2 = array![2, 3];

    // Create subscription
    // start_cheat_caller_address(contract_address, user1);
    // let id1 = dispatcher.create_subscription(subscription1);
    // let id2 = dispatcher.create_subscription(subscription2);
    // let id3 = dispatcher.create_subscription(subscription3);
    // let id4 = dispatcher.create_subscription(subscription4);
    // println!("id1 = {:?}", id1);
    // println!("id2 = {:?}", id2);
    // println!("id3 = {:?}", id3);
    // println!("id4 = {:?}", id4);
    dispatcher.create_subscription(subscription1);
    dispatcher.create_subscription(subscription2);
    dispatcher.create_subscription(subscription3);
    dispatcher.create_subscription(subscription4);

    // let sub1 = dispatcher.get_subscription(1);
    // let sub2 = dispatcher.get_subscription(2);
    // let sub3 = dispatcher.get_subscription(3);
    // let sub4 = dispatcher.get_subscription(4);

    // println!("sub1 = {:?}", sub1);
    // println!("sub2 = {:?}", sub2);
    // println!("sub3 = {:?}", sub3);
    // println!("sub4 = {:?}", sub4);

    let user1_ids = dispatcher.get_subscription_ids(user1);
    // println!("user1_ids = {:?}", user1_ids);

    let user2_ids = dispatcher.get_subscription_ids(user2);
    // println!("user2_ids = {:?}", user2_ids);

    assert(wanted_result_for_user1 == user1_ids, 'wrong ids for user1');
    assert(wanted_result_for_user2 == user2_ids, 'wrong ids for user2');
}

#[test]
fn test_remove_subscription() {
    // First deploy a new contract
    let contract_address = deploy_contract();
    let dispatcher = IStarkloopDispatcher { contract_address };

    let user1 = contract_address_const::<'user1'>();
    let user2 = contract_address_const::<'user2'>();

    let usdc_token_address = contract_address_const::<
        0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8
    >();

    //Starts a subscription on September 21 at 9 a.m.
    start_cheat_block_timestamp(contract_address, 1726909200);
    let current_block_timestamp = get_block_timestamp();
    // This values will be defined by user in the front-end.
    let amount = 5 * GWEI;
    let payment_count = 15_u64;
    let periodicity = 5 * DAY;
    // Computed in the front-end
    let expires_on = current_block_timestamp + payment_count * periodicity;

    // Define a subscription
    let subscription = SubscriptionTrait::new(
        user2, user1, amount, usdc_token_address, periodicity, expires_on, 0_u64, true
    );

    start_cheat_caller_address(contract_address, user2);

    let first_subscription_id = dispatcher.create_subscription(subscription);

    let _ = dispatcher.remove_subscription(first_subscription_id);

    let removed_subscription = dispatcher.get_subscription(first_subscription_id);

    assert(removed_subscription.is_active == false, 'it is still active');
    assert(removed_subscription.amount == 0_u256, 'Wrong amount');
    assert(removed_subscription.periodicity == 0_u64, 'Wrong periodicity');
    assert(removed_subscription.last_payment == 0_u64, 'Wrong last_payment');
}

#[test]
fn test_get_subscriptions() {
    // First deploy a new contract
    let contract_address = deploy_contract();

    let dispatcher = IStarkloopDispatcher { contract_address };

    // Create 3 users
    let user1 = contract_address_const::<'user1'>();
    let user2 = contract_address_const::<'user2'>();

    let eth_token_address = contract_address_const::<
        0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7
    >();

    //Starts a subscription on September 21 at 9 a.m.
    start_cheat_block_timestamp(contract_address, 1726909200);
    let current_block_timestamp = get_block_timestamp();

    // This values will be defined by user in the front-end.
    let amount = 5 * GWEI;
    let payment_count = 15_u64;
    let periodicity = 4 * WEEK;
    // Computed in the front-end
    let expires_on = current_block_timestamp + payment_count * periodicity;

    // Define a subscription
    let subscription = SubscriptionTrait::new(
        user2, user1, amount, eth_token_address, periodicity, expires_on, 0_u64, true
    );

    let mut subscription1 = Subscription { ..subscription };
    subscription1.user = user1;
    let mut subscription2 = Subscription { ..subscription };
    subscription2.user = user2;
    let mut subscription3 = Subscription { ..subscription };
    subscription3.user = user2;
    let mut subscription4 = Subscription { ..subscription };
    subscription4.user = user1;

    let wanted_result_for_user1 = array![
        Subscription { ..subscription1 }, Subscription { ..subscription4 }
    ];
    let wanted_result_for_user2 = array![
        Subscription { ..subscription3 }, Subscription { ..subscription2 }
    ];

    // start_cheat_caller_address(contract_address, user1);
    // Create subscription
    dispatcher.create_subscription(subscription1);
    dispatcher.create_subscription(subscription2);
    dispatcher.create_subscription(subscription3);
    dispatcher.create_subscription(subscription4);

    let subscriptions_for_user1 = dispatcher.get_subscriptions(user1);
    let subscriptions_for_user2 = dispatcher.get_subscriptions(user2);

    // println!("subscriptions_for_user1 = {:?}", subscriptions_for_user1);
    // println!("subscriptions_for_user2 = {:?}", subscriptions_for_user2);

    assert(subscriptions_for_user1 == wanted_result_for_user1, 'wrong subscriptions for user1');
    assert(subscriptions_for_user2 == wanted_result_for_user2, 'wrong subscriptions for user1');
}

#[test]
fn test_make_schedule_payment() {
    // First deploy a new contract
    let contract_address = deploy_contract();

    let dispatcher = IStarkloopDispatcher { contract_address };

    // Create 3 users
    let user1 = contract_address_const::<'user1'>();
    let user2 = contract_address_const::<'user2'>();

    let eth_token_address = contract_address_const::<
        0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7
    >();

    //Starts a subscription on September 21 at 9 a.m.
    start_cheat_block_timestamp(contract_address, 1726909200);
    let current_block_timestamp = get_block_timestamp();

    // This values will be defined by user in the front-end.
    let amount = 5 * GWEI;
    let payment_count = 15_u64;
    let periodicity = 4 * WEEK;
    // Computed in the front-end
    let expires_on = current_block_timestamp + payment_count * periodicity;

    // Define a subscription
    let subscription = SubscriptionTrait::new(
        user2, user1, amount, eth_token_address, periodicity, expires_on, 0_u64, true
    );

    let id = dispatcher.create_subscription(subscription);

    dispatcher.make_schedule_payment(id);

// TBD : Must Deploy the ETH ERC20 contract to be able to test the transfert_from    
// [FAIL] tests::test_contract::test_make_schedule_payment
// Failure data:
// Got an exception while executing a hint: Hint Error: Error at pc=0:9879:
// Got an exception while executing a hint: Requested contract address ContractAddress(PatriciaKey(StarkFelt("0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"))) is not deployed.
}

#[test]
fn test_update_subscription() {
    // First deploy a new contract
    let contract_address = deploy_contract();

    let dispatcher = IStarkloopDispatcher { contract_address };

    // Create 3 users
    let user1 = contract_address_const::<'user1'>();
    let user2 = contract_address_const::<'user2'>();

    let eth_token_address = contract_address_const::<
        0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7
    >();

    //Starts a subscription on September 21 at 9 a.m.
    start_cheat_block_timestamp(contract_address, 1726909200);
    let current_block_timestamp = get_block_timestamp();

    // This values will be defined by user in the front-end.
    let amount = 5 * GWEI;
    let payment_count = 15_u64;
    let periodicity = 4 * WEEK;
    // Computed in the front-end
    let expires_on = current_block_timestamp + payment_count * periodicity;

    // Define a subscription
    let subscription = SubscriptionTrait::new(
        user2, user1, amount, eth_token_address, periodicity, expires_on, 0_u64, true
    );

    let mut subscription1 = Subscription { ..subscription };
    subscription1.last_payment = current_block_timestamp + 1234;
    let mut wanted_subscription = Subscription { ..subscription1 };

    let id = dispatcher.create_subscription(subscription);

    dispatcher.update_subscription(id, subscription1);

    // Get subscription
    let ret_subscription = dispatcher.get_subscription(id);

    assert(ret_subscription == wanted_subscription, 'subscription not updated')
}
