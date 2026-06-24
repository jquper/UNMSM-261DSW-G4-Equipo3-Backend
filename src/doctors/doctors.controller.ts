import { Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto, UpdateDoctorDto } from './dto/doctor.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Doctors')
@ApiBearerAuth('access-token')
@Controller({ path: 'doctors', version: '1' })
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) { }

  @Get()
  @ApiOperation({ summary: 'Listar médicos', description: 'Retorna todos los médicos, con filtro opcional por especialidad.' })
  @ApiQuery({ name: 'specialtyId', required: false, description: 'UUID de la especialidad para filtrar' })
  @ApiResponse({ status: 200, description: 'Lista de médicos.' })
  findAll(@Query('specialtyId') specialtyId?: string) {
    return this.doctorsService.findAll(specialtyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener médico por ID' })
  @ApiParam({ name: 'id', description: 'UUID del médico' })
  @ApiResponse({ status: 200, description: 'Datos del médico.' })
  @ApiResponse({ status: 404, description: 'Médico no encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.doctorsService.findOne(id);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Registrar médico', description: 'Crea un perfil de médico vinculado a un usuario existente. Solo admin.' })
  @ApiResponse({ status: 201, description: 'Médico registrado exitosamente.' })
  @ApiResponse({ status: 409, description: 'El CMP ya está registrado.' })
  create(@Body() dto: CreateDoctorDto) {
    return this.doctorsService.create(dto);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar médico' })
  @ApiParam({ name: 'id', description: 'UUID del médico' })
  @ApiResponse({ status: 200, description: 'Médico actualizado.' })
  @ApiResponse({ status: 404, description: 'Médico no encontrado.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDoctorDto) {
    return this.doctorsService.update(id, dto);
  }
}
