import { useConnect, useDisconnect, useAccount, useBalance } from '@starknet-react/core';

const WalletBar: React.FC = () => {
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { address } = useAccount();
  
  const { isLoading: balanceIsLoading, isError: balanceIsError, data: balanceData } = useBalance({
    address: address,
    watch: true,
  });

  return (
    <div className="flex flex-col items-center space-y-4">
      {!address ? (
        <div className="flex flex-wrap justify-center gap-2">
          {connectors.map((connector) => (
            <button
              key={connector.id}
              onClick={() => connect({ connector })}
              className="border border-gray-300 text-gray-700 font-medium py-2 px-4 bg-gray-50 rounded-md hover:bg-gray-100 shadow-sm transition-all"
            >
              Connect {connector.id}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-2">
          <div className="text-sm bg-gray-100 px-4 py-2 text-gray-700 rounded-md border border-gray-300 shadow-sm">
            Connected: {address.slice(0, 6)}...{address.slice(-4)}
          </div>
          
          {/* Display Balance when Wallet is Connected and Balance Data is Available */}
          {!balanceIsLoading && !balanceIsError && balanceData && (
            <div className="text-sm text-gray-700">
              <p className="text-gray-600">Symbol: {balanceData?.symbol}</p>
              <p className="text-gray-600">Balance: {Number(balanceData?.formatted).toFixed(4)}</p>
            </div>
          )}

          <button
            onClick={() => disconnect()}
            className="border border-gray-300 text-gray-700 font-medium py-2 px-4 bg-gray-50 rounded-md hover:bg-gray-100 shadow-sm transition-all"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletBar;
