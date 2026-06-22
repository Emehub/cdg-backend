-- CreateEnum
CREATE TYPE "ParcelStatus" AS ENUM ('PENDING_SUBMISSION', 'SUBMITTED', 'SMS_SENT', 'SMS_FAILED', 'PAYMENT_CONFIRMED', 'RECEIPT_GENERATED', 'ACTIVE', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'FAILED_DELIVERY', 'RETURNED');

-- CreateEnum
CREATE TYPE "ParcelType" AS ENUM ('GENERAL', 'DOCUMENT', 'FRAGILE', 'ELECTRONICS', 'CLOTHING');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'MOMO', 'CARD');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('TERMINAL_STAFF', 'BRANCH_MANAGER', 'FINANCE_ADMIN', 'IT_ADMIN');

-- CreateEnum
CREATE TYPE "SmsStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "staff_code" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL,
    "branch_id" TEXT NOT NULL,
    "terminal_number" TEXT,
    "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcels" (
    "id" TEXT NOT NULL,
    "tracking_id" TEXT,
    "status" "ParcelStatus" NOT NULL DEFAULT 'PENDING_SUBMISSION',
    "sender_full_name" TEXT NOT NULL,
    "sender_phone" TEXT NOT NULL,
    "receiver_full_name" TEXT NOT NULL,
    "receiver_phone" TEXT NOT NULL,
    "destination_branch_id" TEXT NOT NULL,
    "parcel_type" "ParcelType" NOT NULL,
    "description" TEXT NOT NULL,
    "proposed_fee" DECIMAL(10,2) NOT NULL,
    "submitted_by_staff_id" TEXT,
    "submitted_at" TIMESTAMP(3),
    "sms_status" "SmsStatus" NOT NULL DEFAULT 'PENDING',
    "sms_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "parcels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcel_otps" (
    "id" TEXT NOT NULL,
    "parcel_id" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "parcel_otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "parcel_id" TEXT NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "amount_paid" DECIMAL(10,2) NOT NULL,
    "payment_reference" TEXT,
    "paystack_reference" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "confirmed_by_staff_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" TEXT NOT NULL,
    "parcel_id" TEXT NOT NULL,
    "tracking_id" TEXT NOT NULL,
    "receipt_number" TEXT NOT NULL,
    "pdf_storage_key" TEXT NOT NULL,
    "qr_code_data" TEXT NOT NULL,
    "generated_by_staff_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_sequences" (
    "id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "year_month" TEXT NOT NULL,
    "next_number" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "receipt_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_entries" (
    "id" TEXT NOT NULL,
    "parcel_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "transaction_date" DATE NOT NULL,
    "transaction_time" TIME NOT NULL,
    "amount_charged" DECIMAL(10,2) NOT NULL,
    "amount_paid" DECIMAL(10,2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "payment_reference" TEXT,
    "parcel_type" "ParcelType" NOT NULL,
    "destination" TEXT NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "void_reason" TEXT,
    "void_approved_by_id" TEXT,
    "void_requested_by_id" TEXT,
    "parent_entry_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "revenue_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_rules" (
    "id" TEXT NOT NULL,
    "parcel_type" "ParcelType" NOT NULL,
    "destination_zone" TEXT NOT NULL,
    "min_fee" DECIMAL(10,2) NOT NULL,
    "standard_fee" DECIMAL(10,2) NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "created_by_id" TEXT NOT NULL,
    "approved_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fee_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_reconciliation_summaries" (
    "id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total_receipts" INTEGER NOT NULL,
    "total_revenue" DECIMAL(10,2) NOT NULL,
    "cash_total" DECIMAL(10,2) NOT NULL,
    "momo_total" DECIMAL(10,2) NOT NULL,
    "card_total" DECIMAL(10,2) NOT NULL,
    "has_discrepancy" BOOLEAN NOT NULL DEFAULT false,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "daily_reconciliation_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_logs" (
    "id" TEXT NOT NULL,
    "parcel_id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" "SmsStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sms_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "branch_id" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "branches_code_key" ON "branches"("code");
CREATE UNIQUE INDEX "staff_staff_code_key" ON "staff"("staff_code");
CREATE UNIQUE INDEX "staff_username_key" ON "staff"("username");
CREATE UNIQUE INDEX "parcels_tracking_id_key" ON "parcels"("tracking_id");
CREATE UNIQUE INDEX "payments_parcel_id_key" ON "payments"("parcel_id");
CREATE UNIQUE INDEX "payments_paystack_reference_key" ON "payments"("paystack_reference");
CREATE UNIQUE INDEX "payments_idempotency_key_key" ON "payments"("idempotency_key");
CREATE UNIQUE INDEX "receipts_parcel_id_key" ON "receipts"("parcel_id");
CREATE UNIQUE INDEX "receipts_tracking_id_key" ON "receipts"("tracking_id");
CREATE UNIQUE INDEX "receipts_receipt_number_key" ON "receipts"("receipt_number");
CREATE UNIQUE INDEX "receipt_sequences_branch_id_year_month_key" ON "receipt_sequences"("branch_id", "year_month");
CREATE UNIQUE INDEX "revenue_entries_parcel_id_key" ON "revenue_entries"("parcel_id");
CREATE UNIQUE INDEX "daily_reconciliation_summaries_branch_id_date_key" ON "daily_reconciliation_summaries"("branch_id", "date");

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_destination_branch_id_fkey" FOREIGN KEY ("destination_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_submitted_by_staff_id_fkey" FOREIGN KEY ("submitted_by_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "parcel_otps" ADD CONSTRAINT "parcel_otps_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "parcels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "parcels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_confirmed_by_staff_id_fkey" FOREIGN KEY ("confirmed_by_staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "parcels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_generated_by_staff_id_fkey" FOREIGN KEY ("generated_by_staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "receipt_sequences" ADD CONSTRAINT "receipt_sequences_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "revenue_entries" ADD CONSTRAINT "revenue_entries_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "parcels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "revenue_entries" ADD CONSTRAINT "revenue_entries_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "revenue_entries" ADD CONSTRAINT "revenue_entries_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "revenue_entries" ADD CONSTRAINT "revenue_entries_void_approved_by_id_fkey" FOREIGN KEY ("void_approved_by_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "fee_rules" ADD CONSTRAINT "fee_rules_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "fee_rules" ADD CONSTRAINT "fee_rules_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "daily_reconciliation_summaries" ADD CONSTRAINT "daily_reconciliation_summaries_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sms_logs" ADD CONSTRAINT "sms_logs_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "parcels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
