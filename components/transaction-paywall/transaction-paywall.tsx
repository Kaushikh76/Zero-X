import React, { useState, useCallback } from 'react';
import { Box, VStack, Text, Container } from '@chakra-ui/react';
import {
  Transaction,
  TransactionButton,
  TransactionStatus,
  TransactionStatusLabel,
  TransactionStatusAction,
  TransactionToast,
  TransactionToastLabel,
  TransactionToastAction,
  TransactionSponsor,
  type LifecycleStatus
} from '@coinbase/onchainkit/transaction';
import { ConnectWallet } from '@coinbase/onchainkit/wallet';
import { baseSepolia } from 'viem/chains';
import { BackgroundGradient } from '#components/gradients/background-gradient';
import { useAccount } from 'wagmi';

interface TransactionPaywallProps {
  children: React.ReactNode;
}

const TransactionPaywall: React.FC<TransactionPaywallProps> = ({ children }) => {
  const [isVerified, setIsVerified] = useState(false);
  const { address, isConnected } = useAccount();

  // Transaction configuration
  const calls = [{
    to: "0xbb7cA0959C1315ceec70788D45eea390508951Aa" as `0x${string}`,
    value: BigInt(10000000000000000), // 0.01 ETH in wei
    data: "0x" as `0x${string}`
  }];

  const handleStatus = useCallback((status: LifecycleStatus) => {
    console.log('Transaction status:', status);
    if (status.statusName === 'success') {
      setIsVerified(true);
    }
  }, []);

  const handleError = useCallback((error: any) => {
    console.error('Transaction error:', error);
  }, []);

  if (isVerified) {
    return children;
  }

  return (
    <Box position="relative" minH="100vh">
      <BackgroundGradient height="100%" zIndex="-1" />
      <Container maxW="container.md" pt={{ base: 20, lg: 40 }} pb="20">
        <VStack 
          spacing="8" 
          align="center"
          bg="whiteAlpha.100"
          backdropFilter="blur(10px)"
          borderRadius="lg"
          p="6"
          border="1px"
          borderColor="whiteAlpha.200"
        >
          <Text fontSize="2xl" fontWeight="bold">Access Zero-X Chat</Text>
          <Text textAlign="center">
            Complete the transaction to start chatting with Zero-X
          </Text>
          
          {!isConnected ? (
            <ConnectWallet />
          ) : (
            <Transaction
              chainId={baseSepolia.id}
              calls={calls}
              onStatus={handleStatus}
              onError={handleError}
              capabilities={{
                paymasterService: {
                  url: process.env.NEXT_PUBLIC_PAYMASTER_URL,
                },
              }}
            >
              <VStack spacing={4} width="100%">
                <TransactionButton 
                  className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
                />
                <TransactionSponsor />
                <TransactionStatus>
                  <TransactionStatusLabel />
                  <TransactionStatusAction />
                </TransactionStatus>
                <TransactionToast position="bottom-right">
                  <TransactionToastLabel />
                  <TransactionToastAction />
                </TransactionToast>
              </VStack>
            </Transaction>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default TransactionPaywall;