import { IsUUID, IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMedicalRecordDto {
  @ApiProperty({ example: 'uuid-del-paciente', description: 'UUID del paciente' })
  @IsUUID() patientId: string;

  @ApiProperty({ example: 'uuid-del-medico', description: 'UUID del médico que elabora el historial' })
  @IsUUID() doctorId: string;

  @ApiPropertyOptional({ example: 'uuid-de-cita', description: 'UUID de la cita asociada (opcional)' })
  @IsOptional() @IsUUID() appointmentId?: string;

  @ApiPropertyOptional({ example: 'uuid-de-emergencia', description: 'UUID de la emergencia asociada (opcional)' })
  @IsOptional() @IsUUID() emergencyId?: string;

  @ApiPropertyOptional({ example: 'Paciente refiere dolor abdominal de 3 días de evolución', description: 'Anamnesis' })
  @IsOptional() @IsString() anamnesis?: string;

  @ApiPropertyOptional({ example: 'Abdomen blando, doloroso a la palpación en FID', description: 'Examen físico' })
  @IsOptional() @IsString() physicalExam?: string;

  @ApiProperty({ example: 'Apendicitis aguda', description: 'Diagnóstico principal' })
  @IsString() diagnosis: string;

  @ApiPropertyOptional({ example: 'K35.2', description: 'Código CIE-10 del diagnóstico', maxLength: 10 })
  @IsOptional() @IsString() @MaxLength(10) diagnosisCie10?: string;

  @ApiPropertyOptional({ example: 'Apendicectomía laparoscópica', description: 'Tratamiento indicado' })
  @IsOptional() @IsString() treatment?: string;

  @ApiPropertyOptional({ example: 'Reposo absoluto, dieta blanda', description: 'Indicaciones para el paciente' })
  @IsOptional() @IsString() indications?: string;

  @ApiPropertyOptional({ example: 'Hemograma completo, PCR', description: 'Órdenes de laboratorio' })
  @IsOptional() @IsString() labOrders?: string;

  @ApiPropertyOptional({ example: 'Ecografía abdominal', description: 'Órdenes de imágenes' })
  @IsOptional() @IsString() imagingOrders?: string;

  @ApiPropertyOptional({ example: '2026-07-01', description: 'Fecha de seguimiento (YYYY-MM-DD)' })
  @IsOptional() @IsDateString() followUpDate?: string;

  @ApiPropertyOptional({ example: 'Control post-operatorio en 7 días', description: 'Notas de seguimiento' })
  @IsOptional() @IsString() followUpNotes?: string;
}

export class UpdateMedicalRecordDto {
  @ApiPropertyOptional({ example: 'Actualización de anamnesis' })
  @IsOptional() @IsString() anamnesis?: string;

  @ApiPropertyOptional({ example: 'Herida quirúrgica en buenas condiciones' })
  @IsOptional() @IsString() physicalExam?: string;

  @ApiPropertyOptional({ example: 'Post-operatorio apendicectomía' })
  @IsOptional() @IsString() diagnosis?: string;

  @ApiPropertyOptional({ example: 'Z09' })
  @IsOptional() @IsString() @MaxLength(10) diagnosisCie10?: string;

  @ApiPropertyOptional({ example: 'Analgesia oral' })
  @IsOptional() @IsString() treatment?: string;

  @ApiPropertyOptional({ example: 'Dieta normal, actividad progresiva' })
  @IsOptional() @IsString() indications?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() labOrders?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() imagingOrders?: string;

  @ApiPropertyOptional({ example: '2026-07-15' })
  @IsOptional() @IsDateString() followUpDate?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() followUpNotes?: string;
}
