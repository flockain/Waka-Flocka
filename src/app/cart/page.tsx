'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import WalletConnectButton from '../../components/WalletConnectButton'
import PaymentProcessor from '../../components/PaymentProcessor'
import CoinbaseOnramp from '../../components/CoinbaseOnramp'
import { useCart } from '../../hooks/useCart'
import { WALLET_ADDRESS, FLOCKA_TOKEN_ADDRESS } from '../../types/storeTypes'

export default function CartPage(): JSX.Element {
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    subtotal, 
    discount, 
    total,
    useFlockaCoin,
    setUseFlockaCoin
  } = useCart()
  
  const [checkoutStep, setCheckoutStep] = useState<number>(1)
  const [customerName, setCustomerName] = useState<string>('')
  const [customerEmail, setCustomerEmail] = useState<string>('')
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [telegramUsername, setTelegramUsername] = useState<string>('')
  const [xUsername, setXUsername] = useState<string>('')
  const [discordUsername, setDiscordUsername] = useState<string>('')
  const [orderPlaced, setOrderPlaced] = useState<boolean>(false)
  const [orderNumber, setOrderNumber] = useState<string>('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending')
  const [transactionHash, setTransactionHash] = useState<string>('')
  const [showCoinbaseOnramp, setShowCoinbaseOnramp] = useState<boolean>(false)
  
  const formatPrice = (price: number): string => {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }
  
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!customerName.trim()) {
      errors.name = 'Name is required'
    }
    
    if (!customerEmail.trim()) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(customerEmail)) {
      errors.email = 'Email is invalid'
    }
    
    if (!walletAddress.trim() && !isWalletConnected) {
      errors.wallet = 'Wallet address is required'
    } else if (walletAddress.trim() && !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      errors.wallet = 'Wallet address is invalid'
    }
    
    // At least one social media contact is required
    if (!telegramUsername.trim() && !xUsername.trim() && !discordUsername.trim()) {
      errors.social = 'At least one social media contact is required'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  const handleCheckout = (): void => {
    if (checkoutStep === 1) {
      setCheckoutStep(2)
    } else {
      if (!validateForm()) {
        return
      }
      
      // Generate a random order number
      const randomOrderNumber = `WF-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`
      setOrderNumber(randomOrderNumber)
      setCheckoutStep(3) // Move to payment step
    }
  }
  
  const handlePaymentMethodChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setUseFlockaCoin(e.target.value === 'flocka')
  }
  
  const handleWalletConnect = (address: string): void => {
    setIsWalletConnected(true)
    setWalletAddress(address)
  }
  
  const handlePaymentComplete = (txHash: string): void => {
    setTransactionHash(txHash)
    setPaymentStatus('completed')
    setOrderPlaced(true)
    clearCart()
  }
  
  const handlePaymentProcessing = (): void => {
    setPaymentStatus('processing')
  }
  
  const handlePaymentFailed = (): void => {
    setPaymentStatus('failed')
  }
  
  const handleCoinbaseSuccess = (): void => {
    setShowCoinbaseOnramp(false)
  }
  
  if (orderPlaced) {
    return (
      <div className="min-h-screen flex flex-col bg-white text-black">
        <Header />
        
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto bg-white p-8 border border-gray-200 rounded-lg shadow-md">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="[http://www.w3.org/2000/svg">](http://www.w3.org/2000/svg">)
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
              <p className="text-gray-600">Thank you for your purchase, {customerName}.</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded mb-6">
              <h2 className="text-lg font-semibold mb-2">Order Details</h2>
              <p className="mb-1"><span className="font-medium">Order Number:</span> {orderNumber}</p>
              <p className="mb-1"><span className="font-medium">Total Amount:</span> ${formatPrice(total)}</p>
              <p className="mb-1">
                <span className="font-medium">Payment Method:</span> {useFlockaCoin ? '$FLOCKA Token' : 'USDC'}
              </p>
              <p className="mb-1">
                <span className="font-medium">Transaction Hash:</span> 
                <a 
                  href={`[https://etherscan.io/tx/${transactionHash}`}](https://etherscan.io/tx/${transactionHash}`}) 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {transactionHash}
                </a>
              </p>
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Contact Information</h2>
              <p className="mb-2">
                We'll contact you via your provided information to confirm your order and provide updates.
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="mb-1"><span className="font-medium">Email:</span> {customerEmail}</p>
                {telegramUsername && <p className="mb-1"><span className="font-medium">Telegram:</span> @{telegramUsername}</p>}
                {xUsername && <p className="mb-1"><span className="font-medium">X (Twitter):</span> @{xUsername}</p>}
                {discordUsername && <p className="mb-1"><span className="font-medium">Discord:</span> {discordUsername}</p>}
              </div>
            </div>
            
            <div className="text-center">
              <Link 
                href="/"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
        
        {cartItems.length === 0 ? (
          <div className="bg-white p-8 border border-gray-200 rounded-lg shadow-md text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="[http://www.w3.org/2000/svg">](http://www.w3.org/2000/svg">)
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Looks like you haven't added any items to your cart yet.</p>
            <Link 
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {checkoutStep === 1 ? (
                <>
                  <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden mb-6">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Quantity</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Price</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {cartItems.map((item) => (
                          <tr key={item.product.id}>
                            <td className="px-4 py-4">
                              <div className="flex items-center">
                                <div className="h-16 w-16 flex-shrink-0 bg-gray-200 rounded flex items-center justify-center">
                                  <span className="text-gray-500 text-xs">Image</span>
                                </div>
                                <div className="ml-4">
                                  <h3 className="text-sm font-medium">{item.product.name}</h3>
                                  <p className="text-xs text-gray-500">{item.product.categoryId}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center">
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                  className="px-2 py-1 border border-gray-300 rounded-l"
                                  aria-label="Decrease quantity"
                                >
                                  -
                                </button>
                                <span className="px-3 py-1 border-t border-b border-gray-300">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                  className="px-2 py-1 border border-gray-300 rounded-r"
                                  aria-label="Increase quantity"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <p className="text-sm">${formatPrice(item.product.price)}</p>
                              {useFlockaCoin && (
                                <p className="text-xs text-green-600">
                                  ${formatPrice(item.product.price * 0.9)} with $FLOCKA
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-4 text-right">
                              <p className="text-sm font-medium">
                                ${formatPrice(item.product.price * item.quantity)}
                              </p>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <button
                                onClick={() => removeFromCart(item.product.id)}
                                className="text-red-600 hover:text-red-800"
                                aria-label="Remove item"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="[http://www.w3.org/2000/svg">](http://www.w3.org/2000/svg">)
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="flex justify-between mb-6">
                    <Link 
                      href="/"
                      className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Continue Shopping
                    </Link>
                    <button
                      onClick={clearCart}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50"
                    >
                      Clear Cart
                    </button>
                  </div>
                </>
              ) : checkoutStep === 2 ? (
                <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
                  
                  {formErrors.social && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                      {formErrors.social}
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className={`w-full px-3 py-2 border ${formErrors.name ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        required
                      />
                      {formErrors.name && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className={`w-full px-3 py-2 border ${formErrors.email ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        required
                      />
                      {formErrors.email && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="wallet" className="block text-sm font-medium text-gray-700 mb-1">
                        Your Wallet Address <span className="text-red-500">*</span>
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          id="wallet"
                          value={walletAddress}
                          onChange={(e) => setWalletAddress(e.target.value)}
                          className={`flex-1 px-3 py-2 border ${formErrors.wallet ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          placeholder="0x..."
                          disabled={isWalletConnected}
                          required
                        />
                        <WalletConnectButton 
                          onConnect={handleWalletConnect} 
                          isConnected={isWalletConnected}
                        />
                      </div>
                      {formErrors.wallet && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.wallet}</p>
                      )}
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <h3 className="text-md font-medium mb-3">
                        Social Media Contact <span className="text-red-500">*</span>
                        <span className="text-sm font-normal text-gray-500 ml-2">(At least one required)</span>
                      </h3>
                      
                      <div className="space-y-3">
                        <div>
                          <label htmlFor="telegram" className="block text-sm font-medium text-gray-700 mb-1">
                            Telegram Username
                          </label>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
                              @
                            </span>
                            <input
                              type="text"
                              id="telegram"
                              value={telegramUsername}
                              onChange={(e) => setTelegramUsername(e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="username"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="x" className="block text-sm font-medium text-gray-700 mb-1">
                            X (Twitter) Username
                          </label>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md">
                              @
                            </span>
                            <input
                              type="text"
                              id="x"
                              value={xUsername}
                              onChange={(e) => setXUsername(e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="username"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="discord" className="block text-sm font-medium text-gray-700 mb-1">
                            Discord Username
                          </label>
                          <input
                            type="text"
                            id="discord"
                            value={discordUsername}
                            onChange={(e) => setDiscordUsername(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="username#0000 or username"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <button
                      onClick={() => setCheckoutStep(1)}
                      className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Back to Cart
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4">Complete Payment</h2>
                  
                  <div className="mb-6">
                    <div className="bg-gray-50 p-4 rounded mb-6">
                      <h3 className="font-medium mb-2">Order Summary</h3>
                      <p className="mb-1"><span className="font-medium">Order Number:</span> {orderNumber}</p>
                      <p className="mb-1"><span className="font-medium">Total Amount:</span> ${formatPrice(total)}</p>
                      <p className="mb-1">
                        <span className="font-medium">Payment Method:</span> {useFlockaCoin ? '$FLOCKA Token' : 'USDC'}
                      </p>
                    </div>
                    
                    {showCoinbaseOnramp ? (
                      <CoinbaseOnramp 
                        onSuccess={handleCoinbaseSuccess}
                        currency={useFlockaCoin ? 'FLOCKA' : 'USDC'}
                      />
                    ) : (
                      <div className="mb-4">
                        <button
                          onClick={() => setShowCoinbaseOnramp(true)}
                          className="w-full py-3 px-4 rounded font-medium bg-green-600 text-white hover:bg-green-700 mb-4"
                        >
                          Need {useFlockaCoin ? '$FLOCKA' : 'USDC'}? Buy with Coinbase
                        </button>
                        
                        <PaymentProcessor
                          amount={total}
                          currency={useFlockaCoin ? 'FLOCKA' : 'USDC'}
                          recipientAddress={WALLET_ADDRESS}
                          tokenAddress={useFlockaCoin ? FLOCKA_TOKEN_ADDRESS : ''}
                          walletAddress={walletAddress}
                          orderNumber={orderNumber}
                          onPaymentComplete={handlePaymentComplete}
                          onPaymentProcessing={handlePaymentProcessing}
                          onPaymentFailed={handlePaymentFailed}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6">
                    <button
                      onClick={() => setCheckoutStep(2)}
                      className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                      disabled={paymentStatus === 'processing'}
                    >
                      Back to Information
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6 sticky top-6">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${formatPrice(subtotal)}</span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>$FLOCKA Discount (10%)</span>
                      <span>-${formatPrice(discount)}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold">${formatPrice(total)}</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Method</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="usdc"
                        checked={!useFlockaCoin}
                        onChange={handlePaymentMethodChange}
                        className="mr-2"
                        disabled={checkoutStep === 3}
                      />
                      <span>USDC</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="flocka"
                        checked={useFlockaCoin}
                        onChange={handlePaymentMethodChange}
                        className="mr-2"
                        disabled={checkoutStep === 3}
                      />
                      <span>$FLOCKA Token (10% discount)</span>
                    </label>
                  </div>
                </div>
                
                {checkoutStep < 3 && (
                  <button
                    onClick={handleCheckout}
                    disabled={cartItems.length === 0}
                    className={`w-full py-3 px-4 rounded font-medium ${
                      cartItems.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {checkoutStep === 1 ? 'Proceed to Checkout' : 'Continue to Payment'}
                  </button>
                )}
                
                {checkoutStep === 2 && (
                  <p className="mt-4 text-sm text-gray-600">
                    By continuing, you agree to pay the specified amount in {useFlockaCoin ? '$FLOCKA tokens' : 'USDC'} to complete your order.
                  </p>
                )}
                
                {checkoutStep === 3 && (
                  <div className="mt-4">
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                      <p className="font-medium mb-1">Payment Instructions:</p>
                      <p>1. Connect your wallet if you haven't already</p>
                      <p>2. Need crypto? Use Coinbase Onramp (no KYC up to $500/week)</p>
                      <p>3. Approve the token spending (if required)</p>
                      <p>4. Confirm the transaction in your wallet</p>
                      <p>5. Wait for transaction confirmation</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  )
}
