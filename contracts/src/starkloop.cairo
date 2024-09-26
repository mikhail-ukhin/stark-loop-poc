// To compile the contract use :
// npm run build-contracts

// To run the tests use :
// npm run test-contracts

use starknet::ContractAddress;


// Structure to hold subscription details
#[derive(Drop, Debug, PartialEq, Serde, Copy, starknet::Store)]
pub struct Subscription {
    id: u256,
    user: ContractAddress, // Address of the user that instanciate the Subscription
    recipient: ContractAddress, // Address of the recipient who will receive the token
    amount: u256, // Amount of tokens to be transfert to the recipient 
    token_address: ContractAddress, // Address of the ERC-20 token contract 
    periodicity: u64, // Periodicity of payments in seconds 
    expires_on: u64, // Expiration timestamp
    last_payment: u64, // Timestamp of the last payment made 
    is_active: bool, // The subscription is active (user could pause subscription - not implemented at the moment)
}

trait SubscriptionTrait {
    fn new(
        id: u256,
        user: ContractAddress,
        recipient: ContractAddress,
        amount: u256,
        token_address: ContractAddress,
        periodicity: u64,
        expires_on: u64,
        last_payment: u64,
        is_active: bool
    ) -> Subscription;
}

impl SubscriptionImpl of SubscriptionTrait {
    fn new(
        id: u256,
        user: ContractAddress,
        recipient: ContractAddress,
        amount: u256,
        token_address: ContractAddress,
        periodicity: u64,
        expires_on: u64,
        last_payment: u64,
        is_active: bool
    ) -> Subscription {
        Subscription {
            id,
            user,
            recipient,
            amount,
            token_address,
            periodicity,
            expires_on,
            last_payment,
            is_active
        }
    }
}

#[starknet::interface]
pub trait IStarkloop<TContractState> {
    fn create_subscription(ref self: TContractState, subscription: Subscription) -> u256;
    fn get_subscription(self: @TContractState, subscription_id: u256) -> Subscription;
    fn get_subscriptions(self: @TContractState, user: ContractAddress) -> Array<Subscription>;
    fn get_all_subscription_ids(self: @TContractState) -> Array<u256>;
    fn get_all_active_subscription_ids(self: @TContractState) -> Array<u256>;
    fn get_all_subscription_that_must_be_payed_ids(self: @TContractState) -> Array<u256>;
    fn remove_subscription(ref self: TContractState, subscription_id: u256) -> u256;
    fn make_schedule_payment(ref self: TContractState, subscription_id: u256);
    fn update_subscription(
        ref self: TContractState, subscription_id: u256, subscription: Subscription
    );
}

#[starknet::contract]
pub mod Starkloop {
    use starknet::{ContractAddress, get_contract_address, get_block_timestamp, get_caller_address};
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
        // FIXME : users maps is not used. It should be used to get the Subscription list for a
        // user.
        users: Map::<
            ContractAddress, Vec<u256>
        >, // Map the address of each user to their subscription id list
        // Map the address of each user to their subscription id list
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

    #[abi(embed_v0)]
    impl StarkloopImpl of super::IStarkloop<ContractState> {
        fn get_all_subscription_that_must_be_payed_ids(self: @ContractState) -> Array<u256> {
            let mut result: Array<u256> = ArrayTrait::new();
            let last_block_ts = get_block_timestamp();

            let mut id_index = 1;
            let last_id_index = self.next_subscription_id.read();
            loop {
                if id_index > last_id_index {
                    break;
                }
                let subscription = self.subscriptions.entry(id_index).read();

                if subscription.is_active
                    && last_block_ts >= (subscription.last_payment + subscription.periodicity) {
                    result.append(id_index);
                }
                id_index = id_index + 1;
            };

            result
        }

        fn get_all_active_subscription_ids(self: @ContractState) -> Array<u256> {
            self.ownable.assert_only_owner();

            let mut result: Array<u256> = ArrayTrait::new();

            let mut id_index = 1;
            let last_id_index = self.next_subscription_id.read();
            loop {
                if id_index > last_id_index {
                    break;
                }
                let subscription = self.subscriptions.entry(id_index).read();
                if (subscription.is_active) {
                    result.append(id_index);
                }
                id_index = id_index + 1;
            };

            result
        }

        fn get_all_subscription_ids(self: @ContractState) -> Array<u256> {
            self.ownable.assert_only_owner();

            let mut result: Array<u256> = ArrayTrait::new();

            let mut id_index = 1;
            let last_id_index = self.next_subscription_id.read();
            loop {
                if id_index > last_id_index {
                    break;
                }
                result.append(id_index);
                id_index = id_index + 1;
            };

            result
        }

        fn get_subscriptions(
            self: @ContractState, user: ContractAddress
        ) -> Array<super::Subscription> {
            let owner = self.ownable.owner();
            let caller = get_caller_address();

            assert!(caller == owner || caller == user, "only user or owner are allowed");

            let mut subscription_id = 1_u256;
            let mut arr = ArrayTrait::<super::Subscription>::new();

            loop {
                if subscription_id > self.next_subscription_id.read() {
                    break;
                }

                let subscription = self.subscriptions.entry(subscription_id).read();

                if subscription.is_active && subscription.user == user {
                    arr.append(subscription);
                }

                subscription_id += 1_u256;
            };

            arr
        }

        fn remove_subscription(ref self: ContractState, subscription_id: u256) -> u256 {
            assert!(subscription_id > 0, "Invalid subscription Id");

            let mut subscription = self.subscriptions.entry(subscription_id).read();

            let owner = self.ownable.owner();
            let caller = get_caller_address();

            assert!(
                caller == owner || caller == subscription.user, "Not allowed to remove subscription"
            );

            let disabled_subscription = super::Subscription {
                id: subscription_id,
                user: subscription.user,
                recipient: subscription.recipient,
                amount: 0,
                token_address: subscription.token_address,
                periodicity: 0,
                expires_on: 0,
                last_payment: 0,
                is_active: false
            };

            self.subscriptions.entry(subscription_id).write(disabled_subscription);

            subscription_id
        }

        fn create_subscription(ref self: ContractState, subscription: super::Subscription) -> u256 {
            self.ownable.assert_only_owner();

            assert!((subscription.user != subscription.recipient), "user and recipient are same");

            // Increase the subscription id
            let next_subscription_id = self.next_subscription_id.read() + 1;
            self.next_subscription_id.write(next_subscription_id);

            // Create a copy of the subscription before writing it to storage
            // It's to avoid "Variable was previously moved."
            let subscription_copy = super::Subscription {
                id: next_subscription_id,
                user: subscription.user,
                recipient: subscription.recipient,
                amount: subscription.amount,
                token_address: subscription.token_address,
                periodicity: subscription.periodicity,
                expires_on: subscription.expires_on,
                last_payment: subscription.last_payment,
                is_active: subscription.is_active
            };

            // // Append the subscription id in the Vec for the user.
            // let user_copy = subscription.user;
            // self.users.entry(user_copy).append().write(next_subscription_id);

            // Write the struct to storage
            self.subscriptions.entry(next_subscription_id).write(subscription_copy);

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
            let subscription = self.subscriptions.entry(subscription_id).read();
            let owner = self.ownable.owner();
            let caller = get_caller_address();

            assert!(
                caller == owner || caller == subscription.user, "only user or owner are allowed"
            );
            subscription
        }

        fn make_schedule_payment(ref self: ContractState, subscription_id: u256) {
            self.ownable.assert_only_owner();

            let mut subscription = self.subscriptions.entry(subscription_id).read();

            assert(subscription.is_active == true, 'inactive subscription');

            let last_block_ts = get_block_timestamp();

            assert(
                last_block_ts >= (subscription.last_payment + subscription.periodicity),
                'already payed'
            );

            let erc20 = IERC20Dispatcher { contract_address: subscription.token_address };

            assert(
                erc20.balance_of(subscription.user) >= subscription.amount, 'Insufficient funds'
            );
            assert(
                erc20.allowance(subscription.user, get_contract_address()) >= subscription.amount,
                'Insufficient allowance'
            );

            let success = erc20
                .transfer_from(subscription.user, subscription.recipient, subscription.amount);

            assert(success, 'Transfer failed');

            subscription.last_payment = last_block_ts;

            self.update_subscription(subscription_id, subscription);
        }

        fn update_subscription(
            ref self: ContractState, subscription_id: u256, subscription: super::Subscription
        ) {
            assert!(subscription_id > 0, "Invalid subscription Id");

            // This will do owner / user of subscription_id ckecking.
            let _ = self.get_subscription(subscription_id);

            self.subscriptions.entry(subscription_id).write(subscription);
        }
    }
}

