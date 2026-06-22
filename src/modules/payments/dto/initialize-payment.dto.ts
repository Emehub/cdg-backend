import {
  IsEnum,
  IsNumber,
  IsPositive,
  IsString,
  IsOptional,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../../common/enums/payment-method.enum';

export class InitializePaymentDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  amountPaid: number;

  // Required for MoMo
  @ValidateIf((o) => o.paymentMethod === PaymentMethod.MOMO)
  @IsString()
  phone: string;

  @ValidateIf((o) => o.paymentMethod === PaymentMethod.MOMO)
  @IsEnum(['mtn', 'vod', 'tgo'])
  network: 'mtn' | 'vod' | 'tgo';

  // Optional for card — falls back to a derived address if absent
  @IsOptional()
  @IsString()
  email?: string;
}
