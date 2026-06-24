import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ParseBoolPipe,
  DefaultValuePipe,
  Optional,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto, UpdateDoctorDto, UpdateAvailabilityDto } from './dto/doctor.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Doctors')
@ApiBearerAuth('access-token')
@Controller({ path: 'doctors', version: '1' })
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar médicos', description: 'Retorna todos los médicos activos. Filtro por especialidad, disponibilidad o estado.' })
  @ApiQuery({ name: 'specialtyId', required: false, description: 'UUID de la especialidad para filtrar' })
  @ApiQuery({ name: 'availabilityStatus', required: false, description: 'Filtrar por estado: available, busy, off_duty' })
  @ApiQuery({ name: 'isAvailable', required: false, type: Boolean, description: 'Filtrar solo médicos disponibles para citas (true/false)' })
  @ApiResponse({ status: 200, description: 'Lista de médicos con estado de disponibilidad.' })
  findAll(
    @Query('specialtyId') specialtyId?: string,
    @Query('availabilityStatus') availabilityStatus?: string,
    @Query('isAvailable') isAvailableStr?: string,
  ) {
    const isAvailable =
      isAvailableStr === 'true' ? true : isAvailableStr === 'false' ? false : undefined;
    return this.doctorsService.findAll(specialtyId, availabilityStatus, isAvailable);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener médico por ID' })
  @ApiParam({ name: 'id', description: 'UUID del médico' })
  @ApiResponse({ status: 200, description: 'Datos del médico incluyendo disponibilidad.' })
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

  @Patch(':id/availability')
  @Roles('admin', 'doctor', 'receptionist')
  @ApiOperation({
    summary: 'Actualizar disponibilidad del médico',
    description: 'Cambia el estado de disponibilidad del médico (available, busy, off_duty). Pueden usarlo el admin, el propio médico y recepcionistas.',
  })
  @ApiParam({ name: 'id', description: 'UUID del médico' })
  @ApiResponse({ status: 200, description: 'Disponibilidad actualizada.' })
  @ApiResponse({ status: 404, description: 'Médico no encontrado.' })
  updateAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.doctorsService.updateAvailability(id, dto);
  }
}
