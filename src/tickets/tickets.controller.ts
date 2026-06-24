import {
  Controller, Get, Post, Patch, Body, Param, Query,
  ParseUUIDPipe, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto, UpdateTicketStatusDto } from './dto/ticket.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Tickets')
@ApiBearerAuth('access-token')
@Controller({ path: 'tickets', version: '1' })
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar tickets', description: 'Retorna tickets de cola paginados con filtros por estado, tipo y fecha.' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por estado (waiting, called, in_attention, etc.)' })
  @ApiQuery({ name: 'type', required: false, description: 'Filtrar por tipo (emergency, outpatient)' })
  @ApiQuery({ name: 'date', required: false, description: 'Filtrar por fecha (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de tickets.' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('date') date?: string,
  ) {
    return this.ticketsService.findAll(page, Math.min(limit, 200), { status, type, date });
  }

  @Get('stats/today')
  @ApiOperation({ summary: 'Estadísticas de hoy', description: 'Retorna el resumen de tickets del día actual (totales por estado y tipo).' })
  @ApiResponse({ status: 200, description: 'Estadísticas diarias de tickets.' })
  getTodayStats() {
    return this.ticketsService.getTodayStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener ticket por ID' })
  @ApiParam({ name: 'id', description: 'UUID del ticket' })
  @ApiResponse({ status: 200, description: 'Datos del ticket.' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.findOne(id);
  }

  @Post()
  @Roles('admin', 'receptionist', 'nurse', 'doctor')
  @ApiOperation({ summary: 'Crear ticket', description: 'Genera un nuevo ticket de cola para el paciente.' })
  @ApiResponse({ status: 201, description: 'Ticket creado exitosamente.' })
  create(@Body() dto: CreateTicketDto, @CurrentUser() user: any) {
    return this.ticketsService.create(dto, user.id);
  }

  @Patch(':id/status')
  @Roles('admin', 'receptionist', 'nurse', 'doctor')
  @ApiOperation({ summary: 'Actualizar estado del ticket', description: 'Cambia el estado del ticket (llamar, atender, finalizar, etc.).' })
  @ApiParam({ name: 'id', description: 'UUID del ticket' })
  @ApiResponse({ status: 200, description: 'Estado actualizado.' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado.' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.ticketsService.updateStatus(id, dto, user.id);
  }
}
