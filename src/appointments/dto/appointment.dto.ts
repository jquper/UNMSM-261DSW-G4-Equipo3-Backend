import { IsUUID, IsDateString, IsString, IsOptional, IsEnum, IsInt, Min, Max, IsDecimal } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AppointmentStatus {
  SCHEDULED = 'scheduled', CONFIRMED = 'confirmed', IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed', CANCELLED = 'cancelled', NO_SHOW = 'no_show',
}

export class CreateAppointmentDto {
  @ApiProperty({ example: 'uuid-del-paciente', description: 'UUID del paciente' })
  @IsUUID() patientId: string;

  @ApiProperty({ example: 'uuid-del-medico', description: 'UUID del médico' })
  @IsUUID() doctorId: string;

  @ApiProperty({ example: 'uuid-de-especialidad', description: 'UUID de la especialidad' })
  @IsUUID() specialtyId: string;

  @ApiPropertyOptional({ example: 'uuid-del-ticket', description: 'UUID del ticket de cola asociado' })
  @IsOptional() @IsUUID() ticketId?: string;

  @ApiProperty({ example: '2026-06-25', description: 'Fecha de la cita (YYYY-MM-DD)' })
  @IsDateString() appointmentDate: string;

  @ApiProperty({ example: '09:00', description: 'Hora de la cita (HH:mm)' })
  @IsString() appointmentTime: string;

  @ApiPropertyOptional({ example: 30, description: 'Duración en minutos (10-120)', minimum: 10, maximum: 120 })
  @IsOptional() @IsInt() @Min(10) @Max(120) durationMinutes?: number;

  @ApiPropertyOptional({ example: 'Dolor de cabeza persistente', description: 'Motivo de la consulta' })
  @IsOptional() @IsString() reason?: string;

  @ApiPropertyOptional({ example: '150.00', description: 'Tarifa de la consulta' })
  @IsOptional() @IsDecimal() fee?: string;
}

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ example: '2026-06-26', description: 'Nueva fecha de la cita' })
  @IsOptional() @IsDateString() appointmentDate?: string;

  @ApiPropertyOptional({ example: '10:30', description: 'Nueva hora de la cita' })
  @IsOptional() @IsString() appointmentTime?: string;

  @ApiPropertyOptional({ enum: AppointmentStatus, description: 'Nuevo estado de la cita' })
  @IsOptional() @IsEnum(AppointmentStatus) status?: AppointmentStatus;

  @ApiPropertyOptional({ example: 'Paciente atendido correctamente', description: 'Notas de la cita' })
  @IsOptional() @IsString() notes?: string;
}
