import { FC, useMemo, useState, useEffect } from 'react';
import { useAccount, useContract, useSendTransaction, useTransactionReceipt } from '@starknet-react/core';
import { STRK_LOOP_ABI } from "../abis/strk-loop-abi";
import { type Abi } from "starknet";
import { convertToHexString } from '@/lib/utils';

const SubscriptionForm: FC = () => {
    const { address } = useAccount();
    const contract_address = '0x4187f2497247c92bb8d9b960f0fecb704d173525c3012316e0095a3454acde5';
    const typedABI = STRK_LOOP_ABI as Abi;

    const { contract } = useContract({ abi: typedABI, address: contract_address });

    // Subscription state initialization
    const [subscription, setSubscription] = useState({
        user: '',
        recipient: '',
        amount: { low: 0, high: 0 },
        token_address: '0xCa14007Eff0dB1f8135f4C25B34De49AB0d42766',
        periodicity: 0,
        expires_on: 0,
        last_payment: 0,
        is_active: true,
    });

    // Update subscription user field when address changes
    useEffect(() => {
        if (address) {
            setSubscription((prevSubscription) => ({
                ...prevSubscription,
                user: address,
            }));
        }
    }, [address]);

    // Token options
    const tokenOptions = [
        { label: 'STRK', value: '0xCa14007Eff0dB1f8135f4C25B34De49AB0d42766' },
        { label: 'USDC', value: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' },
        { label: 'DAI', value: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357' },
    ];

    // Handle change for the expires_on input
    const handleExpiresOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedDateTime = e.target.value;
        const utcSeconds = Math.floor(new Date(selectedDateTime).getTime() / 1000);

        setSubscription((prevSubscription) => ({
            ...prevSubscription,
            expires_on: utcSeconds,
        }));
    };

    // Prepare contract calls only when all fields are valid
    const calls = useMemo(() => {
        const { recipient, amount, token_address, periodicity, user } = subscription;
        if (!address || !contract || !recipient || !amount.low || !token_address || !periodicity || periodicity <= 0 || !user) {
            return [];
        }
        return [contract.populate("create_subscription", [subscription])];
    }, [contract, address, subscription]);

    // Prepare contract calls only when all fields are valid
    const callsApproval = useMemo(() => {
        const { recipient, amount, token_address, periodicity, user } = subscription;
        if (!address || !contract || !recipient || !amount.low || !token_address || !periodicity || periodicity <= 0 || !user) {
            return [];
        }
        return [contract.populate("approve", [token_address, amount.low * 5])];
    }, [contract, address, subscription]);

    const { send: writeApprovalAsync, data: writeApprovalData, isPending: writeApprovalIsPending } = useSendTransaction({ calls: callsApproval });

    const { status: waitApprovalStatus, isLoading: waitApprovalIsLoading, isError: waitApprovalIsError } = useTransactionReceipt({ hash: writeApprovalData?.transaction_hash, watch: true });

    // Send transaction
    const { send: writeAsync, data: writeData, isPending: writeIsPending } = useSendTransaction({ calls });

    // Transaction receipt
    const { status: waitStatus, isLoading: waitIsLoading, isError: waitIsError } = useTransactionReceipt({ hash: writeData?.transaction_hash, watch: true });

    // Form submission handler
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        writeAsync();
    };

    // Render status messages based on transaction state
    const renderButtonContent = () => {
        if (writeIsPending) return <LoadingState message="Sending..." />;
        if (waitIsLoading) return <LoadingState message="Waiting for confirmation..." />;
        if (waitIsError) return <LoadingState message="Transaction rejected..." />;
        if (waitStatus === "success") return "Transaction confirmed";
        return "Send";
    };

    // Loading spinner component
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

    // Render form inputs
    const renderInput = (id: string, label: string, value: any, onChange: any, type: string = "text") => (
        <>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                className="block w-full px-3 py-2 text-sm text-gray-800 leading-6 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-300 focus:outline-none"
            />
        </>
    );

    if (!address) return null;

    return (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg border border-gray-300 shadow-sm max-w-md mx-auto">
            <h3 className="text-xl font-medium text-gray-800 mb-4">Create Subscription</h3>

            {/* Form Fields */}
            {renderInput("recipient", "Recipient", subscription.recipient, (e: any) => setSubscription({ ...subscription, recipient: e.target.value }))}
            {renderInput("amount-low", "Amount (Low)", subscription.amount.low, (e: any) => setSubscription({ ...subscription, amount: { ...subscription.amount, low: parseInt(e.target.value, 10) || 0 } }), "number")}

            {/* Token Selection */}
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

            {renderInput("periodicity", "Periodicity (in seconds)", subscription.periodicity, (e: any) => setSubscription({ ...subscription, periodicity: parseInt(e.target.value, 10) || 0 }), "number")}

            {/* Expires On Field */}
            <label htmlFor="expires_on" className="block text-sm font-medium text-gray-700 mb-2 mt-4">Expires On</label>
            <input
                type="datetime-local"
                id="expires_on"
                className="block w-full px-3 py-2 text-sm text-gray-800 leading-6 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-300 focus:outline-none"
                onChange={handleExpiresOnChange}
            />

            {/* Submit Button */}
            <button
                type="submit"
                className="mt-4 w-full border border-gray-300 text-gray-800 font-medium py-2 px-4 bg-yellow-300 rounded-md hover:bg-yellow-400 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                disabled={!address || writeIsPending}
            >
                {renderButtonContent()}
            </button>

            {/* Transaction Link */}
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
