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
  ParseBoolPipe,
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
import { PharmacyService } from './pharmacy.service';
import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  AdjustStockDto,
  DispensePrescriptionDto,
} from './dto/pharmacy.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Pharmacy')
@ApiBearerAuth('access-token')
@Controller({ path: 'pharmacy', version: '1' })
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  // ── Inventory ──────────────────────────────────────────────────────────────

  @Get('inventory')
  @ApiOperation({ summary: 'Listar inventario de farmacia', description: 'Retorna todos los medicamentos en stock. Filtro opcional para bajo stock.' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'lowStock', required: false, type: Boolean, description: 'true para mostrar solo items con stock bajo o agotado' })
  @ApiResponse({ status: 200, description: 'Lista paginada del inventario.' })
  findAllInventory(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('lowStock', new DefaultValuePipe(false), ParseBoolPipe) lowStock: boolean,
  ) {
    return this.pharmacyService.findAllInventory(page, Math.min(limit, 100), lowStock);
  }

  @Get('inventory/alerts')
  @Roles('admin', 'pharmacy_tech')
  @ApiOperation({ summary: 'Alertas de stock bajo', description: 'Retorna medicamentos con stock igual o menor al mínimo configurado.' })
  @ApiResponse({ status: 200, description: 'Lista de medicamentos con stock bajo.' })
  getLowStockAlerts() {
    return this.pharmacyService.getLowStockAlerts();
  }

  @Get('inventory/:id')
  @ApiOperation({ summary: 'Obtener medicamento por ID' })
  @ApiParam({ name: 'id', description: 'UUID del item de inventario' })
  @ApiResponse({ status: 200, description: 'Datos del medicamento.' })
  @ApiResponse({ status: 404, description: 'Medicamento no encontrado.' })
  findOneInventory(@Param('id', ParseUUIDPipe) id: string) {
    return this.pharmacyService.findOneInventory(id);
  }

  @Post('inventory')
  @Roles('admin', 'pharmacy_tech')
  @ApiOperation({ summary: 'Agregar medicamento al inventario', description: 'Registra un nuevo medicamento en el inventario de farmacia.' })
  @ApiResponse({ status: 201, description: 'Medicamento registrado.' })
  createInventoryItem(@Body() dto: CreateInventoryItemDto) {
    return this.pharmacyService.createInventoryItem(dto);
  }

  @Patch('inventory/:id')
  @Roles('admin', 'pharmacy_tech')
  @ApiOperation({ summary: 'Actualizar medicamento', description: 'Actualiza precio, stock mínimo, vencimiento u otros datos del medicamento.' })
  @ApiParam({ name: 'id', description: 'UUID del item de inventario' })
  @ApiResponse({ status: 200, description: 'Medicamento actualizado.' })
  updateInventoryItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryItemDto,
  ) {
    return this.pharmacyService.updateInventoryItem(id, dto);
  }

  @Patch('inventory/:id/adjust-stock')
  @Roles('admin', 'pharmacy_tech')
  @ApiOperation({ summary: 'Ajustar stock manualmente', description: 'Suma o resta unidades del stock (cantidad positiva para aumentar, negativa para disminuir).' })
  @ApiParam({ name: 'id', description: 'UUID del item de inventario' })
  @ApiResponse({ status: 200, description: 'Stock ajustado.' })
  @ApiResponse({ status: 400, description: 'Stock insuficiente.' })
  adjustStock(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AdjustStockDto) {
    return this.pharmacyService.adjustStock(id, dto);
  }

  // ── Medication Orders ──────────────────────────────────────────────────────

  @Get('orders')
  @Roles('admin', 'pharmacy_tech', 'doctor', 'nurse')
  @ApiOperation({ summary: 'Listar órdenes de medicamentos', description: 'Retorna el historial de despachos de recetas.' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por estado: pending, ready, delivered, cancelled' })
  @ApiResponse({ status: 200, description: 'Lista paginada de órdenes.' })
  findAllOrders(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.pharmacyService.findAllOrders(page, Math.min(limit, 100), status);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Obtener orden de medicamentos por ID' })
  @ApiParam({ name: 'id', description: 'UUID de la orden' })
  @ApiResponse({ status: 200, description: 'Detalle de la orden con sus items.' })
  @ApiResponse({ status: 404, description: 'Orden no encontrada.' })
  findOneOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.pharmacyService.findOneOrder(id);
  }

  @Post('dispense')
  @Roles('admin', 'pharmacy_tech')
  @ApiOperation({
    summary: 'Despachar receta médica',
    description: 'Despacha los medicamentos de una receta activa: reduce stock, crea orden de entrega y genera cargo de cobro al paciente.',
  })
  @ApiResponse({ status: 201, description: 'Receta despachada. Se generó cargo en facturación.' })
  @ApiResponse({ status: 400, description: 'Stock insuficiente o receta no activa.' })
  @ApiResponse({ status: 404, description: 'Prescripción o medicamento no encontrado.' })
  dispensePrescription(@Body() dto: DispensePrescriptionDto, @CurrentUser() user: any) {
    return this.pharmacyService.dispensePrescription(dto, user.id);
  }
}
