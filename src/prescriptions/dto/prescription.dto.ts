import { IsUUID, IsString, IsOptional, IsEnum, IsInt, Min, ValidateNested, ArrayMinSize, IsDecimal } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PrescriptionItemDto {
  @ApiProperty({ example: 'Amoxicilina', description: 'Nombre comercial del medicamento' })
  @IsString() medication: string;

  @ApiPropertyOptional({ example: 'Amoxicilina trihidrato', description: 'Nombre genérico del medicamento' })
  @IsOptional() @IsString() genericName?: string;

  @ApiPropertyOptional({ example: 'Tabletas 500mg', description: 'Presentación del medicamento' })
  @IsOptional() @IsString() presentation?: string;

  @ApiProperty({ example: '500mg', description: 'Dosis indicada' })
  @IsString() dose: string;

  @ApiProperty({ example: 'Cada 8 horas', description: 'Frecuencia de administración' })
  @IsString() frequency: string;

  @ApiProperty({ example: '7 días', description: 'Duración del tratamiento' })
  @IsString() duration: string;

  @ApiProperty({ example: 21, description: 'Cantidad de unidades a dispensar', minimum: 1 })
  @IsInt() @Min(1) quantity: number;

  @ApiPropertyOptional({ example: 'Oral', description: 'Vía de administración' })
  @IsOptional() @IsString() route?: string;

  @ApiPropertyOptional({ example: 'Tomar con alimentos', description: 'Instrucciones adicionales' })
  @IsOptional() @IsString() instructions?: string;
}

export class CreatePrescriptionDto {
  @ApiProperty({ example: 'uuid-del-historial', description: 'UUID del historial clínico asociado' })
  @IsUUID() medicalRecordId: string;

  @ApiProperty({ example: 'uuid-del-paciente', description: 'UUID del paciente' })
  @IsUUID() patientId: string;

  @ApiProperty({ example: 'uuid-del-medico', description: 'UUID del médico prescriptor' })
  @IsUUID() doctorId: string;

  @ApiProperty({ example: '2026-06-24', description: 'Fecha de emisión de la receta' })
  @IsString() prescriptionDate: string;

  @ApiPropertyOptional({ example: 'Completar el tratamiento completo', description: 'Notas generales de la receta' })
  @IsOptional() @IsString() notes?: string;

  @ApiProperty({ type: [PrescriptionItemDto], description: 'Lista de medicamentos recetados (mínimo 1)' })
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  @ArrayMinSize(1)
  items: PrescriptionItemDto[];
}

export class UpdatePrescriptionStatusDto {
  @ApiProperty({ enum: ['active', 'dispensed', 'expired', 'cancelled'], example: 'dispensed', description: 'Nuevo estado de la receta' })
  @IsEnum(['active', 'dispensed', 'expired', 'cancelled'])
  status: string;

  @ApiPropertyOptional({ example: '75.50', description: 'Monto total cobrado al dispensar' })
  @IsOptional()
  @IsDecimal()
  totalAmount?: string;
}
