import { IsString, IsUUID, IsOptional, IsInt, IsDecimal, Min, MaxLength, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInventoryItemDto {
  @ApiProperty({ example: 'Paracetamol 500mg', description: 'Nombre comercial del medicamento' })
  @IsString() @MaxLength(255)
  medicationName: string;

  @ApiPropertyOptional({ example: 'Acetaminofén', description: 'Nombre genérico' })
  @IsOptional() @IsString() @MaxLength(255)
  genericName?: string;

  @ApiPropertyOptional({ example: 'Tabletas', description: 'Forma farmacéutica' })
  @IsOptional() @IsString() @MaxLength(100)
  presentation?: string;

  @ApiPropertyOptional({ example: '500mg', description: 'Concentración' })
  @IsOptional() @IsString() @MaxLength(100)
  concentration?: string;

  @ApiPropertyOptional({ example: 'Laboratorio XYZ', description: 'Laboratorio fabricante' })
  @IsOptional() @IsString() @MaxLength(255)
  laboratoryName?: string;

  @ApiProperty({ example: 100, description: 'Stock inicial en unidades' })
  @IsInt() @Min(0)
  stock: number;

  @ApiPropertyOptional({ example: 10, description: 'Stock mínimo para alerta' })
  @IsOptional() @IsInt() @Min(0)
  minStock?: number;

  @ApiProperty({ example: '5.50', description: 'Precio unitario (decimal como string)' })
  @IsDecimal()
  unitPrice: string;

  @ApiPropertyOptional({ example: '2027-12-31', description: 'Fecha de vencimiento' })
  @IsOptional() @IsDateString()
  expirationDate?: string;

  @ApiPropertyOptional({ example: 'LOT-2024-001', description: 'Número de lote' })
  @IsOptional() @IsString() @MaxLength(50)
  lotNumber?: string;

  @ApiPropertyOptional({ example: 'Estante A-3', description: 'Ubicación en almacén' })
  @IsOptional() @IsString() @MaxLength(100)
  location?: string;
}

export class UpdateInventoryItemDto {
  @ApiPropertyOptional({ example: 150, description: 'Nuevo stock total' })
  @IsOptional() @IsInt() @Min(0)
  stock?: number;

  @ApiPropertyOptional({ example: '6.00', description: 'Nuevo precio unitario' })
  @IsOptional() @IsDecimal()
  unitPrice?: string;

  @ApiPropertyOptional({ example: 10, description: 'Nuevo stock mínimo' })
  @IsOptional() @IsInt() @Min(0)
  minStock?: number;

  @ApiPropertyOptional({ example: '2028-06-30' })
  @IsOptional() @IsDateString()
  expirationDate?: string;

  @ApiPropertyOptional({ example: 'LOT-2025-002' })
  @IsOptional() @IsString() @MaxLength(50)
  lotNumber?: string;

  @ApiPropertyOptional({ example: 'Estante B-1' })
  @IsOptional() @IsString() @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isActive?: boolean;
}

export class AdjustStockDto {
  @ApiProperty({ example: 50, description: 'Cantidad a sumar (positivo) o restar (negativo)' })
  @IsInt()
  quantity: number;

  @ApiPropertyOptional({ example: 'Ajuste por inventario físico', description: 'Motivo del ajuste' })
  @IsOptional() @IsString()
  reason?: string;
}

export class DispenseItemDto {
  @ApiProperty({ example: 'uuid-del-item-de-inventario', description: 'UUID del medicamento en inventario' })
  @IsUUID()
  inventoryId: string;

  @ApiProperty({ example: 2, description: 'Cantidad a dispensar' })
  @IsInt() @Min(1)
  quantity: number;
}

export class DispensePrescriptionDto {
  @ApiProperty({ example: 'uuid-de-la-prescripcion', description: 'UUID de la prescripción a despachar' })
  @IsUUID()
  prescriptionId: string;

  @ApiProperty({ type: [DispenseItemDto], description: 'Medicamentos a dispensar con sus cantidades' })
  items: DispenseItemDto[];

  @ApiPropertyOptional({ example: 'Dispensado parcialmente por falta de stock', description: 'Notas adicionales' })
  @IsOptional() @IsString()
  notes?: string;
}
