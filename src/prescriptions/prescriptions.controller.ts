import { Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto, UpdatePrescriptionStatusDto } from './dto/prescription.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller({ path: 'prescriptions', version: '1' })
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('patientId') patientId?: string,
  ) {
    return this.prescriptionsService.findAll(page, Math.min(limit, 100), patientId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.prescriptionsService.findOne(id); }

  @Post()
  @Roles('admin', 'doctor')
  create(@Body() dto: CreatePrescriptionDto) { return this.prescriptionsService.create(dto); }

  @Patch(':id/status')
  @Roles('admin', 'doctor', 'nurse', 'cashier')
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePrescriptionStatusDto) {
    return this.prescriptionsService.updateStatus(id, dto);
  }
}
