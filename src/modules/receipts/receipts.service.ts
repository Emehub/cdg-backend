import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as QRCode from 'qrcode';
import * as puppeteer from 'puppeteer';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { ParcelStatus } from '../../common/enums/parcel-status.enum';

@Injectable()
export class ReceiptsService {
  private readonly logger = new Logger(ReceiptsService.name);
  private logoBase64: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {
    this.loadLogo();
  }

  private loadLogo() {
    const candidates = [
      path.resolve(__dirname, '../../../../frontend/public/hgl-logo.png'),
      path.resolve(process.cwd(), '../frontend/public/hgl-logo.png'),
      path.resolve(process.cwd(), 'assets/hgl-logo.png'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const ext = path.extname(p).replace('.', '');
        const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
        this.logoBase64 = `data:${mime};base64,${fs.readFileSync(p).toString('base64')}`;
        this.logger.log(`Logo loaded from ${p}`);
        return;
      }
    }
    this.logger.warn('HGL logo not found — receipt will render without logo');
  }

  async generate(parcelId: string, staffId: string) {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id: parcelId },
      include: {
        payment: true,
        destinationBranch: { select: { name: true, code: true, zone: true } },
        submittedByStaff: {
          select: {
            fullName: true,
            staffCode: true,
            branchId: true,
            terminalNumber: true,
            branch: { select: { name: true, code: true } },
          },
        },
      },
    });

    if (!parcel) throw new NotFoundException(`Parcel ${parcelId} not found`);

    if (parcel.status !== ParcelStatus.PAYMENT_CONFIRMED) {
      throw new BadRequestException(
        `Cannot generate receipt. Parcel status is ${parcel.status}. Payment must be confirmed first.`,
      );
    }

    if (!parcel.payment) {
      throw new BadRequestException('No payment record found for this parcel.');
    }

    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
      include: { branch: { select: { name: true, code: true } } },
    });

    if (!staff) throw new NotFoundException('Staff not found');

    // Generate all identifiers before building HTML
    const trackingId = await this.generateTrackingId(staff.branchId);
    const receiptNumber = await this.generateReceiptNumber(staff.branchId);

    const qrCodeDataUrl = await QRCode.toDataURL(trackingId, {
      width: 200,
      margin: 2,
      color: { dark: '#1B5E20', light: '#ffffff' },
    });

    const receiptHtml = this.buildReceiptHtml({
      trackingId,
      receiptNumber,
      parcel,
      payment: parcel.payment,
      staff,
      generatedAt: new Date(),
      qrCodeDataUrl,
    });

    const pdfBuffer = await this.renderPdf(receiptHtml);

    const pdfKey = `receipts/${staff.branchId}/${trackingId}.pdf`;
    await this.storage.uploadPdf(pdfKey, pdfBuffer);

    const { receipt } = await this.prisma.$transaction(async (tx) => {
      const receipt = await tx.receipt.create({
        data: {
          parcelId,
          trackingId,
          receiptNumber,
          pdfStorageKey: pdfKey,
          qrCodeData: trackingId,
          generatedByStaffId: staffId,
        },
      });
      await tx.parcel.update({
        where: { id: parcelId },
        data: { trackingId, status: ParcelStatus.ACTIVE },
      });
      return { receipt };
    });

    this.logger.log(`Receipt generated: ${trackingId} for parcel ${parcelId}`);

    return { receipt, trackingId, receiptNumber, pdfKey, status: ParcelStatus.ACTIVE };
  }

  async reprint(parcelId: string) {
    const receipt = await this.prisma.receipt.findUnique({ where: { parcelId } });
    if (!receipt) {
      throw new NotFoundException(
        `No receipt found for parcel ${parcelId}. Generate receipt first.`,
      );
    }
    return {
      trackingId: receipt.trackingId,
      receiptNumber: receipt.receiptNumber,
    };
  }

  async reprintPdf(parcelId: string): Promise<Buffer> {
    const receipt = await this.prisma.receipt.findUnique({
      where: { parcelId },
      include: {
        parcel: {
          include: {
            payment: true,
            destinationBranch: { select: { name: true, code: true, zone: true } },
            submittedByStaff: {
              select: {
                fullName: true,
                staffCode: true,
                branchId: true,
                terminalNumber: true,
                branch: { select: { name: true, code: true } },
              },
            },
          },
        },
        generatedByStaff: {
          include: { branch: { select: { name: true, code: true } } },
        },
      },
    });

    if (!receipt) throw new NotFoundException('No receipt found. Generate receipt first.');
    if (!receipt.parcel.payment) throw new NotFoundException('Payment record missing.');

    const qrCodeDataUrl = await QRCode.toDataURL(receipt.trackingId, {
      width: 200,
      margin: 2,
      color: { dark: '#1B5E20', light: '#ffffff' },
    });

    const html = this.buildReceiptHtml({
      trackingId: receipt.trackingId,
      receiptNumber: receipt.receiptNumber,
      parcel: receipt.parcel,
      payment: receipt.parcel.payment,
      staff: receipt.generatedByStaff,
      generatedAt: receipt.createdAt,
      qrCodeDataUrl,
    });

    return this.renderPdf(html);
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private async generateTrackingId(branchId: string): Promise<string> {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yearMonth = `${yy}-${mm}`;

    await this.prisma.$executeRaw`
      INSERT INTO receipt_sequences (id, branch_id, year_month, next_number, updated_at)
      VALUES (gen_random_uuid(), ${branchId}, ${yearMonth}, 2, NOW())
      ON CONFLICT (branch_id, year_month)
      DO UPDATE SET next_number = receipt_sequences.next_number + 1, updated_at = NOW()
    `;

    const seq = await this.prisma.receiptSequence.findUnique({
      where: { branchId_yearMonth: { branchId, yearMonth } },
    });

    const seqNumber = String((seq?.nextNumber ?? 1) - 1).padStart(7, '0');
    return `HGL-${yy}-${mm}-${seqNumber}`;
  }

  private async generateReceiptNumber(branchId: string): Promise<string> {
    const count = await this.prisma.receipt.count({
      where: { generatedByStaff: { branchId } },
    });
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      select: { code: true },
    });
    return `${branch?.code ?? 'HGL'}-RCP-${String(count + 1).padStart(6, '0')}`;
  }

  private async renderPdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'A5',
        printBackground: true,
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private buildReceiptHtml(data: {
    trackingId: string;
    receiptNumber: string;
    parcel: any;
    payment: any;
    staff: any;
    generatedAt: Date;
    qrCodeDataUrl: string;
  }): string {
    const { trackingId, receiptNumber, parcel, payment, staff, generatedAt, qrCodeDataUrl } = data;

    const formatDate = (d: Date) =>
      d.toLocaleString('en-GH', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Africa/Accra',
      });

    const logoHtml = this.logoBase64
      ? `<img src="${this.logoBase64}" alt="HGL" style="height:48px;width:auto;object-fit:contain;display:block;margin:0 auto 6px;" />`
      : `<div style="font-size:26px;font-weight:900;letter-spacing:4px;color:#F5A623;margin-bottom:6px;">HGL</div>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1f2937; background: #fff; }

  .receipt { border: 2px dashed #b8d4b8; border-radius: 10px; overflow: hidden; max-width: 380px; margin: 0 auto; }

  .hdr {
    background: linear-gradient(160deg, #1B5E20 0%, #2E7D32 100%);
    color: #fff;
    text-align: center;
    padding: 16px 14px 12px;
  }
  .hdr-name { font-size: 14px; font-weight: 800; letter-spacing: 1px; color: #fff; margin-top: 2px; }
  .hdr-sub { font-size: 9px; color: rgba(255,255,255,0.6); letter-spacing: 1.5px; text-transform: uppercase; margin-top: 2px; }
  .hdr-tagline { font-size: 9px; color: #F5A623; font-style: italic; margin-top: 3px; }

  .trk { background: #F0FDF4; text-align: center; padding: 12px; border-bottom: 2px dashed #b8d4b8; }
  .trk-lbl { font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; }
  .trk-id { font-size: 18px; font-weight: 800; color: #1B5E20; letter-spacing: 3px; font-family: 'Courier New', monospace; }

  .body { padding: 14px; }
  .qr { float: right; margin-left: 10px; width: 68px; height: 68px; }
  .qr img { width: 100%; height: 100%; }

  .sec {
    font-size: 9px; font-weight: 700; color: #1B5E20;
    text-transform: uppercase; letter-spacing: 1.5px;
    margin: 10px 0 5px; padding-bottom: 3px;
    border-bottom: 1.5px solid #b8d4b8;
  }

  .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; border-bottom: 1px dotted #e5e7eb; }
  .row:last-child { border-bottom: none; }
  .lbl { color: #6b7280; }
  .val { font-weight: 700; text-align: right; max-width: 55%; }

  .amount-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 0 4px; }
  .amount-lbl { color: #6b7280; font-size: 11px; }
  .amount { font-size: 20px; font-weight: 800; color: #1B5E20; }

  .footer { background: #F0FDF4; text-align: center; padding: 10px 14px; border-top: 2px dashed #b8d4b8; font-size: 9px; color: #6b7280; line-height: 1.7; }
  .footer strong { color: #1B5E20; }

  .rcpt-strip { background: #1B5E20; text-align: center; padding: 6px; font-size: 9px; font-weight: 700; color: #F5A623; letter-spacing: 2px; text-transform: uppercase; }

  .clearfix::after { content: ''; display: table; clear: both; }
</style>
</head>
<body>
<div class="receipt">

  <div class="hdr">
    ${logoHtml}
    <div class="hdr-name">HELIOS GLOBAL LOGISTICS</div>
    <div class="hdr-sub">Official Parcel Receipt</div>
    <div class="hdr-tagline">Fast. Safe. Reliable.</div>
  </div>

  <div class="trk">
    <div class="trk-lbl">Tracking ID</div>
    <div class="trk-id">${trackingId}</div>
  </div>

  <div class="body">
    <div class="clearfix">
      <div class="qr"><img src="${qrCodeDataUrl}" alt="QR" /></div>
      <div class="sec">Sender</div>
      <div class="row"><span class="lbl">Name</span><span class="val">${parcel.senderFullName}</span></div>
      <div class="row"><span class="lbl">Phone</span><span class="val">${parcel.senderPhone}</span></div>
    </div>

    <div class="sec">Receiver</div>
    <div class="row"><span class="lbl">Name</span><span class="val">${parcel.receiverFullName}</span></div>
    <div class="row"><span class="lbl">Phone</span><span class="val">${parcel.receiverPhone}</span></div>
    <div class="row"><span class="lbl">Destination</span><span class="val">${parcel.destinationBranch.name}</span></div>

    <div class="sec">Parcel</div>
    <div class="row"><span class="lbl">Type</span><span class="val">${parcel.parcelType}</span></div>
    <div class="row"><span class="lbl">Description</span><span class="val">${parcel.description}</span></div>

    <div class="sec">Payment</div>
    <div class="row"><span class="lbl">Method</span><span class="val">${payment.paymentMethod}</span></div>
    ${payment.paymentReference ? `<div class="row"><span class="lbl">Reference</span><span class="val">${payment.paymentReference}</span></div>` : ''}
    <div class="amount-row">
      <span class="amount-lbl">Amount Paid</span>
      <span class="amount">GHS ${Number(payment.amountPaid).toFixed(2)}</span>
    </div>

    <div class="sec">Processed By</div>
    <div class="row"><span class="lbl">Staff</span><span class="val">${staff.fullName} (${staff.staffCode})</span></div>
    <div class="row"><span class="lbl">Branch</span><span class="val">${staff.branch.name}</span></div>
    ${staff.terminalNumber ? `<div class="row"><span class="lbl">Terminal</span><span class="val">${staff.terminalNumber}</span></div>` : ''}
    <div class="row"><span class="lbl">Date &amp; Time</span><span class="val">${formatDate(generatedAt)}</span></div>
  </div>

  <div class="footer">
    <strong>This is an official Helios Global Logistics receipt.</strong><br>
    Keep this receipt safe. No receipt = parcel NOT officially accepted.<br>
    Scan the QR code above to track your parcel anytime.
  </div>

  <div class="rcpt-strip">Receipt No: ${receiptNumber}</div>

</div>
</body>
</html>`;
  }
}
