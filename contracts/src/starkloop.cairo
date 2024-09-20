// To compile the contract use :
// npm run build-contracts

// To run the tests use :
// npm run test-contracts

use starknet::ContractAddress;

// Structure to hold subscription details
#[derive(Drop, Debug, Serde, starknet::Store)]
pub struct Subscription {
    user: ContractAddress, // Address of the user that instanciate the Subscription
    recipient: ContractAddress, // Address of the recipient who will receive the token
    amount: u256, // Amount of tokens to be transfert to the recipient 
    token_address: ContractAddress, // Address of the ERC-20 token contract 
    periodicity: u64, // Periodicity of payments in seconds 
    last_payment: u64, // Timestamp of the next payment 
    is_active: bool, // The subscription is active
}

#[starknet::interface]
pub trait IStarkloop<TContractState> {
    fn create_subscription(ref self: TContractState, subscription: Subscription) -> u256;
    fn get_subscription(self: @TContractState, subscription_id: u256) -> Subscription;
    fn remove_subscription(ref self: TContractState, subscription_id: u256) -> u256;
    fn approve(self: @TContractState, erc20_contract: ContractAddress, amount: u256);
    fn make_schedule_payment(ref self: TContractState, subscription_id: u256);
    fn update_subscription(ref self: TContractState, subscription_id: u256, subscription: Subscription);
    fn check_due_payments(ref self: TContractState);
}

#[starknet::contract]
pub mod Starkloop {
    use starknet::{ContractAddress, get_contract_address, get_block_timestamp};
    use starknet::storage::{
        MutableVecTrait, StoragePointerReadAccess, StoragePointerWriteAccess, StoragePathEntry, Map,
        Vec
    };
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        users: Map::<
            ContractAddress, Vec<u256>
        >, // Map the address of each user to their subscription id list
        subscriptions: Map<u256, super::Subscription>, // Map subscription id to Subscription
        next_subscription_id: u256,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        SubscriptionCreated: SubscriptionCreated,
        DuePayment: DuePayment,
        #[flat]
        OwnableEvent: OwnableComponent::Event
    }

    #[derive(Drop, starknet::Event)]
    struct SubscriptionCreated {
        id: u256, // id of the subscription
        subscription: super::Subscription,
    }

    #[derive(Drop, starknet::Event)]
    struct DuePayment {
        id: u256,
        time: u64
    }

    #[constructor]
    fn constructor(ref self: ContractState, initial_owner: ContractAddress) {
        self.ownable.initializer(initial_owner);
    }

    fn convert_u64_to_u256(value: u64) -> u256 {
        u256 { low: value.into(), high: 0 }
    }

    #[abi(embed_v0)]
    impl StarkloopImpl of super::IStarkloop<ContractState> {

        fn remove_subscription(ref self: ContractState, subscription_id: u256) -> u256 {
            assert!(subscription_id >= 0, "Invalid subscription Id");

            let mut subscription = self.subscriptions.entry(subscription_id).read();

            let disabled_subscription = super::Subscription {
                user: subscription.user,
                recipient: subscription.recipient,
                amount: 0,
                token_address: subscription.token_address,
                periodicity: 0,
                last_payment: 0,
                is_active: false
            };

            self.subscriptions.entry(subscription_id).write(disabled_subscription);

            subscription_id
        }

        fn create_subscription(ref self: ContractState, subscription: super::Subscription) -> u256 {
            // Increase the subscription id
            let next_subscription_id = self.next_subscription_id.read() + 1;
            self.next_subscription_id.write(next_subscription_id);

            // Create a copy of the subscription before writing it to storage
            // It's to avoid "Variable was previously moved."
            let subscription_copy = super::Subscription {
                user: subscription.user,
                recipient: subscription.recipient,
                amount: subscription.amount,
                token_address: subscription.token_address,
                periodicity: subscription.periodicity,
                last_payment: subscription.last_payment,
                is_active: subscription.is_active
            };

            // Writing the struct to storage
            self.subscriptions.entry(next_subscription_id).write(subscription);

            // Emit the event
            self
                .emit(
                    SubscriptionCreated {
                        id: next_subscription_id, subscription: subscription_copy,
                    }
                );

            // Return the ID of the newly created subscription
            next_subscription_id
        }

        fn get_subscription(self: @ContractState, subscription_id: u256) -> super::Subscription {
            self.subscriptions.entry(subscription_id).read()
        }

        fn approve(self: @ContractState, erc20_contract: ContractAddress, amount: u256) {
            IERC20Dispatcher { contract_address: erc20_contract }
                .approve(get_contract_address(), amount);
        }

        fn make_schedule_payment(ref self: ContractState, subscription_id: u256) {
            //TBD add onwer check here, only admin or owner can trigger

            let mut subscription = self.subscriptions.entry(subscription_id).read();

            assert(subscription.is_active == true, 'inactive subscription');

            let last_block_ts = get_block_timestamp();

            assert(last_block_ts >= (subscription.last_payment + subscription.periodicity), 'already payed');

            let erc20 = IERC20Dispatcher { contract_address: subscription.token_address };            
            let success = erc20.transfer_from(subscription.user, subscription.recipient, subscription.amount);
            
            assert(success, 'Transfer failed');
            
            subscription.last_payment = last_block_ts;
            
            self.update_subscription(subscription_id, subscription);
        }

        fn update_subscription(ref self: ContractState, subscription_id: u256, subscription: super::Subscription) {
            assert!(subscription_id >= 0, "Invalid subscription Id");

            self.subscriptions.entry(subscription_id).write(subscription);
        }

        fn check_due_payments(ref self: ContractState) {
            let last_block_ts = get_block_timestamp();
            
            let mut subscription_id = 0_u256;
        
            loop {
                if subscription_id >= self.next_subscription_id.read() {
                    break;
                }
        
                let subscription = self.subscriptions.read(subscription_id);
        
                if subscription.is_active && last_block_ts >= (subscription.last_payment + subscription.periodicity) {
                    
                    self.emit(DuePayment { 
                        id: subscription_id,
                        time: last_block_ts
                    });
                }
        
                subscription_id += 1_u256;
            }
        }
    }
}

