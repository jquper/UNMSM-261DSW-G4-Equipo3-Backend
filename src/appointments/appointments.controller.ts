import { Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto/appointment.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Appointments')
@ApiBearerAuth('access-token')
@Controller({ path: 'appointments', version: '1' })
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar citas', description: 'Retorna citas paginadas con filtros por médico, paciente, fecha y estado.' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'doctorId', required: false, description: 'Filtrar por UUID del médico' })
  @ApiQuery({ name: 'patientId', required: false, description: 'Filtrar por UUID del paciente' })
  @ApiQuery({ name: 'date', required: false, description: 'Filtrar por fecha (YYYY-MM-DD)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por estado (scheduled, confirmed, completed, etc.)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de citas.' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('doctorId') doctorId?: string,
    @Query('patientId') patientId?: string,
    @Query('date') date?: string,
    @Query('status') status?: string,
  ) {
    return this.appointmentsService.findAll(page, Math.min(limit, 100), { doctorId, patientId, date, status });
  }

  @Get('schedule/:doctorId')
  @ApiOperation({ summary: 'Agenda del médico', description: 'Retorna las citas del médico para una fecha específica.' })
  @ApiParam({ name: 'doctorId', description: 'UUID del médico' })
  @ApiQuery({ name: 'date', required: true, description: 'Fecha a consultar (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Agenda del médico para la fecha indicada.' })
  getDoctorSchedule(@Param('doctorId', ParseUUIDPipe) doctorId: string, @Query('date') date: string) {
    return this.appointmentsService.getDoctorSchedule(doctorId, date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cita por ID' })
  @ApiParam({ name: 'id', description: 'UUID de la cita' })
  @ApiResponse({ status: 200, description: 'Datos de la cita.' })
  @ApiResponse({ status: 404, description: 'Cita no encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Post()
  @Roles('admin', 'receptionist', 'doctor')
  @ApiOperation({ summary: 'Crear cita', description: 'Registra una nueva cita médica. Roles: admin, recepcionista, médico.' })
  @ApiResponse({ status: 201, description: 'Cita creada exitosamente.' })
  @ApiResponse({ status: 409, description: 'El médico ya tiene una cita en ese horario.' })
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: any) {
    return this.appointmentsService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles('admin', 'receptionist', 'doctor')
  @ApiOperation({ summary: 'Actualizar cita' })
  @ApiParam({ name: 'id', description: 'UUID de la cita' })
  @ApiResponse({ status: 200, description: 'Cita actualizada.' })
  @ApiResponse({ status: 404, description: 'Cita no encontrada.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, dto);
  }
}
