use core::starknet::SyscallResultTrait;
use snforge_std::{declare, ContractClassTrait};
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
