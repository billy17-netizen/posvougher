// Midtrans configuration
// Replace these values with your actual Midtrans keys
// For development, you can use Midtrans Sandbox environment

export const midtransConfig = {
  isProduction: process.env.NODE_ENV === 'production',
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-_vhwGCUCGrZ6TvhD2KKEpdCz',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-gFXH94supPKrBTUf',
};

// Note: For production, set the MIDTRANS_SERVER_KEY and MIDTRANS_CLIENT_KEY environment variables
// with your actual Midtrans production keys 