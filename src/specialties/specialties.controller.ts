import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SpecialtiesService } from './specialties.service';
import { CreateSpecialtyDto, UpdateSpecialtyDto } from './dto/specialty.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Specialties')
@ApiBearerAuth('access-token')
@Controller({ path: 'specialties', version: '1' })
export class SpecialtiesController {
  constructor(private readonly specialtiesService: SpecialtiesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar especialidades', description: 'Retorna todas las especialidades médicas disponibles.' })
  @ApiResponse({ status: 200, description: 'Lista de especialidades.' })
  findAll() { return this.specialtiesService.findAll(); }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener especialidad por ID' })
  @ApiParam({ name: 'id', description: 'UUID de la especialidad' })
  @ApiResponse({ status: 200, description: 'Datos de la especialidad.' })
  @ApiResponse({ status: 404, description: 'Especialidad no encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.specialtiesService.findOne(id); }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Crear especialidad', description: 'Registra una nueva especialidad médica. Solo admin.' })
  @ApiResponse({ status: 201, description: 'Especialidad creada.' })
  @ApiResponse({ status: 409, description: 'Ya existe una especialidad con ese nombre.' })
  create(@Body() dto: CreateSpecialtyDto) { return this.specialtiesService.create(dto); }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar especialidad' })
  @ApiParam({ name: 'id', description: 'UUID de la especialidad' })
  @ApiResponse({ status: 200, description: 'Especialidad actualizada.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSpecialtyDto) {
    return this.specialtiesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Eliminar especialidad', description: 'Elimina una especialidad médica. Solo admin.' })
  @ApiParam({ name: 'id', description: 'UUID de la especialidad' })
  @ApiResponse({ status: 200, description: 'Especialidad eliminada.' })
  @ApiResponse({ status: 409, description: 'No se puede eliminar: tiene médicos asociados.' })
  remove(@Param('id', ParseUUIDPipe) id: string) { return this.specialtiesService.remove(id); }
}
