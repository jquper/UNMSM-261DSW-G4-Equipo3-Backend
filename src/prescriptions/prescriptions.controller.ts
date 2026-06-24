import { Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto, UpdatePrescriptionStatusDto } from './dto/prescription.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Prescriptions')
@ApiBearerAuth('access-token')
@Controller({ path: 'prescriptions', version: '1' })
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar recetas', description: 'Retorna recetas médicas paginadas con filtro opcional por paciente.' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'patientId', required: false, description: 'Filtrar por UUID del paciente' })
  @ApiResponse({ status: 200, description: 'Lista paginada de recetas.' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('patientId') patientId?: string,
  ) {
    return this.prescriptionsService.findAll(page, Math.min(limit, 100), patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener receta por ID' })
  @ApiParam({ name: 'id', description: 'UUID de la receta' })
  @ApiResponse({ status: 200, description: 'Datos de la receta con sus ítems.' })
  @ApiResponse({ status: 404, description: 'Receta no encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.prescriptionsService.findOne(id); }

  @Post()
  @Roles('admin', 'doctor')
  @ApiOperation({ summary: 'Crear receta médica', description: 'Emite una nueva receta con uno o más medicamentos. Roles: admin, médico.' })
  @ApiResponse({ status: 201, description: 'Receta creada exitosamente.' })
  create(@Body() dto: CreatePrescriptionDto) { return this.prescriptionsService.create(dto); }

  @Patch(':id/status')
  @Roles('admin', 'doctor', 'nurse', 'pharmacy_tech', 'cashier')
  @ApiOperation({ summary: 'Actualizar estado de la receta', description: 'Cambia el estado de la receta (dispensar, cancelar, etc.).' })
  @ApiParam({ name: 'id', description: 'UUID de la receta' })
  @ApiResponse({ status: 200, description: 'Estado actualizado.' })
  @ApiResponse({ status: 404, description: 'Receta no encontrada.' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePrescriptionStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.prescriptionsService.updateStatus(id, dto, user.id);
  }
}
