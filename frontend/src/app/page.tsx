'use client';
import { FC } from 'react';
import dynamic from 'next/dynamic';

const WalletBar = dynamic(() => import('../components/WalletBar'), { ssr: false });
const SubscriptionForm = dynamic(() => import('../components/SubscriptionForm'), { ssr: false})
const SubscriptionList = dynamic(() => import('../components/SubscriptionList'), { ssr: false})

const Page: FC = () => {

  return (
<div className="min-h-screen bg-white p-4 flex flex-col justify-center items-center">
  <h1 className="text-2xl font-medium text-gray-800 mb-4">STRK Loop</h1>

  <div className="flex flex-wrap justify-center gap-4 w-full max-w-6xl"> {/* Flex container with a wider width */}
    
    <div className="w-full max-w-sm space-y-4"> {/* Keep form compact */}
      <WalletBar />
      <SubscriptionForm />
    </div>

    <div className="w-full flex-grow"> {/* Let SubscriptionList take up available space */}
      <SubscriptionList />
    </div>

  </div>
</div>

  );
};

export default Page;
