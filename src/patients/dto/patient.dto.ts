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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DocumentType { DNI = 'DNI', CE = 'CE', PASAPORTE = 'PASAPORTE', RUC = 'RUC' }
export enum Gender { M = 'M', F = 'F', OTRO = 'OTRO' }
export enum BloodType { AP = 'A+', AN = 'A-', BP = 'B+', BN = 'B-', ABP = 'AB+', ABN = 'AB-', OP = 'O+', ON = 'O-' }

export class CreatePatientDto {
  @ApiProperty({ enum: DocumentType, example: DocumentType.DNI, description: 'Tipo de documento de identidad' })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({ example: '12345678', description: 'Número de documento (8-20 caracteres alfanuméricos)' })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/^[0-9A-Za-z-]+$/)
  documentNumber: string;

  @ApiProperty({ example: 'María', description: 'Nombres del paciente' })
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @ApiProperty({ example: 'García López', description: 'Apellidos del paciente' })
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @ApiProperty({ example: '1990-05-15', description: 'Fecha de nacimiento (YYYY-MM-DD)' })
  @IsDateString()
  birthDate: string;

  @ApiProperty({ enum: Gender, example: Gender.F, description: 'Sexo biológico' })
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({ example: '987654321', description: 'Teléfono de contacto' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'maria@email.com', description: 'Correo electrónico' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: 'Av. Universitaria 1234', description: 'Dirección del paciente' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ example: 'San Miguel', description: 'Distrito de residencia' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @ApiPropertyOptional({ enum: BloodType, example: 'O+', description: 'Grupo sanguíneo' })
  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: string;

  @ApiPropertyOptional({ example: 'Penicilina, Aspirina', description: 'Alergias conocidas' })
  @IsOptional()
  @IsString()
  allergies?: string;

  @ApiPropertyOptional({ example: 'Diabetes tipo 2, Hipertensión', description: 'Condiciones crónicas' })
  @IsOptional()
  @IsString()
  chronicConditions?: string;

  @ApiPropertyOptional({ example: 'Carlos García', description: 'Nombre del contacto de emergencia' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  emergencyContactName?: string;

  @ApiPropertyOptional({ example: '956789012', description: 'Teléfono del contacto de emergencia' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  emergencyContactPhone?: string;
}

export class UpdatePatientDto {
  @ApiPropertyOptional({ example: '987654321' }) @IsOptional() @IsString() @MaxLength(20) phone?: string;
  @ApiPropertyOptional({ example: 'nuevo@email.com' }) @IsOptional() @IsEmail() @MaxLength(255) email?: string;
  @ApiPropertyOptional({ example: 'Jr. Lima 456' }) @IsOptional() @IsString() @MaxLength(500) address?: string;
  @ApiPropertyOptional({ example: 'Miraflores' }) @IsOptional() @IsString() @MaxLength(100) district?: string;
  @ApiPropertyOptional({ enum: BloodType }) @IsOptional() @IsEnum(BloodType) bloodType?: string;
  @ApiPropertyOptional({ example: 'Ibuprofeno' }) @IsOptional() @IsString() allergies?: string;
  @ApiPropertyOptional({ example: 'Asma' }) @IsOptional() @IsString() chronicConditions?: string;
  @ApiPropertyOptional({ example: 'Ana García' }) @IsOptional() @IsString() @MaxLength(200) emergencyContactName?: string;
  @ApiPropertyOptional({ example: '912345678' }) @IsOptional() @IsString() @MaxLength(20) emergencyContactPhone?: string;
}
