import { IsUUID, IsString, IsEnum, IsOptional, IsDecimal } from 'class-validator';

export enum TransactionType { CHARGE = 'charge', PAYMENT = 'payment', REFUND = 'refund' }

export class CreateTransactionDto {
  @IsUUID() patientId: string;
  @IsEnum(TransactionType) type: TransactionType;
  @IsDecimal() amount: string;
  @IsString() description: string;
  @IsOptional() @IsString() referenceType?: string;
  @IsOptional() @IsUUID() referenceId?: string;
}

export class PayTransactionDto {
  @IsOptional() @IsString() receiptNumber?: string;
}
