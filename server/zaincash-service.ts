import jwt from 'jsonwebtoken';

// Zaincash Test Credentials
const ZAINCASH_CONFIG = {
  MERCHANT_ID: '5ffacf6612b5777c6d44266f',
  MERCHANT_SECRET: '$2y$10$hBbAZo2GfSSvyqAyV2SaqOfYewgYpfR1O19gIh4SqyGWdmySZYPuS',
  MSISDN: '9647835077893', // Test wallet phone number
  TEST_API_URL: 'https://test.zaincash.iq',
  PRODUCTION_API_URL: 'https://api.zaincash.iq',
  IS_PRODUCTION: false
};

export interface ZaincashTransactionRequest {
  amount: number; // Amount in IQD (minimum 250)
  serviceType: string; // Description of service
  orderId: string; // Unique order reference
  redirectUrl: string; // Callback URL after payment
}

export interface ZaincashTransactionResponse {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string;
  error?: string;
}

export interface ZaincashCallbackToken {
  status: 'success' | 'failed' | 'pending';
  orderid: string;
  id: string; // Transaction ID
  msg?: string; // Error message if failed
  iat: number;
  exp: number;
}

export class ZaincashService {
  private getApiUrl(): string {
    return ZAINCASH_CONFIG.IS_PRODUCTION 
      ? ZAINCASH_CONFIG.PRODUCTION_API_URL 
      : ZAINCASH_CONFIG.TEST_API_URL;
  }

  /**
   * Create a new Zaincash transaction
   */
  async createTransaction(request: ZaincashTransactionRequest): Promise<ZaincashTransactionResponse> {
    try {
      // Validate minimum amount
      if (request.amount < 5000) {
        return {
          success: false,
          error: 'الحد الأدنى للشحن هو 5,000 دينار عراقي'
        };
      }

      // Build JWT payload
      const tokenData = {
        amount: request.amount,
        serviceType: request.serviceType,
        msisdn: ZAINCASH_CONFIG.MSISDN,
        orderId: request.orderId,
        redirectUrl: request.redirectUrl,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (4 * 60 * 60) // 4 hours expiry
      };

      // Create JWT token
      const token = jwt.sign(tokenData, ZAINCASH_CONFIG.MERCHANT_SECRET, { algorithm: 'HS256' });

      // Prepare POST data
      const postData = new URLSearchParams({
        token: token,
        merchantId: ZAINCASH_CONFIG.MERCHANT_ID,
        lang: 'ar'
      });

      // Make request to Zaincash
      const response = await fetch(`${this.getApiUrl()}/transaction/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: postData.toString()
      });

      const result = await response.json();

      if (result.id) {
        return {
          success: true,
          transactionId: result.id,
          paymentUrl: `${this.getApiUrl()}/transaction/pay?id=${result.id}`
        };
      } else {
        return {
          success: false,
          error: result.msg || 'خطأ في إنشاء المعاملة'
        };
      }

    } catch (error) {
      console.error('Zaincash transaction creation error:', error);
      return {
        success: false,
        error: 'خطأ في الاتصال بخدمة الدفع'
      };
    }
  }

  /**
   * Verify and decode callback token from Zaincash redirect
   */
  verifyCallbackToken(token: string): ZaincashCallbackToken | null {
    try {
      const decoded = jwt.verify(token, ZAINCASH_CONFIG.MERCHANT_SECRET, { algorithms: ['HS256'] }) as ZaincashCallbackToken;
      return decoded;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  /**
   * Check transaction status manually
   */
  async checkTransactionStatus(transactionId: string): Promise<any> {
    try {
      const tokenData = {
        id: transactionId,
        msisdn: ZAINCASH_CONFIG.MSISDN,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (4 * 60 * 60)
      };

      const token = jwt.sign(tokenData, ZAINCASH_CONFIG.MERCHANT_SECRET, { algorithm: 'HS256' });

      const postData = new URLSearchParams({
        token: token,
        merchantId: ZAINCASH_CONFIG.MERCHANT_ID
      });

      const response = await fetch(`${this.getApiUrl()}/transaction/get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: postData.toString()
      });

      return await response.json();

    } catch (error) {
      console.error('Transaction status check error:', error);
      return null;
    }
  }

  /**
   * Format amount with comma separators
   */
  formatAmount(amount: number): string {
    return amount.toLocaleString('en-US');
  }
}

export const zaincashService = new ZaincashService();