'use client'

import { useState, useEffect } from 'react'

interface PaymentProcessorProps {
  amount: number
  currency: 'USDC' | 'FLOCKA'
  recipientAddress: string
  tokenAddress: string
  walletAddress: string
  orderNumber: string
  onPaymentComplete: (txHash: string) => void
  onPaymentProcessing: () => void
  onPaymentFailed: () => void
}

// Current USD rate of $FLOCKA token
const FLOCKA_USD_RATE = 0.00019856045123770627;
// USDC token address on Ethereum mainnet
const USDC_TOKEN_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

const PaymentProcessor = ({
  amount,
  currency,
  recipientAddress,
  tokenAddress,
  walletAddress,
  orderNumber,
  onPaymentComplete,
  onPaymentProcessing,
  onPaymentFailed
}: PaymentProcessorProps): JSX.Element => {
  const [status, setStatus] = useState<'idle' | 'approving' | 'sending' | 'completed' | 'failed'>('idle')
  const [txHash, setTxHash] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isApproved, setIsApproved] = useState<boolean>(false)
  
  // Calculate the amount of $FLOCKA tokens needed based on current rate
  const calculateFlockaAmount = (): number => {
    // If paying in FLOCKA, convert USD amount to FLOCKA tokens
    if (currency === 'FLOCKA') {
      return amount / FLOCKA_USD_RATE;
    }
    return amount;
  }
  
  // Format the token amount for display
  const formatTokenAmount = (): string => {
    if (currency === 'FLOCKA') {
      const flockaAmount = calculateFlockaAmount();
      return flockaAmount.toLocaleString('en-US', {
        maximumFractionDigits: 2
      });
    } else {
      // For USDC, 1 USDC = $1 USD
      return amount.toLocaleString('en-US', {
        maximumFractionDigits: 2
      });
    }
  }
  
  // Convert amount to wei (6 decimals for USDC and 18 for FLOCKA)
  const getAmountInWei = (): string => {
    if (currency === 'USDC') {
      // 6 decimals for USDC
      const amountInWei = amount * Math.pow(10, 6);
      return '0x' + Math.floor(amountInWei).toString(16);
    } else {
      // 18 decimals for FLOCKA
      const flockaAmount = calculateFlockaAmount();
      const amountInWei = flockaAmount * Math.pow(10, 18);
      return '0x' + Math.floor(amountInWei).toString(16);
    }
  }
  
  // Get the correct token address
  const getTokenAddress = (): string => {
    if (currency === 'USDC') {
      return USDC_TOKEN_ADDRESS;
    } else {
      return tokenAddress;
    }
  }
  
  // Check if token is approved
  useEffect(() => {
    const checkAllowance = async (): Promise<void> => {
      // Both USDC and FLOCKA need approval as they are ERC20 tokens
      if (!walletAddress) {
        return;
      }
      
      const currentTokenAddress = getTokenAddress();
      if (!currentTokenAddress) {
        setError('Token address not found');
        return;
      }
      
      try {
        if (typeof window.ethereum === 'undefined') {
          setError('MetaMask is not installed')
          return
        }

        // Request account access if needed
        await window.ethereum.request({ method: 'eth_requestAccounts' })
        
        // Get the current network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
        console.log('Connected to chain:', chainId)
        
        // ERC20 allowance function signature
        const allowanceData = '0xdd62ed3e' + 
          // Pad sender address
          walletAddress.slice(2).padStart(64, '0') +
          // Pad recipient address
          recipientAddress.slice(2).padStart(64, '0')
        
        // Call allowance function
        const allowanceHex = await window.ethereum.request({
          method: 'eth_call',
          params: [
            {
              to: currentTokenAddress,
              data: allowanceData
            },
            'latest'
          ]
        })
        
        // Convert hex allowance to number
        const allowance = parseInt(allowanceHex, 16)
        const amountInWei = parseInt(getAmountInWei(), 16)
        
        setIsApproved(allowance >= amountInWei)
      } catch (err) {
        console.error('Error checking allowance:', err)
        setError('Failed to check token approval status')
      }
    }
    
    if (walletAddress) {
      checkAllowance()
    }
  }, [walletAddress, tokenAddress, recipientAddress, currency, amount])
  
  const approveToken = async (): Promise<void> => {
    const currentTokenAddress = getTokenAddress();
    if (!walletAddress || !currentTokenAddress) {
      setError('Wallet not connected or token address not found')
      return
    }
    
    try {
      setStatus('approving')
      setError(null)
      
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed')
      }
      
      // Request account access if needed
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      
      // ERC20 approve function signature
      // Function selector for approve(address,uint256)
      const approveSelector = '0x095ea7b3'
      
      // Encode the recipient address (padded to 32 bytes)
      const paddedRecipient = recipientAddress.slice(2).padStart(64, '0')
      
      // Encode the amount (max uint256 value for unlimited approval)
      const maxUint256 = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
      
      // Combine the function selector and encoded parameters
      const approveData = approveSelector + paddedRecipient + maxUint256
      
      // Send the transaction
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: walletAddress,
          to: currentTokenAddress,
          data: approveData
        }]
      })
      
      // Wait for transaction confirmation
      setStatus('idle')
      setIsApproved(true)
      console.log('Approval transaction hash:', txHash)
    } catch (err) {
      console.error('Error approving token:', err)
      setError('Failed to approve token: ' + (err instanceof Error ? err.message : String(err)))
      setStatus('failed')
      onPaymentFailed()
    }
  }
  
  const sendPayment = async (): Promise<void> => {
    if (!walletAddress) {
      setError('Wallet not connected')
      return
    }
    
    try {
      setStatus('sending')
      setError(null)
      onPaymentProcessing()
      
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed')
      }
      
      // Request account access if needed
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      
      let transactionHash;
      const currentTokenAddress = getTokenAddress();
      
      // For both USDC and FLOCKA, we use the ERC20 transfer function
      // Function selector for transfer(address,uint256)
      const transferSelector = '0xa9059cbb'
      
      // Encode the recipient address (padded to 32 bytes)
      const paddedRecipient = recipientAddress.slice(2).padStart(64, '0')
      
      // Encode the amount
      const amountHex = getAmountInWei().slice(2).padStart(64, '0')
      
      // Combine the function selector and encode
