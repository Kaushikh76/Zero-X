// app/chat/page.tsx
'use client';

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { baseSepolia } from 'viem/chains';
import ChatPage from './chat-page';
import TransactionPaywall from '../../components/transaction-paywall/transaction-paywall';

export default function Page() {
  return (
    <OnchainKitProvider 
      apiKey={process.env.NEXT_PUBLIC_ONCHAIN_KIT_API_KEY}
      chain={baseSepolia}
    >
      <TransactionPaywall>
        <ChatPage />
      </TransactionPaywall>
    </OnchainKitProvider>
  );
}