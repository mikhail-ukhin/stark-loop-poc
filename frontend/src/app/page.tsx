'use client';
import { FC } from 'react';
import dynamic from 'next/dynamic';
import { useAccount, useBalance } from '@starknet-react/core';
import BalanceBar from '@/components/BalanceBar';
import SubscriptionForm from '@/components/SubscriptionForm';

const WalletBar = dynamic(() => import('../components/WalletBar'), { ssr: false });

const Page: FC = () => {

  return (
    <div className="min-h-screen bg-white p-4 flex flex-col justify-center items-center">
      <h1 className="text-2xl font-medium text-gray-800 mb-4">STRK Loop</h1>

      <div className="flex flex-wrap justify-center gap-4 w-full max-w-4xl">
        <div className="w-full max-w-md space-y-4">

          <div className="bg-gray-50 p-4 border-gray-300 border rounded-md shadow-sm">
            <h2 className="text-lg font-medium text-gray-700 mb-2">Wallet Connection</h2>
            <WalletBar />

            
          </div>      

          <SubscriptionForm />    
        
        </div>
      </div>
    </div>
  );
};

export default Page;
