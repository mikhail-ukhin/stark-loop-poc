'use client';
import { FC } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navigation';

const WalletBar = dynamic(() => import('../components/WalletBar'), { ssr: false });
const SubscriptionForm = dynamic(() => import('../components/SubscriptionForm'), { ssr: false })
const SubscriptionList = dynamic(() => import('../components/SubscriptionList'), { ssr: false })

const Page: FC = () => {

  return (
    <div className="min-h-screen bg-white p-4 flex flex-col justify-center items-center">

      <div className="flex flex-wrap justify-center gap-4 w-full max-w-6xl">
        <div className="w-full flex-grow">
          <SubscriptionList />
        </div>
      </div>
    </div>

  );
};

export default Page;
