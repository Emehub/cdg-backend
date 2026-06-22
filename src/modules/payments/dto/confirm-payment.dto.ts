import { IsEnum, IsNumber, IsPositive, IsString, IsOptional, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../../common/enums/payment-method.enum';

export class ConfirmPaymentDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  amountPaid: number;

  @ValidateIf((o) => o.paymentMethod !== PaymentMethod.CASH)
  @IsString()
  paymentReference: string;

  @IsOptional()
  @IsString()
  momoNetwork?: string;
}
