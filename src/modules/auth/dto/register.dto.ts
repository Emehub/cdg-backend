import { IsString, IsEnum, MinLength, IsOptional } from 'class-validator';
import { StaffRole } from '../../../common/enums/staff-role.enum';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  fullName: string;

  @IsString()
  username: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(StaffRole)
  @IsOptional()
  role?: StaffRole;

  @IsString()
  branchId: string;

  @IsOptional()
  @IsString()
  terminalNumber?: string;
}
