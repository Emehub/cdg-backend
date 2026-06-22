import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ArkeselResponse {
  status: string;
  data?: Array<{ id: string; recipient: string }>;
  message?: string;
}

@Injectable()
export class ArkeselProvider {
  private readonly logger = new Logger(ArkeselProvider.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly senderId: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = config.get<string>('sms.arkesel.baseUrl') ?? '';
    this.apiKey = config.get<string>('sms.arkesel.apiKey') ?? '';
    this.senderId = config.get<string>('sms.arkesel.senderId') ?? 'CDG';
  }

  async send(
    to: string,
    message: string,
  ): Promise<{ success: boolean; reference?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: this.senderId,
          message,
          recipients: [this.normalizeGhanaPhone(to)],
        }),
        signal: AbortSignal.timeout(10_000),
      });

      const json: ArkeselResponse = await response.json();

      if (response.ok && json.status === 'success') {
        return { success: true, reference: json.data?.[0]?.id };
      }

      this.logger.warn(`Arkesel rejected: ${json.message}`);
      return { success: false, error: json.message };
    } catch (err: any) {
      this.logger.error(`Arkesel request failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  private normalizeGhanaPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('0') && digits.length === 10) {
      return `+233${digits.slice(1)}`;
    }
    if (digits.startsWith('233')) return `+${digits}`;
    return phone;
  }
}
