import { cairo } from 'starknet';
import { useSendTransaction } from '@starknet-react/core';

interface CancelButtonProps {
  subId: bigint; // The subscription ID to cancel
  contract: any; // The contract object
  onSuccess: () => void; // Function to trigger after a successful transaction
}

const CancelButton: React.FC<CancelButtonProps> = ({ subId, contract, onSuccess }) => {
    const calls = [contract.populate("remove_subscription", [cairo.uint256(subId)])];
  const { sendAsync: writeAsync, data: writeData, isPending: writeIsPending } = useSendTransaction({calls : calls});

  // Function to remove the subscription
  const handleCancel = async () => {
    try {

      await writeAsync();
      console.log('Transaction sent successfully');

      // Trigger the onSuccess callback to refresh the list after cancellation
      onSuccess();
    } catch (error) {
      console.error('Error removing subscription:', error);
    }
  };

  return (
    <button
      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700 transition-all"
      onClick={handleCancel}
      disabled={writeIsPending}
    >
      {writeIsPending ? 'Cancelling...' : 'Cancel Subscription'}
    </button>
  );
};

export default CancelButton;
