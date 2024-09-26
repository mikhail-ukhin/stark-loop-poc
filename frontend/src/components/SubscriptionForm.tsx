import { FC, useMemo, useState, useEffect } from 'react';
import { useAccount, useContract, useSendTransaction, useTransactionReceipt } from '@starknet-react/core';
import { STRK_LOOP_ABI } from "../abis/strk-loop-abi";
import { STRK_ABI } from "../abis/strk-abi";
import { cairo, type Abi } from "starknet";
import { toBigInt } from "web3-utils";
import { get_contract_by_address, numberToU256 } from '@/lib/utils';

const SubscriptionForm: FC = () => {
    const { address } = useAccount();
    const contract_address = '0x378fe3a3f8bc503f78e91dbbba42efab3e4ffc5ab140d8e316b0fe1f02c2391';
    const erc20_strk_contract_address = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';
    const typedABI = STRK_LOOP_ABI as Abi;
    const erc20ABI = STRK_ABI as Abi;

    const { contract } = useContract({ abi: typedABI, address: contract_address });
    // const { contract } = useContract({ abi : erc20ABI, address: erc20_strk_contract_address})

    const erc20 = get_contract_by_address(erc20_strk_contract_address, erc20ABI);

    // Subscription state initialization
    const [subscription, setSubscription] = useState({
        id: cairo.uint256(0),
        user: '',
        recipient: '',
        amount: 0,
        token_address: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
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
        { label: 'STRK', value: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d' },
        { label: 'USDC', value: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8' },
        { label: 'DAI', value: '0x00da114221cb83fa859dbdb4c44beeaa0bb37c7537ad5ae66fe5e0efd20e6eb3' },
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
        if (!address || !contract || !recipient || !amount || !token_address || !periodicity || periodicity <= 0 || !user) {
            return [];
        }
        return [contract.populate("create_subscription", [subscription])];
    }, [contract, address, subscription]);

    const callsApproval = useMemo(() => {
        const { recipient, amount, token_address, periodicity, user, expires_on} = subscription;
        if (!address || !erc20 || !recipient || !expires_on || !amount || !token_address || !periodicity || periodicity <= 0 || !user) {
            return [];
        }
        const MULTIPLIER = 10000000000000000;

        const currentTime = Math.floor(Date.now() / 1000);
        const totalAmount = Math.ceil(amount * (expires_on - currentTime) / periodicity);   // The total amount of token spend during subscription must be approved

        return [erc20.populate("approve", [contract_address, cairo.uint256(BigInt(totalAmount * MULTIPLIER))])];  // No need to multiply if input is direct
    }, [erc20, address, subscription]);

    const { sendAsync: writeApprovalAsync, data: writeApprovalData, isPending: writeApprovalIsPending } = useSendTransaction({ calls: callsApproval });
    const { status: waitApprovalStatus, isLoading: waitApprovalIsLoading, isError: waitApprovalIsError } = useTransactionReceipt({ hash: writeApprovalData?.transaction_hash, watch: true });

    const { sendAsync: writeAsync, data: writeData, isPending: writeIsPending } = useSendTransaction({ calls });
    const { status: waitStatus, isLoading: waitIsLoading, isError: waitIsError } = useTransactionReceipt({ hash: writeData?.transaction_hash, watch: true });

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        await writeApprovalAsync();
        await writeAsync();
    };

    // Render status messages based on transaction state
    const renderButtonContent = () => {
        if (writeIsPending) return <LoadingState message="Sending..." />;
        if (waitIsLoading) return <LoadingState message="Waiting for confirmation..." />;
        if (waitIsError) return <LoadingState message="Transaction rejected..." />;
        if (waitStatus === "success") return "Transaction confirmed";
        return "Send";
    };

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

            {renderInput("recipient", "Recipient", subscription.recipient, (e: any) => setSubscription({ ...subscription, recipient: e.target.value }))}
            {renderInput("amount", "Amount", subscription.amount, (e: any) => setSubscription({ ...subscription, amount: parseInt(e.target.value, 10) || 0 }), "number")}

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

            <label htmlFor="expires_on" className="block text-sm font-medium text-gray-700 mb-2 mt-4">Expires On</label>
            <input
                type="datetime-local"
                id="expires_on"
                className="block w-full px-3 py-2 text-sm text-gray-800 leading-6 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-300 focus:outline-none"
                onChange={handleExpiresOnChange}
            />

            <button
                type="submit"
                className="mt-4 w-full border border-gray-300 text-gray-800 font-medium py-2 px-4 bg-yellow-300 rounded-md hover:bg-yellow-400 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                disabled={!address || writeIsPending}
            >
                {renderButtonContent()}
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
