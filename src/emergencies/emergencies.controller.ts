import { Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { EmergenciesService } from './emergencies.service';
import { CreateEmergencyDto, UpdateEmergencyDto } from './dto/emergency.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Emergencies')
@ApiBearerAuth('access-token')
@Controller({ path: 'emergencies', version: '1' })
export class EmergenciesController {
  constructor(private readonly emergenciesService: EmergenciesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar emergencias', description: 'Retorna los casos de emergencia paginados con filtro por estado.' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por estado (active, in_treatment, observation, discharged, etc.)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de emergencias.' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.emergenciesService.findAll(page, Math.min(limit, 100), { status });
  }

  @Get('active/count')
  @ApiOperation({ summary: 'Conteo de emergencias activas', description: 'Retorna la cantidad de emergencias activas en este momento.' })
  @ApiResponse({ status: 200, description: 'Número de emergencias activas.' })
  getActiveCount() { return this.emergenciesService.getActiveCount(); }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener emergencia por ID' })
  @ApiParam({ name: 'id', description: 'UUID de la emergencia' })
  @ApiResponse({ status: 200, description: 'Datos de la emergencia.' })
  @ApiResponse({ status: 404, description: 'Emergencia no encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.emergenciesService.findOne(id); }

  @Post()
  @Roles('admin', 'nurse', 'doctor', 'receptionist')
  @ApiOperation({ summary: 'Registrar emergencia', description: 'Crea un nuevo caso de emergencia para un paciente. Roles: admin, enfermera, médico, recepcionista.' })
  @ApiResponse({ status: 201, description: 'Emergencia registrada.' })
  create(@Body() dto: CreateEmergencyDto, @CurrentUser('id') userId: string) {
    return this.emergenciesService.create(dto, userId);
  }

  @Patch(':id')
  @Roles('admin', 'nurse', 'doctor')
  @ApiOperation({ summary: 'Actualizar emergencia', description: 'Actualiza el estado, signos vitales, médico asignado o cama de la emergencia.' })
  @ApiParam({ name: 'id', description: 'UUID de la emergencia' })
  @ApiResponse({ status: 200, description: 'Emergencia actualizada.' })
  @ApiResponse({ status: 404, description: 'Emergencia no encontrada.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEmergencyDto) {
    return this.emergenciesService.update(id, dto);
  }
}
