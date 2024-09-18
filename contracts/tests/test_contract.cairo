// use core::starknet::SyscallResultTrait;
// use snforge_std::{declare, ContractClassTrait};
// use contracts::{IHelloStarknetDispatcher, IHelloStarknetDispatcherTrait};

// #[test]
// fn test_balance() {
//     let contract = declare("HelloStarknet").unwrap();
//     let (contract_address, _) = contract.deploy(@ArrayTrait::new()).unwrap_syscall();

//     let dispatcher = IHelloStarknetDispatcher { contract_address };

//     let balance = dispatcher.get_balance();
//     assert(balance == 0, 'Balance is wrong');

//     dispatcher.increase_balance(69);

//     let updated_balance = dispatcher.get_balance();
//     assert(updated_balance == 69, 'Balance wasnt updated correctly');
// }

use core::starknet::SyscallResultTrait;
use snforge_std::{declare, test_address, start_cheat_caller_address, ContractClassTrait};
use contracts::starkloop::{Subscription, IStarkloopDispatcher, IStarkloopDispatcherTrait};


// // Structure to hold subscription details 
// #[derive(Drop, Serde, starknet::Store)]
// pub struct Subscription
// { 
//     user: ContractAddress,                  // Address of the user that instanciate the Subscription
//     recipient: ContractAddress,             // Address of the recipient who will receive the token
//     amount: u256,                           // Amount of tokens to be transfert to the recipient 
//     token_address: ContractAddress,         // Address of the ERC-20 token contract 
//     periodicity: u256,                      // Periodicity of payments in seconds 
//     next_payment: u256,                     // Timestamp of the next payment 
//     is_active: bool,                        // The subscription is active
//}

#[test]
fn test_create_subscription() {
    let contract = declare("Starkloop").unwrap();
    let (contract_address, _) = contract.deploy(@ArrayTrait::new()).unwrap_syscall();

    let dispatcher = IStarkloopDispatcher { contract_address };

    let user1 = test_address();
    let user2 = test_address();
    
    // FIXME : use Mock Token ERC-20 
    let eth_token_address = test_address();  // Fictitious address for the ETH token
    let usdc_token_address = test_address(); // Fictitious address for the USDC token
    
    let subscription = Subscription{user: user1, 
                        recipient: user2, 
                        amount: 150_u256, 
                        token_address: eth_token_address, 
                        periodicity: 123_u256, 
                        next_payment :0_u256, 
                        is_active: true};
    let first_subscription_id = dispatcher.create_subscription(subscription);
    assert(first_subscription_id == 1, 'First Id must be 1');

    let second_subscription_id = dispatcher.create_subscription(Subscription{user: user1, recipient: user2, amount: 150_u256, 
        token_address: eth_token_address, periodicity: 453_u256, next_payment :0_u256, is_active: true});
    assert(second_subscription_id == 2, 'Second Id must be 2');
}


#[test]
fn test_get_subscription() {
    let contract = declare("Starkloop").unwrap();
    let (contract_address, _) = contract.deploy(@ArrayTrait::new()).unwrap_syscall();

    let dispatcher = IStarkloopDispatcher { contract_address };

    // Create 3 users
    let user1 = test_address();
    let user2 = test_address();
    let user3 = test_address();

    // FIXME : use Mock Token ERC-20 
    let eth_token_address = test_address();  // Fictitious address for the ETH token
    let usdc_token_address = test_address(); // Fictitious address for the USDC token
    
    let subscription1 = Subscription{user: user1, recipient: user2, amount: 150_u256, token_address: eth_token_address, 
        periodicity: 1000_u256, next_payment :0_u256, is_active: true};
    let subscription2 = Subscription{user: user1, recipient: user2, amount: 230_u256, token_address: eth_token_address, 
        periodicity: 2456_u256, next_payment :0_u256, is_active: true};
    
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
