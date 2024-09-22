import { useConnect, useDisconnect, useAccount } from '@starknet-react/core';

const WalletBar: React.FC = () => {
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { address } = useAccount();

  return (
    <div className="flex justify-center">
      {!address ? (
        <button
          onClick={() => connect({ connector: connectors[0] })}
          className="border border-gray-300 text-gray-700 font-medium py-2 px-4 bg-orange-200 rounded-md hover:bg-orange-300 shadow-sm transition-all"
        >
          Connect
        </button>

      ) : (
        <button
          onClick={() => disconnect()}
          className="border border-gray-300 text-gray-700 font-medium py-2 px-4 bg-yellow-100 rounded-md hover:bg-yellow-150 shadow-sm transition-all"
        >
          {`${address.slice(0, 6)}...${address.slice(-4)}`} (Disconnect)
        </button>
      )}
    </div>
  );
};

export default WalletBar;
