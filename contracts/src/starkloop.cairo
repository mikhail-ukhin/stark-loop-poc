
// To compile the contract use :
// npm run build-contracts

use starknet::ContractAddress;

#[starknet::interface]
pub trait IStarkloop<TContractState> {
    fn create_subscription(ref self: TContractState, recipient: ContractAddress, amount: u256, token_address: ContractAddress, periodicity: u256) -> u256;
}

// Structure to hold subscription details 
#[derive(Drop, Serde, starknet::Store)]
pub struct Subscription
{ 
    user: ContractAddress,                  // Address of the user that instanciate the Subscription
    recipient: ContractAddress,             // Address of the recipient who will receive the token
    amount: u256,                           // Amount of tokens to be transfert to the recipient 
    token_address: ContractAddress,         // Address of the ERC-20 token contract 
    periodicity: u256,                      // Periodicity of payments in seconds 
    next_payment: u256,                     // Timestamp of the next payment 
    is_active: bool,                        // The subscription is active
}

#[starknet::contract]
mod Starkloop {
    use starknet::storage::MutableVecTrait;
use starknet::ContractAddress;
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess, StoragePathEntry, Map, Vec
    };

    #[storage]
    struct Storage {
        users: LegacyMap::<ContractAddress, Vec<u256>>,     // Map the each user to their subscription id list
        subscriptions: Map<u256, super::Subscription>,      // Map subscription id to Subscription
        next_subscription_id: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        SubscriptionCreated: SubscriptionCreated,
    }

    #[derive(Drop, starknet::Event)]
    struct SubscriptionCreated {
        id: u256,                               // id of the subscription
        user: ContractAddress,                  // Address of the user that instanciate the Subscription
        recipient: ContractAddress,             // Address of the recipient who will receive the token
        amount: u256,                           // Amount of tokens to be transfert to the recipient 
        token_address: ContractAddress,         // Address of the ERC-20 token contract 
        periodicity: u256,                      // Periodicity of payments in seconds 
        next_payment: u256,                     // Timestamp of the next payment 
        is_active: bool,                        // The subscription is active
    }
    
    #[constructor]
    fn constructor(ref self: ContractState) {
    }


    #[abi(embed_v0)]
    impl StarkloopImpl of super::IStarkloop<ContractState> {
        fn create_subscription(ref self: ContractState, recipient: ContractAddress, amount: u256, 
                                        token_address: ContractAddress, periodicity: u256) -> u256 {
            // Increase the subscription id
            let next_subscription_id = self.next_subscription_id.read() + 1;
            self.next_subscription_id.write(next_subscription_id);

            let user = starknet::get_caller_address();
            let next_payment = 0; // FIX ME compute the real value

            // let mut previous_id = sub.id;
            let mut is_active = true;
            let subscription = super::Subscription { 
                user: user, 
                recipient: recipient, 
                amount: amount, 
                token_address: token_address,
                periodicity: periodicity, 
                next_payment: next_payment, 
                is_active: is_active };
            
            // Writing the struct to storage
            self.subscriptions.entry(next_subscription_id).write(subscription);
            
            // Append the subscription id in the Vec for the user.
            self.users.entry(user).append().write(next_subscription_id);

            // Emit the event
            self.emit(SubscriptionCreated {
                id: next_subscription_id,
                user: user,
                recipient: recipient, 
                amount: amount, 
                token_address: token_address,
                periodicity: periodicity, 
                next_payment: next_payment, 
                is_active: is_active, 
            });

            // Return the subsription Id
            next_subscription_id
        }
    }

}

