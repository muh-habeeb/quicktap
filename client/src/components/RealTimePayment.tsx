import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import PaymentService from '@/services/paymentService';

interface RealTimePaymentProps {
  amount: number;
  orderId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPaymentSuccess: (paymentData: any) => void;
  onPaymentFailure: (error: string) => void;
  onClose: () => void;
}

const RealTimePayment: React.FC<RealTimePaymentProps> = ({
  amount,
  orderId,
  onPaymentSuccess,
  onPaymentFailure,
  onClose,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string>('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  const wsRef = useRef<WebSocket | null>(null);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Handle Razorpay payment
  const handleRazorpayPayment = async () => {
    try {
      setLoading(true);

      // Create Razorpay order
      const orderResponse = await PaymentService.createRazorpayOrder({
        amount,
        currency: 'INR',
        receipt: orderId,
        notes: {
          orderId,
          description: 'Food order payment',
        },
      });

      if (!orderResponse.success) {
        throw new Error('Failed to create payment order');
      }

      // Get user data from localStorage
      let userName = 'Customer';
      let userEmail = '';
      const userInfo = localStorage.getItem('user-info');
      if (userInfo) {
        try {
          const user = JSON.parse(userInfo);
          userName = user.name || 'Customer';
          userEmail = user.email || '';
        } catch (error) {
          console.error('Error parsing user info:', error);
        }
      }

      // Initialize Razorpay payment
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderResponse.order.amount,
        currency: orderResponse.order.currency,
        name: 'Quick Tap',
        description: 'Food order payment',
        order_id: orderResponse.order.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await PaymentService.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyResponse.success) {
              setPaymentStatus('success');
              onPaymentSuccess(verifyResponse);
              toast.success('Payment successful!');
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            setPaymentStatus('failed');
            onPaymentFailure('Payment verification failed');
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: userName,
          email: userEmail,
        },
        theme: {
          color: 'oklch(0.484 0.167 149.214)',
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Razorpay payment error:', error);
      onPaymentFailure('Failed to initialize payment');
      toast.error('Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  // Handle UPI payment
  // const handleUPIPayment = async () => {
  //   try {
  //     setLoading(true);

  //     const upiResponse = await PaymentService.createUPIPayment({
  //       amount,
  //       upiId: 'yendine@upi', // Replace with your actual UPI ID
  //       description: `Food order - ${orderId}`,
  //       orderId,
  //     });

  //     if (upiResponse.success) {
  //       setPaymentId(upiResponse.paymentId);
  //       setQrCodeData(upiResponse.qrData);
  //       setPaymentStatus('pending');

  //       // Start real-time status monitoring
  //       startPaymentMonitoring(upiResponse.paymentId);

  //       toast.success('UPI payment initiated');
  //     } else {
  //       throw new Error('Failed to create UPI payment');
  //     }
  //   } catch (error) {
  //     console.error('UPI payment error:', error);
  //     onPaymentFailure('Failed to create UPI payment');
  //     toast.error('Failed to create UPI payment');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Start real-time payment monitoring
  const startPaymentMonitoring = (paymentId: string) => {
    // Poll for payment status
    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await PaymentService.getPaymentStatus(paymentId);

        if (statusResponse.success) {
          if (statusResponse.status === 'success') {
            setPaymentStatus('success');
            onPaymentSuccess(statusResponse);
            toast.success('Payment successful!');
            clearInterval(pollInterval);
          } else if (statusResponse.status === 'failed') {
            setPaymentStatus('failed');
            onPaymentFailure('Payment failed');
            toast.error('Payment failed');
            clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }, 3000); // Check every 3 seconds

    // Cleanup after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 300000);
  };

  // Handle direct UPI app opening
  const openUPIApp = () => {
    if (qrCodeData) {
      window.open(qrCodeData, '_blank');
      toast.success('Opening UPI app...');
    }
  };

  // Handle QR code scan success
  const handleQRScanSuccess = (result: string) => {
    setScannedData(result);
    setShowQRScanner(false);

    // Check if it's a UPI QR code
    if (result.startsWith('upi://')) {
      // Extract payment details from UPI QR code
      const upiUrl = new URL(result);
      const amount = upiUrl.searchParams.get('am');
      const payeeId = upiUrl.searchParams.get('pa');
      const payeeName = upiUrl.searchParams.get('pn');

      if (amount && payeeId) {
        toast.success(`QR Code scanned! Amount: ₹${amount}`);
        // Process the scanned UPI payment
        processScannedUPIPayment(result, parseFloat(amount), payeeId, payeeName || 'Unknown');
      } else {
        toast.error('Invalid UPI QR code format');
      }
    } else {
      toast.error('Invalid QR code. Please scan a valid UPI QR code.');
    }
  };

  // Process scanned UPI payment
  const processScannedUPIPayment = async (upiUrl: string, scannedAmount: number, payeeId: string, payeeName: string) => {
    try {
      // Verify if the scanned amount matches the order amount
      if (Math.abs(amount - scannedAmount) > 1) { // Allow 1 rupee difference
        toast.error(`Amount mismatch. Expected: ₹${amount}, Scanned: ₹${scannedAmount}`);
        return;
      }

      // Create payment record
      const paymentResponse = await PaymentService.createUPIPayment({
        amount: scannedAmount,
        upiId: payeeId,
        description: `Scanned payment to ${payeeName}`,
        orderId: orderId,
      });

      if (paymentResponse.success) {
        setPaymentStatus('success');
        onPaymentSuccess(paymentResponse);
        toast.success('Payment processed successfully!');
      } else {
        throw new Error('Failed to process payment');
      }
    } catch (error) {
      console.error('Error processing scanned payment:', error);
      setPaymentStatus('failed');
      onPaymentFailure('Failed to process scanned payment');
      toast.error('Failed to process payment');
    }
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-xl">Real-Time Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!paymentMethod ? (
            // Payment method selection
            <div className="space-y-3">
              <p className="text-lg font-semibold">Amount: ₹{amount}</p>
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => setPaymentMethod('razorpay')}
                disabled={loading}
              >
                💳 Pay with Razorpay
              </Button>
              <Button
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={() => setPaymentMethod('upi')}
                disabled={loading}
              >
                💱 Pay with UPI
              </Button>
              <Button
                className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                onClick={() => setShowQRScanner(true)}
                disabled={loading}
              >
                📷 Scan QR Code
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={onClose}
              >
                Cancel
              </Button>
            </div>
          ) : paymentMethod === 'razorpay' ? (
            // Razorpay payment
            <div className="space-y-4">
              <p className="text-center">Redirecting to Razorpay...</p>
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleRazorpayPayment}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Proceed to Payment'}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setPaymentMethod('')}
              >
                Back
              </Button>
            </div>
          ) : (
            // UPI payment
            <div className="space-y-4">
              {qrCodeData ? (
                <>
                  <div className="text-center">
                    <div className="bg-gray-100 p-4 rounded-lg mb-4">
                      <div className="w-48 h-48 bg-white mx-auto border-2 border-gray-300 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-6xl mb-2">📱</div>
                          <p className="text-sm text-gray-600">UPI QR Code</p>
                          <p className="text-xs text-gray-500 mt-1">Amount: ₹{amount}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Scan this QR code with any UPI app
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Button
                      className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                      onClick={openUPIApp}
                    >
                      Open UPI App
                    </Button>

                    {paymentStatus === 'pending' && (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Waiting for payment...</p>
                      </div>
                    )}

                    {paymentStatus === 'success' && (
                      <div className="text-center text-primary">
                        <p>✅ Payment Successful!</p>
                      </div>
                    )}

                    {paymentStatus === 'failed' && (
                      <div className="text-center text-destructive">
                        <p>❌ Payment Failed</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>Initializing UPI payment...</p>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setPaymentMethod('')}
              >
                Back
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default RealTimePayment;
