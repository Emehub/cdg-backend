import { Injectable, Logger } from '@nestjs/common';
import { ArkeselProvider } from './providers/arkesel.provider';

export interface SmsSendResult {
  success: boolean;
  provider: string;
  reference?: string;
  error?: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly arkesel: ArkeselProvider) {}

  async sendParcelSubmissionWarning(params: {
    phone: string;
    parcelDescription: string;
    destination: string;
  }): Promise<SmsSendResult> {
    const message = this.buildSmsTemplate(
      params.parcelDescription,
      params.destination,
    );

    const result = await this.arkesel.send(params.phone, message);
    if (result.success) {
      return { success: true, provider: 'arkesel', reference: result.reference };
    }

    this.logger.error(`Arkesel SMS failed for ${params.phone}: ${result.error}`);
    return { success: false, provider: 'arkesel', error: result.error };
  }

  async sendOtp(params: { phone: string; otp: string }): Promise<SmsSendResult> {
    const message =
      `CDG Global Logistics:\n` +
      `Your parcel collection OTP is: ${params.otp}\n` +
      `Valid for 30 minutes. Do not share this code.\n` +
      `Present this code at the branch to collect your parcel.`;

    const result = await this.arkesel.send(params.phone, message);
    if (result.success) {
      return { success: true, provider: 'arkesel', reference: result.reference };
    }

    this.logger.error(`Arkesel OTP SMS failed for ${params.phone}: ${result.error}`);
    return { success: false, provider: 'arkesel', error: result.error };
  }

  buildSmsTemplate(parcelDescription: string, destination: string): string {
    return (
      `CDG Global Logistics:\n` +
      `Your parcel has been submitted at our terminal.\n` +
      `Description: ${parcelDescription}\n` +
      `Destination: ${destination}\n\n` +
      `IMPORTANT: Insist on an official CDG receipt after payment.\n` +
      `No receipt = parcel NOT officially accepted into CDG system.\n` +
      `Queries: 0XX-XXX-XXXX`
    );
  }
}
