// Mock Payment Gateway Service
// In a real application, this would integrate with Midtrans, Xendit, or Stripe API.

export const generatePaymentLink = async (bookingDetails) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const invoiceId = `INV-${Date.now()}`;
      resolve({
        success: true,
        invoiceId,
        paymentUrl: `https://mock-payment-gateway.local/pay/${invoiceId}`,
        qrisData: `00020101021126570011ID.CO.QRIS.WWW01189360091531234567890214123456789012340303UMI51440014ID.CO.QRIS.WWW0215ID12345678901230303UMI5204411153033605406${bookingDetails.amount}5802ID591337MUSICSTUDIO6007JAKARTA61051234562070703A016304ABCD`,
        amount: bookingDetails.amount,
        status: 'pending'
      });
    }, 800);
  });
};

export const checkPaymentStatus = async (invoiceId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mocking 80% chance of success for demonstration
      const isPaid = Math.random() > 0.2;
      resolve({
        success: true,
        invoiceId,
        status: isPaid ? 'paid' : 'pending',
        paidAt: isPaid ? new Date().toISOString() : null
      });
    }, 500);
  });
};
