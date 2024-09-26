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


fn OWNER() -> ContractAddress {
    contract_address_const::<'owner'>()
}

fn USER1() -> ContractAddress {
    contract_address_const::<'user1'>()
}

fn USER2() -> ContractAddress {
    contract_address_const::<'user2'>()
}

fn USER3() -> ContractAddress {
    contract_address_const::<'user3'>()
}

fn deploy_contract() -> ContractAddress {
    let contract = declare("Starkloop").unwrap();

    let owner: ContractAddress = OWNER();
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

    let user1 = USER1();
    let user2 = USER2();
    // println!("user1 = {:?}", user2);
    // println!("user1 = {:?}", user2);

    // Check if users are different.
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
        0_u256, user1, user2, amount, eth_token_address, periodicity, expires_on, 0_u64, true
    );
    start_cheat_caller_address(contract_address, OWNER());
    assert(dispatcher.create_subscription(subscription) == 1, 'First Id must be 1');

    // This values will be defined by user in the front-end.
    let amount = 1 * GWEI;
    let payment_count = 15_u64;
    let periodicity = 4 * WEEK;
    // Computed in the front-end
    let expires_on = current_block_timestamp + payment_count * periodicity;

    let subscription = SubscriptionTrait::new(
        0_u256, user2, user1, amount, eth_token_address, periodicity, expires_on, 0_u64, true
    );

    start_cheat_caller_address(contract_address, OWNER());
    assert(dispatcher.create_subscription(subscription) == 2, 'Second Id must be 2');
}

#[test]
fn test_get_subscription() {
    // First deploy a new contract
    let contract_address = deploy_contract();

    let dispatcher = IStarkloopDispatcher { contract_address };

    // Create 2 users
    let user1 = USER1();
    let user2 = USER2();

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
        0_u256, user2, user1, amount, eth_token_address, periodicity, expires_on, 0_u64, true
    );

    // Note to myself : To be able to print a struct, it must have #[derive(Debug)]
    // println!("subscription1 = {:?}", subscription1);

    let new_subscription = Subscription { ..subscription };
    // Create subscription
    start_cheat_caller_address(contract_address, OWNER());
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
// assert(ret_subscription == new_subscription, 'Wrong subscription');
// comment this since original subscription has id 0
}

#[test]
fn test_undefined_subscription() {
    let contract_address = deploy_contract();
    let dispatcher = IStarkloopDispatcher { contract_address };

    let empty_subscription = SubscriptionTrait::new(
        0_u256,
        ContractAddressZeroable::zero(),
        ContractAddressZeroable::zero(),
        0_u256,
        ContractAddressZeroable::zero(),
        0_u64,
        0_u64,
        0_u64,
        false
    );

    start_cheat_caller_address(contract_address, OWNER());
    let undefined_subscription = dispatcher.get_subscription(8_u256);
    assert(undefined_subscription == empty_subscription, 'transaction should not exist')
}

#[test]
fn test_remove_subscription() {
    // First deploy a new contract
    let contract_address = deploy_contract();
    let dispatcher = IStarkloopDispatcher { contract_address };

    let user1 = USER1();
    let user2 = USER2();

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
        0_u256, user2, user1, amount, usdc_token_address, periodicity, expires_on, 0_u64, true
    );

    start_cheat_caller_address(contract_address, OWNER());
    let first_subscription_id = dispatcher.create_subscription(subscription);

    start_cheat_caller_address(contract_address, OWNER());
    let _ = dispatcher.remove_subscription(first_subscription_id);

    let removed_subscription = dispatcher.get_subscription(first_subscription_id);

    assert(removed_subscription.is_active == false, 'it is still active');
    assert(removed_subscription.amount == 0_u256, 'Wrong amount');
    assert(removed_subscription.periodicity == 0_u64, 'Wrong periodicity');
    assert(removed_subscription.last_payment == 0_u64, 'Wrong last_payment');
}

#[test]
fn test_user_can_remove_subscription() {
    // First deploy a new contract
    let contract_address = deploy_contract();
    let dispatcher = IStarkloopDispatcher { contract_address };

    let user1 = USER1();
    let user2 = USER2();

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
    let mut subscription = SubscriptionTrait::new(
        0_u256, user1, user2, amount, usdc_token_address, periodicity, expires_on, 0_u64, true
    );

    start_cheat_caller_address(contract_address, OWNER());
    let first_subscription_id = dispatcher.create_subscription(subscription);

    start_cheat_caller_address(contract_address, user1);
    let _ = dispatcher.remove_subscription(first_subscription_id);

    start_cheat_caller_address(contract_address, OWNER());
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
    let user1 = USER1();
    let user2 = USER2();
    let user3 = USER3();

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
        0_u256, user2, user3, amount, eth_token_address, periodicity, expires_on, 0_u64, true
    );

    let mut subscription1 = Subscription { ..subscription };
    subscription1.id = 1;
    subscription1.user = user1;

    let mut subscription2 = Subscription { ..subscription };
    subscription2.id = 2;
    subscription2.user = user2;

    let mut subscription3 = Subscription { ..subscription };
    subscription3.id = 3;
    subscription3.user = user2;

    let mut subscription4 = Subscription { ..subscription };
    subscription4.id = 4;
    subscription4.user = user1;

    let wanted_result_for_user1 = array![
        Subscription { ..subscription1 }, Subscription { ..subscription4 }
    ];
    let wanted_result_for_user2 = array![
        Subscription { ..subscription2 }, Subscription { ..subscription3 }
    ];

    // start_cheat_caller_address(contract_address, user1);
    // Create subscription
    start_cheat_caller_address(contract_address, OWNER());
    let _s1 = dispatcher.create_subscription(subscription1);
    let _s2 = dispatcher.create_subscription(subscription2);
    let _s3 = dispatcher.create_subscription(subscription3);
    let _s4 = dispatcher.create_subscription(subscription4);

    let subscriptions_for_user1 = dispatcher.get_subscriptions(user1);
    let subscriptions_for_user2 = dispatcher.get_subscriptions(user2);

    // println!("wanted_result_for_user1 = {:?}", wanted_result_for_user1);
    // println!("subscriptions_for_user1 = {:?}", subscriptions_for_user1);
    // println!("wanted_result_for_user2 = {:?}", wanted_result_for_user2);
    // println!("subscriptions_for_user2 = {:?}", subscriptions_for_user2);

    assert(subscriptions_for_user1 == wanted_result_for_user1, 'wrong subscriptions for user1');
    assert(subscriptions_for_user2 == wanted_result_for_user2, 'wrong subscriptions for user2');
}

#[test]
fn test_make_schedule_payment() {
    // First deploy a new contract
    let contract_address = deploy_contract();

    let dispatcher = IStarkloopDispatcher { contract_address };

    // Create 3 users
    let user1 = USER1();
    let user2 = USER2();

    let eth_token_address = contract_address_const::<
        0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7
    >();

    //Starts a subscription on September 21 at 9 a.m.
    start_cheat_block_timestamp(contract_address, 1726909200);
    start_cheat_caller_address(contract_address, user2);

    let current_block_timestamp = get_block_timestamp();

    // This values will be defined by user in the front-end.
    let amount = 5 * GWEI;
    let payment_count = 15_u64;
    let periodicity = 4 * WEEK;
    // Computed in the front-end
    let expires_on = current_block_timestamp + payment_count * periodicity;

    // Define a subscription
    let subscription = SubscriptionTrait::new(
        0_u256, user2, user1, amount, eth_token_address, periodicity, expires_on, 0_u64, true
    );

    start_cheat_caller_address(contract_address, OWNER());
    let id = dispatcher.create_subscription(subscription);

    dispatcher.make_schedule_payment(id);
    // TBD : Must Deploy the ETH ERC20 contract to be able to test the transfert_from
// [FAIL] tests::test_contract::test_make_schedule_payment
// Failure data:
// Got an exception while executing a hint: Hint Error: Error at pc=0:9879:
// Got an exception while executing a hint: Requested contract address
// ContractAddress(PatriciaKey(StarkFelt("0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7")))
// is not deployed.
}

#[test]
fn test_update_subscription() {
    // First deploy a new contract
    let contract_address = deploy_contract();

    let dispatcher = IStarkloopDispatcher { contract_address };

    // Create 2 users
    let user1 = USER1();
    let user2 = USER2();

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
        0_u256, user2, user1, amount, eth_token_address, periodicity, expires_on, 0_u64, true
    );

    let mut subscription1 = Subscription { ..subscription };
    subscription1.last_payment = current_block_timestamp + 1234;
    let mut wanted_subscription = Subscription { ..subscription1 };

    start_cheat_caller_address(contract_address, OWNER());
    let id = dispatcher.create_subscription(subscription);

    dispatcher.update_subscription(id, subscription1);

    // Get subscription
    let ret_subscription = dispatcher.get_subscription(id);

    assert(ret_subscription == wanted_subscription, 'subscription not updated')
}
