import SubscriptionForm from '@/components/SubscriptionForm';
import React from 'react';

const CreateSubscription: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4">Create a New Subscription</h1>
      <div className="w-full max-w-sm space-y-4"> {/* Keep form compact */}
        <SubscriptionForm />
      </div>
    </div>
  );
};

export default CreateSubscription;
