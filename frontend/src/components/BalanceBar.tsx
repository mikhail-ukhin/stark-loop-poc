import { useAccount, useBalance, UseBalanceProps } from '@starknet-react/core';

const BalanceBar: React.FC = () => {
  const { address } = useAccount();

  const { isLoading: balanceIsLoading, isError: balanceIsError, data: balanceData } = useBalance({
    address: address,
    watch: true
  });

  if (balanceData) {
    console.log(balanceData)
  }
  

  // Do not render anything if balanceData is not available
  if (!address || !balanceData || balanceIsLoading || balanceIsError) {
    return null;
  }

  return (
    <div className="flex flex-col items-center space-y-1">
      <p className="text-gray-600">Symbol: {balanceData?.symbol}</p>
      <p className="text-gray-600">Balance: {Number(balanceData?.formatted).toFixed(4)}</p>
    </div>
  );
};

export default BalanceBar;
