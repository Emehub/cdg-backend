import {
  IsString,
  IsEnum,
  IsNumber,
  IsPositive,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ParcelType } from '../../../common/enums/parcel-type.enum';

export class CreateParcelDto {
  @IsString()
  @MinLength(3)
  senderFullName: string;

  @IsString()
  senderPhone: string;

  @IsString()
  @MinLength(3)
  receiverFullName: string;

  @IsString()
  receiverPhone: string;

  @IsString()
  destinationBranchId: string;

  @IsEnum(ParcelType)
  parcelType: ParcelType;

  @IsString()
  @MinLength(5)
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  proposedFee: number;
}
