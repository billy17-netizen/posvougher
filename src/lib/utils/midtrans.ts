import midtransClient from 'midtrans-client';
import { midtransConfig } from '../config/midtrans';

/**
 * Create a Snap API instance
 */
export const createSnapInstance = () => {
  return new midtransClient.Snap({
    isProduction: midtransConfig.isProduction,
    serverKey: midtransConfig.serverKey,
    clientKey: midtransConfig.clientKey
  });
};

/**
 * Ensure order ID is unique by appending a timestamp if not already present
 */
export const generateUniqueOrderId = (orderId: string) => {
  // If the orderId already has a timestamp, use it as is
  if (orderId.includes('_t')) {
    return orderId;
  }
  
  // Truncate long order IDs to prevent exceeding Midtrans limits
  // Midtrans has a limit on order_id length
  let baseOrderId = orderId;
  if (baseOrderId.length > 20) {
    // Keep the first 8 chars and last 8 chars if it's too long
    baseOrderId = `${baseOrderId.substring(0, 8)}_${baseOrderId.substring(baseOrderId.length - 8)}`;
  }
  
  // Add a shorter timestamp to ensure uniqueness (last 6 digits of timestamp)
  const timestamp = new Date().getTime().toString().slice(-6);
  return `${baseOrderId}_t${timestamp}`;
};

/**
 * Generate a Midtrans Snap token for a transaction
 * @param orderInfo Transaction details
 * @returns Promise containing the Snap token
 */
export const generateSnapToken = async (orderInfo: {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}) => {
  const snap = createSnapInstance();
  
  // Validate the input
  if (!orderInfo.orderId) {
    throw new Error('Order ID is required');
  }
  
  if (!orderInfo.amount || orderInfo.amount <= 0) {
    throw new Error(`Invalid transaction amount: ${orderInfo.amount}`);
  }
  
  if (!orderInfo.customerName) {
    console.warn('Customer name is empty, using "Customer" as default');
    orderInfo.customerName = 'Customer';
  }
  
  // Ensure the amount is a whole number (Midtrans requirement)
  const grossAmount = Math.round(orderInfo.amount);
  
  // Ensure the order ID is unique
  const uniqueOrderId = generateUniqueOrderId(orderInfo.orderId);
  
  console.log(`[midtrans] Creating transaction for order: ${uniqueOrderId}, amount: ${grossAmount}`);
  
  // Format item details - ensure all items have names and positive prices
  const itemDetails = (orderInfo.items || []).map(item => ({
    id: item.id || 'item',
    name: item.name || 'Item',
    price: Math.max(Math.round(item.price), 1),
    quantity: Math.max(item.quantity, 1)
  }));
  
  // Check if the amount is within QRIS limits (minimum 1000 IDR, maximum 5,000,000 IDR)
  // Reference: https://midtrans.com/id/blog/cara-implementasi-qris-di-website-menggunakan-midtrans
  if (grossAmount < 1000) {
    throw new Error(`Transaction amount ${grossAmount} is below the minimum QRIS transaction amount of 1,000 IDR`);
  }
  
  if (grossAmount > 5000000) {
    throw new Error(`Transaction amount ${grossAmount} exceeds the maximum QRIS transaction amount of 5,000,000 IDR`);
  }
  
  const parameter = {
    transaction_details: {
      order_id: uniqueOrderId,
      gross_amount: grossAmount
    },
    customer_details: {
      first_name: orderInfo.customerName,
      ...(orderInfo.customerEmail && orderInfo.customerEmail.includes('@') ? { email: orderInfo.customerEmail } : {}),
      ...(orderInfo.customerPhone ? { phone: orderInfo.customerPhone } : {})
    },
    item_details: itemDetails,
    credit_card: {
      secure: true
    },
    enabled_payments: ["bca_va", "bni_va", "bri_va", "permata_va", "gopay"]
  };

  try {
    console.log(`[midtrans] Sending request to create transaction with params:`, JSON.stringify(parameter));
    const transaction = await snap.createTransaction(parameter);
    console.log(`[midtrans] Transaction created successfully, token:`, transaction.token ? transaction.token.substring(0, 10) + '...' : 'none');
    
    return {
      token: transaction.token,
      redirectUrl: transaction.redirect_url
    };
  } catch (error: any) {
    console.error('[midtrans] Error generating Midtrans Snap token:', error);
    
    // Try to extract more meaningful error information
    let errorMessage = 'Unknown error';
    
    if (error.message) {
      errorMessage = error.message;
    }
    
    if (error.apiResponse) {
      console.error('[midtrans] API Response:', error.apiResponse);
      if (error.apiResponse.status_message) {
        errorMessage = `Midtrans Error: ${error.apiResponse.status_message}`;
      }
      
      // Check for specific error indicating order ID already exists
      if (error.apiResponse.status_message && 
          error.apiResponse.status_message.includes("transaction_details.order_id has already been taken")) {
        errorMessage = "Order ID sudah digunakan. Coba refresh halaman dan gunakan ID baru.";
      }
      
      // Check for specific error indicating payment methods not available
      if (error.apiResponse.validation_messages && 
          Array.isArray(error.apiResponse.validation_messages)) {
        errorMessage = 'Metode pembayaran tidak tersedia. Pastikan metode pembayaran sudah diaktifkan di akun Midtrans Anda.';
      }
      
      // Check for too long order ID error
      if (error.apiResponse.status_message && 
          error.apiResponse.status_message.includes("transaction_details.order_id too long")) {
        errorMessage = "Order ID terlalu panjang. Sistem akan mempersingkat ID secara otomatis.";
        
        // Try again with a shorter order ID if possible
        try {
          const shortenedOrderId = uniqueOrderId.substring(0, 20); // Limit to 20 chars
          console.log(`[midtrans] Retrying with shortened order ID: ${shortenedOrderId}`);
          
          // Update parameter with shorter order ID
          parameter.transaction_details.order_id = shortenedOrderId;
          
          // Try again with shorter order ID
          const retryTransaction = await snap.createTransaction(parameter);
          console.log(`[midtrans] Retry successful, token:`, retryTransaction.token ? retryTransaction.token.substring(0, 10) + '...' : 'none');
          
          return {
            token: retryTransaction.token,
            redirectUrl: retryTransaction.redirect_url
          };
        } catch (retryError) {
          console.error('[midtrans] Error on retry with shortened order ID:', retryError);
          // Continue with original error if retry fails
        }
      }
    }
    
    throw new Error(`Failed to generate Midtrans token: ${errorMessage}`);
  }
};

/**
 * Verify a Midtrans notification
 * @param notification Notification payload from Midtrans webhook
 * @returns Promise containing the verified notification data
 */
export const verifyMidtransNotification = async (notification: any) => {
  const snap = createSnapInstance();
  try {
    const statusResponse = await snap.transaction.notification(notification);
    return statusResponse;
  } catch (error) {
    console.error('Error verifying Midtrans notification:', error);
    throw error;
  }
}; 