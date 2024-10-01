'use client';

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
          className="border border-transparent text-white font-medium py-2 px-4 bg-orange-500 rounded-md hover:bg-orange-600 shadow-sm transition-all"
        >
          Connect Wallet
        </button>
      ) : (
        <button
          onClick={() => disconnect()}
          className="border border-transparent text-white font-medium py-2 px-4 bg-gray-700 rounded-md hover:bg-gray-600 shadow-sm transition-all"
        >
          {`${address.slice(0, 6)}...${address.slice(-4)}`} (Disconnect)
        </button>
      )}
    </div>
  );
};

export default WalletBar;
