import { Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { MedicalRecordsService } from './medical-records.service';
import { CreateMedicalRecordDto, UpdateMedicalRecordDto } from './dto/medical-record.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller({ path: 'medical-records', version: '1' })
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('patientId') patientId?: string,
  ) {
    return this.medicalRecordsService.findAll(page, Math.min(limit, 100), patientId);
  }

  @Get('patient/:patientId')
  findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.medicalRecordsService.findByPatient(patientId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.medicalRecordsService.findOne(id); }

  @Post()
  @Roles('admin', 'doctor')
  create(@Body() dto: CreateMedicalRecordDto) { return this.medicalRecordsService.create(dto); }

  @Patch(':id')
  @Roles('admin', 'doctor')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMedicalRecordDto) {
    return this.medicalRecordsService.update(id, dto);
  }
}
