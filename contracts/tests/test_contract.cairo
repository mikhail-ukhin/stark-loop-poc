use core::starknet::SyscallResultTrait;
use snforge_std::{declare, test_address, start_cheat_caller_address, ContractClassTrait};
use contracts::starkloop::{Subscription, IStarkloopDispatcher, IStarkloopDispatcherTrait};
use starknet::{ContractAddress, contract_address_const};
use starknet::contract_address::ContractAddressZeroable;

fn deploy_contract() -> ContractAddress {
    let contract = declare("Starkloop").unwrap();

    let owner: ContractAddress = contract_address_const::<'owner'>();
    let mut constructor_calldata = array![owner.into()];

    let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap_syscall();

    contract_address
}

#[test]
fn test_create_subscription() {
    // First deploy a new contract
    let contract_address =  deploy_contract();

    let dispatcher = IStarkloopDispatcher { contract_address };

    let user1 = contract_address_const::<'user1'>();
    let user2 = contract_address_const::<'user2'>();

    // Check if users are different. I miss a print function :-( (that for sure exits)
    assert(user1 != user2, 'user1 != user2 fails');

    // FIXME : To be replaced by something like a constant that is surely defined somewhere
    // let eth = something::ETH;
    let eth_token_address = contract_address_const::<'fakeETH'>(); // Fake address for the ETH token
    // let usdc_token_address = contract_address_const::<'fakeUSDC'>(); // Fake address for the USDC token

    let subscription = Subscription {
        user: user1,
        recipient: user2,
        amount: 150_u256,
        token_address: eth_token_address,
        periodicity: 123_u64,
        last_payment: 0_u64,
        is_active: true
    };
    let first_subscription_id = dispatcher.create_subscription(subscription);
    assert(first_subscription_id == 1, 'First Id must be 1');

    let second_subscription_id = dispatcher
        .create_subscription(
            Subscription {
                user: user1,
                recipient: user2,
                amount: 150_u256,
                token_address: eth_token_address,
                periodicity: 453_u64,
                last_payment: 0_u64,
                is_active: true
            }
        );
    assert(second_subscription_id == 2, 'Second Id must be 2');
}

#[test]
fn test_get_subscription() {
    // First deploy a new contract
    let contract_address =  deploy_contract();

    let dispatcher = IStarkloopDispatcher { contract_address };

    // Create 3 users
    let user1 = contract_address_const::<'user1'>();
    let user2 = contract_address_const::<'user2'>();
    let user3 = contract_address_const::<'user3'>();

    let eth_token_address = contract_address_const::<'fakeETH'>(); // Fake address for the ETH token
    let usdc_token_address = contract_address_const::<'fakeUSDC'>(); // Fake address for the USDC token

    // Define a subscription
    let subscription1 = Subscription {
        user: user1,
        recipient: user3,
        amount: 150_u256,
        token_address: eth_token_address,
        periodicity: 1000_u64,
        last_payment: 0_u64,
        is_active: true
    };

    println!("user1 = {:?}", user1);
    // To be able to print a struct, it must derive the Drop trait.
    println!("subscription1 = {:?}", subscription1);

    // Create subscription
    start_cheat_caller_address(contract_address, user1);
    let first_subscription_id = dispatcher.create_subscription(subscription1);
    println!("first_subscription_id = {}", first_subscription_id);

    // Get subscription
    let first_subscription = dispatcher.get_subscription(first_subscription_id);
    println!("first_subscription = {:?}", first_subscription);

    // It should return the right values
    assert(first_subscription.user == user1, 'Wrong User');
    assert(first_subscription.recipient == user3, 'Wrong recipient');
    assert(first_subscription.amount == 150_u256, 'Wrong amount');
    assert(first_subscription.token_address == eth_token_address, 'Wrong token');

    // Define a subscription
    let subscription2 = Subscription {
        user: user2,
        recipient: user1,
        amount: 230_u256,
        token_address: usdc_token_address,
        periodicity: 2456_u64,
        last_payment: 0_u64,
        is_active: true
    };

    // Create subscription
    start_cheat_caller_address(contract_address, user2);
    let second_subscription_id = dispatcher.create_subscription(subscription2);

    // Get subscription
    let second_subscription = dispatcher.get_subscription(second_subscription_id);

    // It should return the right values
    assert(second_subscription.user == user2, 'Wrong User');
    assert(second_subscription.recipient == user1, 'Wrong recipient');
    assert(second_subscription.amount == 230_u256, 'Wrong amount');
    assert(second_subscription.token_address == usdc_token_address, 'Wrong token');
}

#[test]
fn test_undefined_subscription() {
    let contract_address =  deploy_contract();
    let dispatcher = IStarkloopDispatcher { contract_address };

    let empty_subscription = Subscription {
        user: ContractAddressZeroable::zero(),
        recipient: ContractAddressZeroable::zero(),
        amount: 0_u256,
        token_address: ContractAddressZeroable::zero(),
        periodicity: 0_u64,
        last_payment: 0_u64,
        is_active: false
    };
    let undefined_subscription = dispatcher.get_subscription(8_u256);
    assert(undefined_subscription == empty_subscription, 'transaction should not exist')
}

#[test]
fn test_remove_subscription() {
    // First deploy a new contract
    let contract_address =  deploy_contract();

    let dispatcher = IStarkloopDispatcher { contract_address };

    let user1 = contract_address_const::<'user1'>();
    let user2 = contract_address_const::<'user2'>();

    let eth_token_address = contract_address_const::<'fakeETH'>(); // Fake address for the ETH token

    let subscription1 = Subscription {
        user: user1,
        recipient: user2,
        amount: 150_u256,
        token_address: eth_token_address,
        periodicity: 1000_u64,
        last_payment: 0_u64,
        is_active: true
    };

    start_cheat_caller_address(contract_address, user1);

    let first_subscription_id = dispatcher.create_subscription(subscription1);

    println!("{0}", first_subscription_id);

    let _ = dispatcher.remove_subscription(first_subscription_id);

    let removed_subscription = dispatcher.get_subscription(first_subscription_id);

    assert(removed_subscription.is_active == false, 'it is still active');
    assert(removed_subscription.amount == 0_u256, 'Wrong amount');
    assert(removed_subscription.periodicity == 0_u64, 'Wrong periodicity');
    assert(removed_subscription.last_payment == 0_u64, 'Wrong last_payment');
}

#[test]
fn test_get_subscriptions() {
    let contract_address =  deploy_contract();

    let dispatcher = IStarkloopDispatcher { contract_address };

    let user1 = contract_address_const::<'user1'>();
    let user2 = contract_address_const::<'user2'>();

    let eth_token_address = contract_address_const::<'fakeETH'>(); // Fake address for the ETH token

    let subscription1 = Subscription {
        user: user1,
        recipient: user2,
        amount: 150_u256,
        token_address: eth_token_address,
        periodicity: 1000_u64,
        last_payment: 0_u64,
        is_active: true
    };

    start_cheat_caller_address(contract_address, user1);

    let first_subscription_id = dispatcher.create_subscription(subscription1);

    let subscriptions = dispatcher.get_subscriptions(user1);

    assert(subscriptions.is_empty() == false, 'subscription not found')
}
