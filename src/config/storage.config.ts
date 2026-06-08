import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  endpoint: process.env.STORAGE_ENDPOINT,
  bucket: process.env.STORAGE_BUCKET ?? 'cdg-receipts',
  accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
  secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
  region: process.env.STORAGE_REGION ?? 'auto',
}));
