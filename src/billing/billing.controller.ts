import { Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CreateTransactionDto, PayTransactionDto, PayAllDto } from './dto/billing.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Billing')
@ApiBearerAuth('access-token')
@Controller({ path: 'billing', version: '1' })
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('debtors')
  @Roles('admin', 'cashier', 'receptionist')
  @ApiOperation({ summary: 'Listar pacientes deudores', description: 'Retorna pacientes con deuda pendiente. Roles: admin, cajero, recepcionista.' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Lista paginada de pacientes deudores.' })
  getDebtors(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.billingService.getDebtors(page, Math.min(limit, 100));
  }

  @Get('account/:patientId')
  @ApiOperation({ summary: 'Estado de cuenta del paciente', description: 'Retorna el resumen financiero (deuda total, pagos, saldo) de un paciente.' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiResponse({ status: 200, description: 'Estado de cuenta del paciente.' })
  getAccount(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.billingService.getAccount(patientId);
  }

  @Get('transactions/:patientId')
  @ApiOperation({ summary: 'Historial de transacciones', description: 'Retorna las transacciones paginadas de un paciente.' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por estado (pending, paid, cancelled)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de transacciones.' })
  getTransactions(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.billingService.getTransactions(patientId, page, Math.min(limit, 100), status);
  }

  @Post('transactions')
  @Roles('admin', 'cashier', 'receptionist')
  @ApiOperation({ summary: 'Crear cargo/transacción', description: 'Registra un nuevo cargo, pago o reembolso para un paciente.' })
  @ApiResponse({ status: 201, description: 'Transacción creada.' })
  createTransaction(@Body() dto: CreateTransactionDto, @CurrentUser() user: any) {
    return this.billingService.createTransaction(dto, user.id);
  }

  @Patch('transactions/:id/pay')
  @Roles('admin', 'cashier')
  @ApiOperation({ summary: 'Pagar transacción', description: 'Marca una transacción pendiente como pagada. Roles: admin, cajero.' })
  @ApiParam({ name: 'id', description: 'UUID de la transacción' })
  @ApiResponse({ status: 200, description: 'Transacción pagada.' })
  @ApiResponse({ status: 404, description: 'Transacción no encontrada.' })
  payTransaction(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PayTransactionDto) {
    return this.billingService.payTransaction(id, dto);
  }

  @Post('pay-all/:patientId')
  @Roles('admin', 'cashier')
  @ApiOperation({ summary: 'Pagar toda la deuda', description: 'Cancela todas las transacciones pendientes de un paciente de una sola vez.' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiResponse({ status: 200, description: 'Todas las deudas pagadas.' })
  payAll(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: PayAllDto,
  ) {
    return this.billingService.payAll(patientId, dto);
  }

  @Get('receipt/:receiptNumber')
  @Roles('admin', 'cashier', 'receptionist')
  @ApiOperation({ summary: 'Obtener recibo', description: 'Retorna los datos de un recibo de pago por su número.' })
  @ApiParam({ name: 'receiptNumber', description: 'Número de recibo (ej. REC-2026-001)' })
  @ApiResponse({ status: 200, description: 'Datos del recibo.' })
  @ApiResponse({ status: 404, description: 'Recibo no encontrado.' })
  getReceipt(@Param('receiptNumber') receiptNumber: string) {
    return this.billingService.getReceipt(receiptNumber);
  }
}
