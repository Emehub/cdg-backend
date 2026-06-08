import { IsString, IsEnum, MinLength, IsOptional } from 'class-validator';
import { StaffRole } from '../../../common/enums/staff-role.enum';

export class CreateStaffDto {
  @IsString()
  staffCode: string;

  @IsString()
  username: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(3)
  fullName: string;

  @IsEnum(StaffRole)
  role: StaffRole;

  @IsString()
  branchId: string;

  @IsOptional()
  @IsString()
  terminalNumber?: string;
}
