import {
  IsString,
  IsEnum,
  IsNumber,
  IsPositive,
  MinLength,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ParcelType } from '../../../common/enums/parcel-type.enum';

export class UpdateParcelDraftDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  senderFullName?: string;

  @IsOptional()
  @IsString()
  senderPhone?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  receiverFullName?: string;

  @IsOptional()
  @IsString()
  receiverPhone?: string;

  @IsOptional()
  @IsString()
  destinationBranchId?: string;

  @IsOptional()
  @IsEnum(ParcelType)
  parcelType?: ParcelType;

  @IsOptional()
  @IsString()
  @MinLength(5)
  description?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  proposedFee?: number;
}
