use core::starknet::SyscallResultTrait;
use snforge_std::{declare, test_address, start_cheat_caller_address, ContractClassTrait};
use contracts::starkloop::{Subscription, IStarkloopDispatcher, IStarkloopDispatcherTrait};
use starknet::{ContractAddress, contract_address_const};

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

    let user1 = test_address();
    let user2 = test_address();

    // FIXME : use Mock Token ERC-20
    let eth_token_address = test_address(); // Fictitious address for the ETH token
    // let usdc_token_address = test_address(); // Fictitious address for the USDC token

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
    let user1 = test_address();
    let user2 = test_address();
    let user3 = test_address();

    // FIXME : use Mock Token ERC-20
    let eth_token_address = test_address(); // Fictitious address for the ETH token
    let usdc_token_address = test_address(); // Fictitious address for the USDC token

    let subscription1 = Subscription {
        user: user1,
        recipient: user2,
        amount: 150_u256,
        token_address: eth_token_address,
        periodicity: 1000_u64,
        last_payment: 0_u64,
        is_active: true
    };
    let subscription2 = Subscription {
        user: user1,
        recipient: user2,
        amount: 230_u256,
        token_address: eth_token_address,
        periodicity: 2456_u64,
        last_payment: 0_u64,
        is_active: true
    };

    // Create 2 subscriptions
    start_cheat_caller_address(contract_address, user1);
    let first_subscription_id = dispatcher.create_subscription(subscription1);
    start_cheat_caller_address(contract_address, user2);
    let second_subscription_id = dispatcher.create_subscription(subscription2);

    // It should return the right values
    let first_subscription = dispatcher.get_subscription(first_subscription_id);
    assert(first_subscription.user == user1, 'Wrong User');
    assert(first_subscription.recipient == user3, 'Wrong recipient');
    assert(first_subscription.amount == 150_u256, 'Wrong amount');
    assert(first_subscription.token_address == eth_token_address, 'Wrong token');

    // It should return the right values
    let second_subscription = dispatcher.get_subscription(second_subscription_id);
    assert(second_subscription.user == user2, 'Wrong User');
    assert(second_subscription.recipient == user1, 'Wrong recipient');
    assert(second_subscription.amount == 230_u256, 'Wrong amount');
    assert(second_subscription.token_address == usdc_token_address, 'Wrong token');
}

#[test]
fn test_remove_subscription() {
    // First deploy a new contract
    let contract_address =  deploy_contract();

    let dispatcher = IStarkloopDispatcher { contract_address };

    let user1 = test_address();
    let user2 = test_address();

    let eth_token_address = test_address();

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
