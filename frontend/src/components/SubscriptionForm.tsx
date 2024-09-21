import { STRK_LOOP_ABI } from "../abis/strk-loop-abi";
import { FC, useMemo, useState, useEffect } from 'react';
import { type Abi } from "starknet";
import { useAccount, useContract, useSendTransaction, useTransactionReceipt } from '@starknet-react/core';

const SubscriptionForm: React.FC = () => {
    const { address } = useAccount();

    const contract_address = '0x00dd86c48fcae7c016fff8ce52b348da44c5a60ed9d7023d145f0e498bf93b01';
    const typedABI = STRK_LOOP_ABI as Abi;

    const { contract } = useContract({
        abi: typedABI,
        address: contract_address,
    });

    useEffect(() => {
        if (address) {
            setSubscription((prevSubscription) => ({
                ...prevSubscription,
                user: address, // Set the user field to the current address
            }));
        }
    }, [address]);

    let [subscription, setSubscription] = useState({
        user: '',
        recipient: '',
        amount: {
            low: 0,
            high: 0,
        },
        token_address: '',
        periodicity: 0,
        last_payment: 0,
        is_active: true,
    });

    const calls = useMemo(() => {
        // return [];
        if (
            !address || 
            !contract || 
            !subscription.recipient || 
            !subscription.amount.low || 
            !subscription.token_address || 
            !subscription.periodicity || 
            subscription.periodicity <= 0 ||
            !subscription.user
        ) { 
            return []; 
        }

        return [contract.populate("create_subscription", [subscription])];
    }, [contract, address, subscription]);

    const { send: writeAsync, data: writeData, isPending: writeIsPending } = useSendTransaction({
        calls,
    });

    const {
        data: waitData,
        status: waitStatus,
        isLoading: waitIsLoading,
        isError: waitIsError,
    } = useTransactionReceipt({ hash: writeData?.transaction_hash, watch: true });

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
            return <LoadingState message="Sending..." />;
        }

        if (waitIsLoading) {
            return <LoadingState message="Waiting for confirmation..." />;
        }

        if (waitStatus === "error") {
            return <LoadingState message="Transaction rejected" />;
        }

        if (waitStatus === "success") {
            return "Transaction confirmed";
        }

        return "Send";
    };

    // Token options for the dropdown
    const tokenOptions = [
        { label: 'STRK', value: '0xCa14007Eff0dB1f8135f4C25B34De49AB0d42766' },
        { label: 'USDC', value: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' },
        { label: 'DAI', value: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357' },
    ];

    if (!address) {
        return null;
    }

    return (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg border border-gray-300 shadow-sm max-w-md mx-auto">
            <h3 className="text-xl font-medium text-gray-800 mb-4">Create Subscription</h3>

            <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-2">Recipient</label>
            <input
                type="text"
                id="recipient"
                value={subscription.recipient}
                onChange={(e) => setSubscription({ ...subscription, recipient: e.target.value })}
                className="block w-full px-3 py-2 text-sm text-gray-800 leading-6 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-300 focus:outline-none"
            />

            <label htmlFor="amount-low" className="block text-sm font-medium text-gray-700 mb-2 mt-4">Amount</label>
            <input
                type="number"
                id="amount-low"
                value={subscription.amount.low}
                onChange={(e) => setSubscription({
                    ...subscription,
                    amount: { ...subscription.amount, low: parseInt(e.target.value, 10) || 0 }
                })}
                className="block w-full px-3 py-2 text-sm text-gray-800 leading-6 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-300 focus:outline-none"
            />

            <label htmlFor="token_address" className="block text-sm font-medium text-gray-700 mb-2 mt-4">Token</label>
            <select
                id="token_address"
                value={subscription.token_address}
                onChange={(e) => setSubscription({ ...subscription, token_address: e.target.value })}
                className="block w-full px-3 py-2 text-sm text-gray-800 leading-6 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-300 focus:outline-none"
            >
                {tokenOptions.map((token) => (
                    <option key={token.value} value={token.value}>
                        {token.label}
                    </option>
                ))}
            </select>

            <label htmlFor="periodicity" className="block text-sm font-medium text-gray-700 mb-2 mt-4">Periodicity (in seconds)</label>
            <input
                type="number"
                id="periodicity"
                value={subscription.periodicity}
                onChange={(e) => setSubscription({ ...subscription, periodicity: parseInt(e.target.value, 10) || 0 })}
                className="block w-full px-3 py-2 text-sm text-gray-800 leading-6 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-300 focus:outline-none"
            />

            <button
                type="submit"
                className="mt-4 w-full border border-gray-300 text-gray-800 font-medium py-2 px-4 bg-yellow-300 rounded-md hover:bg-yellow-400 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                disabled={!address || writeIsPending}
            >
                {buttonContent()}
            </button>

            {writeData?.transaction_hash && (
                <a
                    href={`https://sepolia.voyager.online/tx/${writeData?.transaction_hash}`}
                    target="_blank"
                    className="block mt-4 text-blue-500 hover:text-blue-700 underline"
                    rel="noreferrer"
                >
                    Check TX on Sepolia
                </a>
            )}
        </form>
    );
};

export default SubscriptionForm;
