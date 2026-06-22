import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = config.get<string>('storage.bucket') ?? 'cdg-receipts';

    this.s3 = new S3Client({
      endpoint: config.get<string>('storage.endpoint'),
      region: config.get<string>('storage.region') ?? 'auto',
      credentials: {
        accessKeyId: config.get<string>('storage.accessKeyId') ?? '',
        secretAccessKey: config.get<string>('storage.secretAccessKey') ?? '',
      },
      forcePathStyle: true,
    });
  }

  async uploadPdf(key: string, pdfBuffer: Buffer): Promise<string> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
        ContentDisposition: 'inline',
      }),
    );

    this.logger.log(`Uploaded receipt PDF → ${key}`);
    return key;
  }

  async getSignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expiresInSeconds },
    );
  }
}
