import { STRK_LOOP_ABI } from "../abis/strk-loop-abi";
import { FC, useMemo, useState } from 'react';
import { type Abi } from "starknet";
import { useAccount, useBalance, useBlockNumber, useContract, useReadContract, useSendTransaction, useTransactionReceipt } from '@starknet-react/core';


const SubscriptionForm: React.FC = () => {
    const { address } = useAccount();

    const contract_address = '0x00dd86c48fcae7c016fff8ce52b348da44c5a60ed9d7023d145f0e498bf93b01';

    const typedABI = STRK_LOOP_ABI as Abi;

    const { contract } = useContract({
        abi: typedABI,
        address: contract_address,
    });

    const subscription = {
        user: address, // ContractAddress of the user (hex string)
        recipient: '0x00fd273C8b4fe5dC449dFDc2eb248bf0B602C8577AC8983bF45c8F5F4e69f8d9', // recipient ContractAddress (hex string)
        amount: {
            low: '10',  // u256 represented as { low, high }
            high: '0',  // Since it's a small amount, high is 0
        },
        token_address: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d', // ContractAddress of the token (hex string)
        periodicity: '30', // u64 periodicity (as string, seconds between payments)
        last_payment: '0', // u64 last payment (initially set to 0 for a new subscription)
        is_active: true, // Boolean value (true or false)
    };

    const calls = useMemo(() => {
        if (!address || !contract) return [];

        return [contract.populate(
            "create_subscription",
            [subscription]
        )];
    }, [contract, address, subscription]);

    const {
        send: writeAsync,
        data: writeData,
        isPending: writeIsPending,
    } = useSendTransaction({
        calls,
    });

    const {
        data: waitData,
        status: waitStatus,
        isLoading: waitIsLoading,
        isError: waitIsError,
        error: waitError
    } = useTransactionReceipt({ hash: writeData?.transaction_hash, watch: true })

    const LoadingState = ({ message }: { message: string }) => (
        <div className="flex items-center space-x-2">
            <div className="animate-spin">
                <svg className="h-5 w-5 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            </div>
            <span>{message}</span>
        </div>
    );

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        writeAsync();
    };

    const buttonContent = () => {
        if (writeIsPending) {
            return <LoadingState message="Send..." />;
        }

        if (waitIsLoading) {
            return <LoadingState message="Waiting for confirmation..." />;
        }

        if (waitStatus === "error") {
            return <LoadingState message="Transaction rejected..." />;
        }

        if (waitStatus === "success") {
            return "Transaction confirmed";
        }

        return "Send";
    };

    // Do not render anything if balanceData is not available
    if (!address) {
        return null;
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-4 border-black border">
            <h3 className="text-lg font-bold mb-2">Write to Contract</h3>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount:</label>

            <button
              type="submit"
              className="mt-3 border border-black text-black font-regular py-2 px-4 bg-yellow-300 hover:bg-yellow-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={!address || writeIsPending}
            >
              {buttonContent()}
            </button>
            {writeData?.transaction_hash && (
              <a
                href={`https://sepolia.voyager.online/tx/${writeData?.transaction_hash}`}
                target="_blank"
                className="block mt-2 text-blue-500 hover:text-blue-700 underline"
                rel="noreferrer"
              >
                Check TX on Sepolia
              </a>
            )}
          </form>
    );
};

export default SubscriptionForm;
