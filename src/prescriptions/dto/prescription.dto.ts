import { IsUUID, IsString, IsOptional, IsEnum, IsInt, Min, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class PrescriptionItemDto {
  @IsString() medication: string;
  @IsOptional() @IsString() genericName?: string;
  @IsOptional() @IsString() presentation?: string;
  @IsString() dose: string;
  @IsString() frequency: string;
  @IsString() duration: string;
  @IsInt() @Min(1) quantity: number;
  @IsOptional() @IsString() route?: string;
  @IsOptional() @IsString() instructions?: string;
}

export class CreatePrescriptionDto {
  @IsUUID() medicalRecordId: string;
  @IsUUID() patientId: string;
  @IsUUID() doctorId: string;
  @IsString() prescriptionDate: string;
  @IsOptional() @IsString() notes?: string;

  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  @ArrayMinSize(1)
  items: PrescriptionItemDto[];
}

export class UpdatePrescriptionStatusDto {
  @IsEnum(['active', 'dispensed', 'expired', 'cancelled'])
  status: string;
}
