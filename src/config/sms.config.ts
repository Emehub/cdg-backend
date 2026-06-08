import { registerAs } from '@nestjs/config';

export default registerAs('sms', () => ({
  arkesel: {
    apiKey: process.env.ARKESEL_API_KEY,
    senderId: process.env.ARKESEL_SENDER_ID ?? 'CDG',
    baseUrl: 'https://sms.arkesel.com/sms/api',
  },
}));
