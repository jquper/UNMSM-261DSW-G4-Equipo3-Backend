import { IsString, IsUUID, IsOptional, IsDecimal, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OpenCashRegisterDto {
  @ApiProperty({ example: 'Caja 01', description: 'Nombre o identificador de la caja' })
  @IsString() @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: '500.00', description: 'Saldo inicial de apertura (efectivo en caja)' })
  @IsOptional() @IsDecimal()
  openingBalance?: string;

  @ApiPropertyOptional({ example: 'Apertura turno mañana', description: 'Notas de apertura' })
  @IsOptional() @IsString()
  notes?: string;
}

export class CloseCashRegisterDto {
  @ApiProperty({ example: '1250.00', description: 'Saldo físico al cierre (contado en caja)' })
  @IsDecimal()
  closingBalance: string;

  @ApiPropertyOptional({ example: 'Sin incidencias durante el turno', description: 'Notas de cierre' })
  @IsOptional() @IsString()
  notes?: string;
}

export class CollectPaymentDto {
  @ApiProperty({ example: 'uuid-de-la-transaccion', description: 'UUID de la transacción de facturación a cobrar' })
  @IsUUID()
  transactionId: string;

  @ApiProperty({ example: 'cash', enum: ['cash', 'card', 'electronic_wallet', 'transfer'], description: 'Método de pago' })
  @IsEnum(['cash', 'card', 'electronic_wallet', 'transfer'])
  paymentMethod: string;

  @ApiProperty({ example: 'boleta', enum: ['boleta', 'factura'], description: 'Tipo de comprobante a emitir' })
  @IsEnum(['boleta', 'factura'])
  receiptType: string;

  @ApiProperty({ example: '200.00', description: 'Monto recibido del paciente' })
  @IsDecimal()
  amountPaid: string;
}

export class UpdateReceiptSeriesDto {
  @ApiPropertyOptional({ example: 'B001', description: 'Prefijo de la serie (ej. B001, F001)' })
  @IsOptional() @IsString() @MaxLength(10)
  prefix?: string;

  @ApiPropertyOptional({ example: 100, description: 'Número inicial de la serie' })
  @IsOptional()
  currentNumber?: number;

  @ApiPropertyOptional({ example: true, description: 'Si la serie está activa' })
  @IsOptional()
  isActive?: boolean;
}

export class CreateReceiptSeriesDto {
  @ApiProperty({ example: 'boleta', enum: ['boleta', 'factura'], description: 'Tipo de comprobante' })
  @IsEnum(['boleta', 'factura'])
  type: string;

  @ApiProperty({ example: 'B001', description: 'Prefijo de la serie' })
  @IsString() @MaxLength(10)
  prefix: string;

  @ApiPropertyOptional({ example: 0, description: 'Número inicial (se autoincrementa con cada emisión)' })
  @IsOptional()
  currentNumber?: number;
}
