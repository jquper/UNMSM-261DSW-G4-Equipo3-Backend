import { IsUUID, IsInt, IsString, IsOptional, IsEnum, Min, Max } from 'class-validator';

export enum EmergencyStatus {
  ACTIVE = 'active', IN_TREATMENT = 'in_treatment', OBSERVATION = 'observation',
  DISCHARGED = 'discharged', TRANSFERRED = 'transferred', DECEASED = 'deceased',
}

export class CreateEmergencyDto {
  @IsUUID() patientId: string;
  @IsUUID() ticketId: string;
  @IsOptional() @IsUUID() doctorId?: string;
  @IsInt() @Min(1) @Max(5) triageLevel: number;
  @IsString() chiefComplaint: string;
  @IsOptional() vitalSigns?: Record<string, any>;
  @IsOptional() @IsString() bed?: string;
}

export class UpdateEmergencyDto {
  @IsOptional() @IsUUID() doctorId?: string;
  @IsOptional() @IsEnum(EmergencyStatus) status?: EmergencyStatus;
  @IsOptional() vitalSigns?: Record<string, any>;
  @IsOptional() @IsString() bed?: string;
  @IsOptional() @IsString() dischargeType?: string;
  @IsOptional() @IsString() dischargeNotes?: string;
}
