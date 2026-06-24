import {
  Controller, Get, Post, Patch, Body, Param, Query,
  ParseUUIDPipe, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Patients')
@ApiBearerAuth('access-token')
@Controller({ path: 'patients', version: '1' })
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar pacientes', description: 'Retorna lista paginada de pacientes con búsqueda opcional.' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Buscar por nombre o número de documento' })
  @ApiResponse({ status: 200, description: 'Lista paginada de pacientes.' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.patientsService.findAll(page, Math.min(limit, 100), search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener paciente por ID' })
  @ApiParam({ name: 'id', description: 'UUID del paciente' })
  @ApiResponse({ status: 200, description: 'Datos del paciente.' })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientsService.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Estadísticas del paciente', description: 'Retorna resumen de citas, consultas y deudas del paciente.' })
  @ApiParam({ name: 'id', description: 'UUID del paciente' })
  @ApiResponse({ status: 200, description: 'Estadísticas del paciente.' })
  getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientsService.getStats(id);
  }

  @Post()
  @Roles('admin', 'receptionist', 'nurse')
  @ApiOperation({ summary: 'Registrar paciente', description: 'Crea un nuevo paciente. Roles: admin, recepcionista, enfermera.' })
  @ApiResponse({ status: 201, description: 'Paciente registrado exitosamente.' })
  @ApiResponse({ status: 409, description: 'Ya existe un paciente con ese número de documento.' })
  create(@Body() dto: CreatePatientDto) {
    return this.patientsService.create(dto);
  }

  @Patch(':id')
  @Roles('admin', 'receptionist', 'nurse', 'doctor')
  @ApiOperation({ summary: 'Actualizar paciente' })
  @ApiParam({ name: 'id', description: 'UUID del paciente' })
  @ApiResponse({ status: 200, description: 'Paciente actualizado.' })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePatientDto) {
    return this.patientsService.update(id, dto);
  }
}
