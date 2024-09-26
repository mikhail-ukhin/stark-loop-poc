import { useAccount, Abi, useReadContract } from '@starknet-react/core';
import { STRK_LOOP_ABI } from "../abis/strk-loop-abi";
import { convertToHexString, formatRecipient, convertBigIntToNumber, mapTokenAddressToLabel  } from '@/lib/utils';

const SubscriptionList: React.FC = () => {
  const { address } = useAccount();
  const contract_address = '0x2c9f66769b4cc192b7ec87fd4e61ce93d54cf4948e7bbad52d30efa0c369b85';
  const typedABI = STRK_LOOP_ABI as Abi;

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

  console.log(readData);

  if (!address) return null;

  return (
    <div className="p-6 bg-gray-100 border border-gray-300 shadow-md rounded-lg overflow-x-auto">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Subscription List</h3>

      {readIsLoading ? (
        <p className="text-gray-600">Loading subscriptions...</p>
      ) : readIsError ? (
        <p className="text-red-500">Error: {readError?.message || "Failed to load subscriptions."}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">Id</th>
                <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">Recipient</th>
                <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">Amount</th>
                <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">Token</th>
                <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">Expires On</th>
                <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {readData && readData.length > 0 ? (
                readData.map((subscription: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-100">
                    <td className="border border-gray-300 px-4 py-2 text-gray-700">
                      {subscription.id}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-gray-700">
                      {formatRecipient(subscription.recipient)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-gray-700">
                      {convertBigIntToNumber(subscription.amount)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-gray-700">
                      {mapTokenAddressToLabel(subscription.token_address)} {/* Display token label */}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-gray-700">
                      {new Date(Number(subscription.expires_on) * 1000).toLocaleDateString()}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-gray-700">
                      {subscription.is_active ? "Active" : "Inactive"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center border border-gray-300 px-4 py-2 text-gray-700">
                    No subscriptions found
                  </td>
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
