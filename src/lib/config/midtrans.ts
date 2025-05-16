// Midtrans configuration
// Do not store actual keys in source code
// Use environment variables for all sensitive credentials

export const midtransConfig = {
  isProduction: process.env.NODE_ENV === 'production',
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
};

// Important: You must set the MIDTRANS_SERVER_KEY and MIDTRANS_CLIENT_KEY 
// environment variables for the application to work properly

// Note: For production, set the MIDTRANS_SERVER_KEY and MIDTRANS_CLIENT_KEY environment variables
// with your actual Midtrans production keys 