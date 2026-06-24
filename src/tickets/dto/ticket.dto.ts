import { IsEnum, IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TicketType { EMERGENCY = 'emergency', OUTPATIENT = 'outpatient' }
export enum TicketPriority { IMMEDIATE = 'immediate', VERY_URGENT = 'very_urgent', URGENT = 'urgent', NORMAL = 'normal', NON_URGENT = 'non_urgent' }
export enum TicketStatus { WAITING = 'waiting', CALLED = 'called', IN_ATTENTION = 'in_attention', FINISHED = 'finished', CANCELLED = 'cancelled', NO_SHOW = 'no_show' }

export class CreateTicketDto {
  @ApiProperty({ example: 'uuid-del-paciente', description: 'UUID del paciente' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ enum: TicketType, example: TicketType.OUTPATIENT, description: 'Tipo de atención: emergencia o consulta externa' })
  @IsEnum(TicketType)
  type: TicketType;

  @ApiPropertyOptional({ enum: TicketPriority, example: TicketPriority.NORMAL, description: 'Prioridad de atención (triage)' })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({ example: 'Paciente con fiebre alta y dificultad respiratoria', description: 'Notas del triage inicial' })
  @IsOptional()
  @IsString()
  triageNotes?: string;

  @ApiPropertyOptional({ example: 'Consultorio 3', description: 'Módulo o consultorio de atención', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  module?: string;
}

export class UpdateTicketStatusDto {
  @ApiProperty({ enum: TicketStatus, example: TicketStatus.CALLED, description: 'Nuevo estado del ticket' })
  @IsEnum(TicketStatus)
  status: TicketStatus;

  @ApiPropertyOptional({ example: 'Paciente llamado al consultorio 3', description: 'Notas del cambio de estado' })
  @IsOptional()
  @IsString()
  notes?: string;
}
