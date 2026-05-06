import { Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateTransactionDto, PayTransactionDto } from './dto/billing.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller({ path: 'billing', version: '1' })
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('debtors')
  @Roles('admin', 'cashier', 'receptionist')
  getDebtors(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.billingService.getDebtors(page, Math.min(limit, 100));
  }

  @Get('account/:patientId')
  getAccount(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.billingService.getAccount(patientId);
  }

  @Get('transactions/:patientId')
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
  createTransaction(@Body() dto: CreateTransactionDto, @CurrentUser() user: any) {
    return this.billingService.createTransaction(dto, user.id);
  }

  @Patch('transactions/:id/pay')
  @Roles('admin', 'cashier')
  payTransaction(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PayTransactionDto) {
    return this.billingService.payTransaction(id, dto);
  }
}
