import { IsEnum, IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';

export enum TicketType { EMERGENCY = 'emergency', OUTPATIENT = 'outpatient' }
export enum TicketPriority { IMMEDIATE = 'immediate', VERY_URGENT = 'very_urgent', URGENT = 'urgent', NORMAL = 'normal', NON_URGENT = 'non_urgent' }
export enum TicketStatus { WAITING = 'waiting', CALLED = 'called', IN_ATTENTION = 'in_attention', FINISHED = 'finished', CANCELLED = 'cancelled', NO_SHOW = 'no_show' }

export class CreateTicketDto {
  @IsUUID()
  patientId: string;

  @IsEnum(TicketType)
  type: TicketType;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsString()
  triageNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  module?: string;
}

export class UpdateTicketStatusDto {
  @IsEnum(TicketStatus)
  status: TicketStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
