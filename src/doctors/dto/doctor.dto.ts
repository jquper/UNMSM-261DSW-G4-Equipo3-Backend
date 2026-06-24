import { IsString, IsUUID, IsOptional, IsDecimal, MaxLength, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DoctorAvailability {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFF_DUTY = 'off_duty',
}

export class CreateDoctorDto {
  @ApiProperty({ example: 'uuid-del-usuario', description: 'UUID del usuario asociado al médico' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'uuid-de-especialidad', description: 'UUID de la especialidad médica' })
  @IsUUID()
  specialtyId: string;

  @ApiProperty({ example: 'CMP-12345', description: 'Número de colegiatura médica (CMP)' })
  @IsString()
  @MaxLength(20)
  cmp: string;

  @ApiPropertyOptional({ example: '150.00', description: 'Tarifa de consulta (decimal como string)' })
  @IsOptional()
  @IsDecimal()
  consultationFee?: string;

  @ApiPropertyOptional({ description: 'Horario de atención en formato JSON', example: { lunes: ['08:00', '12:00'], martes: ['08:00', '12:00'] } })
  @IsOptional()
  schedule?: Record<string, any>;
}

export class UpdateDoctorDto {
  @ApiPropertyOptional({ example: 'uuid-de-especialidad' })
  @IsOptional() @IsUUID() specialtyId?: string;

  @ApiPropertyOptional({ example: '200.00' })
  @IsOptional() @IsDecimal() consultationFee?: string;

  @ApiPropertyOptional({ description: 'Horario actualizado en formato JSON' })
  @IsOptional() schedule?: Record<string, any>;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateAvailabilityDto {
  @ApiProperty({ enum: DoctorAvailability, example: DoctorAvailability.BUSY, description: 'Nuevo estado de disponibilidad' })
  @IsEnum(DoctorAvailability)
  availabilityStatus: DoctorAvailability;

  @ApiPropertyOptional({ example: false, description: 'Si el médico está disponible para nuevas citas' })
  @IsOptional() @IsBoolean()
  isAvailable?: boolean;
}
