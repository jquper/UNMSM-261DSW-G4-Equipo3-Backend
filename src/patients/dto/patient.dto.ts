import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsEmail,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum DocumentType { DNI = 'DNI', CE = 'CE', PASAPORTE = 'PASAPORTE', RUC = 'RUC' }
export enum Gender { M = 'M', F = 'F', OTRO = 'OTRO' }
export enum BloodType { AP = 'A+', AN = 'A-', BP = 'B+', BN = 'B-', ABP = 'AB+', ABN = 'AB-', OP = 'O+', ON = 'O-' }

export class CreatePatientDto {
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/^[0-9A-Za-z-]+$/)
  documentNumber: string;

  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @IsDateString()
  birthDate: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  chronicConditions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  emergencyContactPhone?: string;
}

export class UpdatePatientDto {
  @IsOptional() @IsString() @MaxLength(20) phone?: string;
  @IsOptional() @IsEmail() @MaxLength(255) email?: string;
  @IsOptional() @IsString() @MaxLength(500) address?: string;
  @IsOptional() @IsString() @MaxLength(100) district?: string;
  @IsOptional() @IsEnum(BloodType) bloodType?: string;
  @IsOptional() @IsString() allergies?: string;
  @IsOptional() @IsString() chronicConditions?: string;
  @IsOptional() @IsString() @MaxLength(200) emergencyContactName?: string;
  @IsOptional() @IsString() @MaxLength(20) emergencyContactPhone?: string;
}
