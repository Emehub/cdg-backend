import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type MomoNetwork = 'mtn' | 'vod' | 'tgo';

export interface PaystackChargeResult {
  reference: string;
  status: 'pending' | 'success' | 'failed';
  authorizationUrl?: string;
  message: string;
}

export interface PaystackVerifyResult {
  status: 'success' | 'failed' | 'abandoned' | 'ongoing' | 'pending' | 'reversed';
  reference: string;
  amountPaid: number;
  gatewayResponse: string;
}

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly secretKey: string;
  private readonly baseUrl = 'https://api.paystack.co';

  constructor(private readonly config: ConfigService) {
    this.secretKey = config.get<string>('PAYSTACK_SECRET_KEY') ?? '';
  }

  async initializeMomoCharge(params: {
    phone: string;
    network: MomoNetwork;
    amountGhs: number;
    reference: string;
    metadata?: Record<string, unknown>;
  }): Promise<PaystackChargeResult> {
    const email = `${params.phone.replace(/^0/, '233')}@cdglogistics.noreply`;
    const amountPesewas = Math.round(params.amountGhs * 100);

    try {
      const response = await fetch(`${this.baseUrl}/charge`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          email,
          amount: amountPesewas,
          reference: params.reference,
          mobile_money: {
            phone: params.phone,
            provider: params.network,
          },
          metadata: params.metadata ?? {},
        }),
        signal: AbortSignal.timeout(15_000),
      });

      const json = await response.json();

      if (!response.ok) {
        this.logger.warn(`Paystack charge failed: ${json.message}`);
        return { reference: params.reference, status: 'failed', message: json.message };
      }

      const data = json.data;
      // Paystack MoMo returns status: "pay_offline" — customer will get USSD prompt
      const isPending = ['pay_offline', 'send_otp', 'open_url'].includes(data.status);
      return {
        reference: data.reference ?? params.reference,
        status: isPending ? 'pending' : data.status === 'success' ? 'success' : 'failed',
        message: data.display_text ?? json.message ?? 'Awaiting customer approval',
      };
    } catch (err: any) {
      this.logger.error(`Paystack MoMo request error: ${err.message}`);
      return { reference: params.reference, status: 'failed', message: err.message };
    }
  }

  async initializeCardTransaction(params: {
    email: string;
    amountGhs: number;
    reference: string;
    metadata?: Record<string, unknown>;
  }): Promise<PaystackChargeResult> {
    const amountPesewas = Math.round(params.amountGhs * 100);

    try {
      const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          email: params.email,
          amount: amountPesewas,
          reference: params.reference,
          currency: 'GHS',
          channels: ['card'],
          metadata: params.metadata ?? {},
        }),
        signal: AbortSignal.timeout(15_000),
      });

      const json = await response.json();

      if (!response.ok || !json.status) {
        return { reference: params.reference, status: 'failed', message: json.message };
      }

      return {
        reference: params.reference,
        status: 'pending',
        authorizationUrl: json.data.authorization_url,
        message: 'Redirect customer to payment page',
      };
    } catch (err: any) {
      this.logger.error(`Paystack card init error: ${err.message}`);
      return { reference: params.reference, status: 'failed', message: err.message };
    }
  }

  async verifyTransaction(reference: string): Promise<PaystackVerifyResult> {
    try {
      const response = await fetch(
        `${this.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: this.headers(),
          signal: AbortSignal.timeout(15_000),
        },
      );

      const json = await response.json();

      if (!response.ok || !json.status) {
        return {
          status: 'failed',
          reference,
          amountPaid: 0,
          gatewayResponse: json.message ?? 'Verification failed',
        };
      }

      const data = json.data;
      const amountGhs = (data.amount ?? 0) / 100;

      return {
        status: data.status,
        reference: data.reference ?? reference,
        amountPaid: amountGhs,
        gatewayResponse: data.gateway_response ?? '',
      };
    } catch (err: any) {
      this.logger.error(`Paystack verify error: ${err.message}`);
      return { status: 'failed', reference, amountPaid: 0, gatewayResponse: err.message };
    }
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(rawBody)
      .digest('hex');
    return hash === signature;
  }

  generateReference(prefix = 'CDG'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  }

  private headers() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }
}
