import { IsUUID, IsInt, IsString, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EmergencyStatus {
  ACTIVE = 'active', IN_TREATMENT = 'in_treatment', OBSERVATION = 'observation',
  DISCHARGED = 'discharged', TRANSFERRED = 'transferred', DECEASED = 'deceased',
}

export class CreateEmergencyDto {
  @ApiProperty({ example: 'uuid-del-paciente', description: 'UUID del paciente que ingresa a emergencias' })
  @IsUUID() patientId: string;

  @ApiPropertyOptional({ example: 'uuid-del-ticket', description: 'UUID del ticket de triage asociado' })
  @IsOptional() @IsUUID() ticketId?: string;

  @ApiPropertyOptional({ example: 'uuid-del-medico', description: 'UUID del médico asignado' })
  @IsOptional() @IsUUID() doctorId?: string;

  @ApiProperty({ example: 1, description: 'Nivel de triage (1=Inmediato, 2=Muy urgente, 3=Urgente, 4=Normal, 5=No urgente)', minimum: 1, maximum: 5 })
  @IsInt() @Min(1) @Max(5) triageLevel: number;

  @ApiProperty({ example: 'Dolor torácico intenso irradiado al brazo izquierdo', description: 'Motivo principal de consulta de emergencia' })
  @IsString() chiefComplaint: string;

  @ApiPropertyOptional({ description: 'Signos vitales en formato JSON', example: { bp: '120/80', hr: 90, temp: 37.2, spo2: 98 } })
  @IsOptional() vitalSigns?: Record<string, any>;

  @ApiPropertyOptional({ example: 'Sala 3 - Cama A', description: 'Cama o sala asignada' })
  @IsOptional() @IsString() bed?: string;
}

export class UpdateEmergencyDto {
  @ApiPropertyOptional({ example: 'uuid-del-medico', description: 'Reasignar médico' })
  @IsOptional() @IsUUID() doctorId?: string;

  @ApiPropertyOptional({ enum: EmergencyStatus, example: EmergencyStatus.IN_TREATMENT, description: 'Nuevo estado de la emergencia' })
  @IsOptional() @IsEnum(EmergencyStatus) status?: EmergencyStatus;

  @ApiPropertyOptional({ description: 'Actualización de signos vitales', example: { bp: '130/85', hr: 88, temp: 37.5, spo2: 97 } })
  @IsOptional() vitalSigns?: Record<string, any>;

  @ApiPropertyOptional({ example: 'Sala 5 - Cama B' })
  @IsOptional() @IsString() bed?: string;

  @ApiPropertyOptional({ example: 'Alta voluntaria', description: 'Tipo de alta médica' })
  @IsOptional() @IsString() dischargeType?: string;

  @ApiPropertyOptional({ example: 'Paciente estable, indicaciones de seguimiento en consultorio', description: 'Notas de alta' })
  @IsOptional() @IsString() dischargeNotes?: string;
}
