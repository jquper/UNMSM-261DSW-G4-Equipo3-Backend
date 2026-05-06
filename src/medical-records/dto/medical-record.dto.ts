import { IsUUID, IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class CreateMedicalRecordDto {
  @IsUUID() patientId: string;
  @IsUUID() doctorId: string;
  @IsOptional() @IsUUID() appointmentId?: string;
  @IsOptional() @IsUUID() emergencyId?: string;
  @IsOptional() @IsString() anamnesis?: string;
  @IsOptional() @IsString() physicalExam?: string;
  @IsString() diagnosis: string;
  @IsOptional() @IsString() @MaxLength(10) diagnosisCie10?: string;
  @IsOptional() @IsString() treatment?: string;
  @IsOptional() @IsString() indications?: string;
  @IsOptional() @IsString() labOrders?: string;
  @IsOptional() @IsString() imagingOrders?: string;
  @IsOptional() @IsDateString() followUpDate?: string;
  @IsOptional() @IsString() followUpNotes?: string;
}

export class UpdateMedicalRecordDto {
  @IsOptional() @IsString() anamnesis?: string;
  @IsOptional() @IsString() physicalExam?: string;
  @IsOptional() @IsString() diagnosis?: string;
  @IsOptional() @IsString() @MaxLength(10) diagnosisCie10?: string;
  @IsOptional() @IsString() treatment?: string;
  @IsOptional() @IsString() indications?: string;
  @IsOptional() @IsString() labOrders?: string;
  @IsOptional() @IsString() imagingOrders?: string;
  @IsOptional() @IsDateString() followUpDate?: string;
  @IsOptional() @IsString() followUpNotes?: string;
}
