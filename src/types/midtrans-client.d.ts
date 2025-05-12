declare module 'midtrans-client' {
  interface MidtransConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  interface SnapTransaction {
    token: string;
    redirect_url: string;
  }

  interface TransactionStatus {
    order_id: string;
    transaction_status: string;
    fraud_status?: string;
    payment_type?: string;
    gross_amount?: string;
    transaction_id?: string;
  }

  class CoreApiClient {
    constructor(options: MidtransConfig);
    transaction: {
      status(orderId: string): Promise<TransactionStatus>;
      notification(notificationData: any): Promise<TransactionStatus>;
      approve(orderId: string): Promise<any>;
      deny(orderId: string): Promise<any>;
      cancel(orderId: string): Promise<any>;
      expire(orderId: string): Promise<any>;
      refund(orderId: string, params: any): Promise<any>;
      refundDirect(orderId: string, params: any): Promise<any>;
    };
    charge(params: any): Promise<any>;
    apiConfig: MidtransConfig;
  }

  class Snap {
    constructor(options?: MidtransConfig);
    createTransaction(params: any): Promise<SnapTransaction>;
    createTransactionToken(params: any): Promise<string>;
    createTransactionRedirectUrl(params: any): Promise<string>;
    transaction: {
      status(orderId: string): Promise<TransactionStatus>;
      notification(notificationData: any): Promise<TransactionStatus>;
      approve(orderId: string): Promise<any>;
      deny(orderId: string): Promise<any>;
      cancel(orderId: string): Promise<any>;
      expire(orderId: string): Promise<any>;
      refund(orderId: string, params: any): Promise<any>;
      refundDirect(orderId: string, params: any): Promise<any>;
    };
    apiConfig: MidtransConfig;
  }

  interface ISnapBiConfig {
    isProduction: boolean;
    snapBiClientId: string;
    snapBiPrivateKey: string;
    snapBiClientSecret: string;
    snapBiPartnerId: string;
    snapBiChannelId: string;
    enableLogging: boolean;
  }

  class SnapBi {
    static va(): SnapBi;
    static qris(): SnapBi;
    static directDebit(): SnapBi;
    static notification(): {
      withNotificationPayload(payload: string): any;
      withSignature(signature: string): any;
      withTimeStamp(timestamp: string): any;
      withNotificationUrlPath(path: string): any;
      isWebhookNotificationVerified(): boolean;
    };
    static SnapBiConfig: ISnapBiConfig;
    withBody(body: any): SnapBi;
    createPayment(externalId: string): Promise<any>;
    getStatus(externalId: string): Promise<any>;
  }

  export {
    CoreApiClient as CoreApi,
    Snap,
    SnapBi,
  };
} 