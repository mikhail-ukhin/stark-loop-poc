import { useAccount, Abi, useReadContract, useContract } from '@starknet-react/core';
import { STRK_LOOP_ABI } from "../abis/strk-loop-abi";
import { formatRecipient, convertBigIntToNumber, mapTokenAddressToLabel, mapTokenAddressToDecimals, getNextPayment } from '@/lib/utils';
import CancelButton from './cancel-button';

const SubscriptionList: React.FC = () => {
  const { address } = useAccount();
  const contract_address = process.env.NEXT_PUBLIC_CONTRACT_ADDR as `0x${string}` | undefined;
  const typedABI = STRK_LOOP_ABI as Abi;

  const { contract } = useContract({
    abi: typedABI,
    address: contract_address,
  });

  const {
    data: readData,
    refetch: dataRefetch,
    isError: readIsError,
    isLoading: readIsLoading,
    error: readError
  } = useReadContract({
    functionName: "get_subscriptions",
    args: [address],
    abi: typedABI,
    address: contract_address,
    watch: true,
    refetchInterval: 15000
  });


  if (!address) return null;

  return (
    <div className="p-6 bg-gray-100 border border-gray-300 shadow-md rounded-lg overflow-x-auto">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">My Subscriptions</h3>

      {readIsLoading ? (
        <p className="text-gray-600">Loading subscriptions...</p>
      ) : readIsError ? (
        <p className="text-red-500">Error: {readError?.message || "Failed to load subscriptions."}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full bg-white border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">Id</th>
                <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">Recipient</th>
                <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">Amount</th>
                <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">Periodicity</th>
                <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">Next Payment</th>
                <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">Expires On</th>
                <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {readData && readData.length > 0 ? (
                readData.map((subscription: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-100">
                    <td className="border border-gray-300 px-4 py-2 text-gray-700">{convertBigIntToNumber(subscription.id)}</td>
                    <td className="border border-gray-300 px-4 py-2 text-gray-700">{formatRecipient(subscription.recipient)}</td>
                    <td className="border border-gray-300 px-4 py-2 text-gray-700">
                      {Number((Number(subscription.amount) / Math.pow(10, mapTokenAddressToDecimals(subscription.token_address))))} {mapTokenAddressToLabel(subscription.token_address)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-gray-700">
                      {convertBigIntToNumber(subscription.periodicity)} second(s)
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-gray-700">
                      {getNextPayment(subscription.last_payment, subscription.periodicity).toLocaleString()}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-gray-700">
                      {new Date(Number(subscription.expires_on) * 1000).toLocaleString()}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-gray-700">
                      <CancelButton
                        subId={subscription.id}
                        contract={contract}
                        onSuccess={dataRefetch} // Refresh list after successful cancellation
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center border border-gray-300 px-4 py-2 text-gray-700">No subscriptions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SubscriptionList;
