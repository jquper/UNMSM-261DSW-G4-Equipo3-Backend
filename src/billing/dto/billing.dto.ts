import { IsUUID, IsString, IsEnum, IsOptional, IsDecimal } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TransactionType { CHARGE = 'charge', PAYMENT = 'payment', REFUND = 'refund' }

export class CreateTransactionDto {
  @ApiProperty({ example: 'uuid-del-paciente', description: 'UUID del paciente' })
  @IsUUID() patientId: string;

  @ApiProperty({ enum: TransactionType, example: TransactionType.CHARGE, description: 'Tipo de transacción' })
  @IsEnum(TransactionType) type: TransactionType;

  @ApiProperty({ example: '150.00', description: 'Monto de la transacción (decimal como string)' })
  @IsDecimal() amount: string;

  @ApiProperty({ example: 'Consulta médica - Cardiología', description: 'Descripción del cobro o pago' })
  @IsString() description: string;

  @ApiPropertyOptional({ example: 'appointment', description: 'Tipo de referencia (appointment, prescription, emergency)' })
  @IsOptional() @IsString() referenceType?: string;

  @ApiPropertyOptional({ example: 'uuid-de-la-cita', description: 'UUID del recurso referenciado' })
  @IsOptional() @IsUUID() referenceId?: string;
}

export class PayTransactionDto {
  @ApiPropertyOptional({ example: 'REC-2026-001', description: 'Número de recibo (se genera automáticamente si no se proporciona)' })
  @IsOptional() @IsString() receiptNumber?: string;
}

export class PayAllDto {
  @ApiPropertyOptional({ example: 'REC-2026-100', description: 'Número de recibo global' })
  @IsOptional() @IsString() receiptNumber?: string;

  @ApiPropertyOptional({ example: 'cash', description: 'Método de pago (cash, card, transfer)' })
  @IsOptional() @IsString() paymentMethod?: string;
}
