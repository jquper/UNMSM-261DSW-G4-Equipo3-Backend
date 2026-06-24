import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSpecialtyDto {
  @ApiProperty({ example: 'Cardiología', description: 'Nombre de la especialidad médica' })
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiPropertyOptional({ example: 'Especialidad dedicada al estudio y tratamiento del corazón', description: 'Descripción de la especialidad' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '#E53E3E', description: 'Color en formato hexadecimal (#RRGGBB)' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color debe ser hex válido (#RRGGBB)' })
  color?: string;
}

export class UpdateSpecialtyDto {
  @ApiPropertyOptional({ example: 'Neurología' })
  @IsOptional() @IsString() @MaxLength(100) name?: string;

  @ApiPropertyOptional({ example: 'Especialidad del sistema nervioso' })
  @IsOptional() @IsString() description?: string;

  @ApiPropertyOptional({ example: '#3182CE' })
  @IsOptional() @IsString() @Matches(/^#[0-9A-Fa-f]{6}$/) color?: string;
}
