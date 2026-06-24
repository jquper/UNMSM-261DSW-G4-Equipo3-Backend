import { Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MedicalRecordsService } from './medical-records.service';
import { CreateMedicalRecordDto, UpdateMedicalRecordDto } from './dto/medical-record.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Medical Records')
@ApiBearerAuth('access-token')
@Controller({ path: 'medical-records', version: '1' })
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar historiales clínicos', description: 'Retorna historiales clínicos paginados, con filtro opcional por paciente.' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'patientId', required: false, description: 'Filtrar por UUID del paciente' })
  @ApiResponse({ status: 200, description: 'Lista paginada de historiales.' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('patientId') patientId?: string,
  ) {
    return this.medicalRecordsService.findAll(page, Math.min(limit, 100), patientId);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Historial completo del paciente', description: 'Retorna todos los historiales clínicos de un paciente específico.' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiResponse({ status: 200, description: 'Historiales del paciente.' })
  findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.medicalRecordsService.findByPatient(patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener historial por ID' })
  @ApiParam({ name: 'id', description: 'UUID del historial clínico' })
  @ApiResponse({ status: 200, description: 'Datos del historial.' })
  @ApiResponse({ status: 404, description: 'Historial no encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.medicalRecordsService.findOne(id); }

  @Post()
  @Roles('admin', 'doctor')
  @ApiOperation({ summary: 'Crear historial clínico', description: 'Registra un nuevo historial clínico para un paciente. Roles: admin, médico.' })
  @ApiResponse({ status: 201, description: 'Historial creado exitosamente.' })
  create(@Body() dto: CreateMedicalRecordDto) { return this.medicalRecordsService.create(dto); }

  @Patch(':id')
  @Roles('admin', 'doctor')
  @ApiOperation({ summary: 'Actualizar historial clínico' })
  @ApiParam({ name: 'id', description: 'UUID del historial clínico' })
  @ApiResponse({ status: 200, description: 'Historial actualizado.' })
  @ApiResponse({ status: 404, description: 'Historial no encontrado.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMedicalRecordDto) {
    return this.medicalRecordsService.update(id, dto);
  }
}
