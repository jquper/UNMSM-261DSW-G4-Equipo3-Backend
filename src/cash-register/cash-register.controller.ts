import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CashRegisterService } from './cash-register.service';
import {
  OpenCashRegisterDto,
  CloseCashRegisterDto,
  CollectPaymentDto,
  UpdateReceiptSeriesDto,
  CreateReceiptSeriesDto,
} from './dto/cash-register.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('CashRegister')
@ApiBearerAuth('access-token')
@Controller({ path: 'cash-register', version: '1' })
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  // ── Cash Registers ─────────────────────────────────────────────────────────

  @Get()
  @Roles('admin', 'cashier')
  @ApiOperation({ summary: 'Listar cajas registradoras', description: 'Retorna el historial de sesiones de caja. Filtro por estado (open/closed).' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por estado: open, closed' })
  @ApiResponse({ status: 200, description: 'Lista paginada de sesiones de caja.' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.cashRegisterService.findAll(page, Math.min(limit, 100), status);
  }

  @Get('my-register')
  @Roles('admin', 'cashier')
  @ApiOperation({ summary: 'Mi caja abierta', description: 'Retorna la sesión de caja actualmente abierta del cajero autenticado.' })
  @ApiResponse({ status: 200, description: 'Caja abierta del cajero, o null si no tiene.' })
  getMyOpenRegister(@CurrentUser() user: any) {
    return this.cashRegisterService.getMyOpenRegister(user.id);
  }

  @Get(':id')
  @Roles('admin', 'cashier')
  @ApiOperation({ summary: 'Obtener caja por ID', description: 'Retorna detalle de la sesión de caja incluyendo todas las transacciones cobradas.' })
  @ApiParam({ name: 'id', description: 'UUID de la sesión de caja' })
  @ApiResponse({ status: 200, description: 'Detalle de la caja con transacciones.' })
  @ApiResponse({ status: 404, description: 'Caja no encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.cashRegisterService.findOne(id);
  }

  @Post('open')
  @Roles('admin', 'cashier')
  @ApiOperation({
    summary: 'Abrir sesión de caja',
    description: 'Abre una nueva sesión de caja para el cajero autenticado. Solo se permite una caja abierta por cajero a la vez.',
  })
  @ApiResponse({ status: 201, description: 'Caja abierta exitosamente.' })
  @ApiResponse({ status: 409, description: 'El cajero ya tiene una caja abierta.' })
  openCashRegister(@Body() dto: OpenCashRegisterDto, @CurrentUser() user: any) {
    return this.cashRegisterService.openCashRegister(dto, user.id);
  }

  @Patch(':id/close')
  @Roles('admin', 'cashier')
  @ApiOperation({
    summary: 'Cerrar sesión de caja',
    description: 'Cierra la sesión de caja y registra el saldo físico. Calcula la diferencia con el saldo esperado.',
  })
  @ApiParam({ name: 'id', description: 'UUID de la sesión de caja' })
  @ApiResponse({ status: 200, description: 'Caja cerrada con resumen de diferencias.' })
  @ApiResponse({ status: 400, description: 'Caja ya cerrada o no pertenece al cajero.' })
  closeCashRegister(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseCashRegisterDto,
    @CurrentUser() user: any,
  ) {
    return this.cashRegisterService.closeCashRegister(id, dto, user.id);
  }

  @Post('collect')
  @Roles('admin', 'cashier')
  @ApiOperation({
    summary: 'Cobrar transacción',
    description: 'Registra el cobro de una transacción pendiente. Genera el comprobante (boleta/factura), calcula el vuelto y asocia el pago a la caja abierta del cajero.',
  })
  @ApiResponse({ status: 201, description: 'Pago registrado. Retorna comprobante y vuelto.' })
  @ApiResponse({ status: 400, description: 'Sin caja abierta, monto insuficiente o transacción no pendiente.' })
  collectPayment(@Body() dto: CollectPaymentDto, @CurrentUser() user: any) {
    return this.cashRegisterService.collectPayment(dto, user.id);
  }

  // ── Receipt Series ─────────────────────────────────────────────────────────

  @Get('series/list')
  @Roles('admin', 'cashier')
  @ApiOperation({ summary: 'Listar series de comprobantes', description: 'Retorna todas las series configuradas para boletas y facturas.' })
  @ApiResponse({ status: 200, description: 'Lista de series de comprobantes.' })
  findAllSeries() {
    return this.cashRegisterService.findAllSeries();
  }

  @Post('series')
  @Roles('admin')
  @ApiOperation({ summary: 'Crear serie de comprobante', description: 'Crea una nueva serie para emitir boletas o facturas. Solo admin.' })
  @ApiResponse({ status: 201, description: 'Serie creada.' })
  createSeries(@Body() dto: CreateReceiptSeriesDto) {
    return this.cashRegisterService.createSeries(dto);
  }

  @Patch('series/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar serie de comprobante', description: 'Modifica el prefijo, número actual o estado activo de una serie. Solo admin.' })
  @ApiParam({ name: 'id', description: 'UUID de la serie' })
  @ApiResponse({ status: 200, description: 'Serie actualizada.' })
  @ApiResponse({ status: 404, description: 'Serie no encontrada.' })
  updateSeries(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateReceiptSeriesDto) {
    return this.cashRegisterService.updateSeries(id, dto);
  }
}
