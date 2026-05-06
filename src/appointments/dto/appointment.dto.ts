import { IsUUID, IsDateString, IsString, IsOptional, IsEnum, IsInt, Min, Max, IsDecimal } from 'class-validator';

export enum AppointmentStatus {
  SCHEDULED = 'scheduled', CONFIRMED = 'confirmed', IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed', CANCELLED = 'cancelled', NO_SHOW = 'no_show',
}

export class CreateAppointmentDto {
  @IsUUID() patientId: string;
  @IsUUID() doctorId: string;
  @IsUUID() specialtyId: string;
  @IsOptional() @IsUUID() ticketId?: string;
  @IsDateString() appointmentDate: string;
  @IsString() appointmentTime: string;
  @IsOptional() @IsInt() @Min(10) @Max(120) durationMinutes?: number;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsDecimal() fee?: string;
}

export class UpdateAppointmentDto {
  @IsOptional() @IsDateString() appointmentDate?: string;
  @IsOptional() @IsString() appointmentTime?: string;
  @IsOptional() @IsEnum(AppointmentStatus) status?: AppointmentStatus;
  @IsOptional() @IsString() notes?: string;
}
