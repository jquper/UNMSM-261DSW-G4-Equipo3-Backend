import { IsString, IsUUID, IsOptional, IsDecimal, MaxLength, IsBoolean } from 'class-validator';

export class CreateDoctorDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  specialtyId: string;

  @IsString()
  @MaxLength(20)
  cmp: string;

  @IsOptional()
  @IsDecimal()
  consultationFee?: string;

  @IsOptional()
  schedule?: Record<string, any>;
}

export class UpdateDoctorDto {
  @IsOptional() @IsUUID() specialtyId?: string;
  @IsOptional() @IsDecimal() consultationFee?: string;
  @IsOptional() schedule?: Record<string, any>;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
