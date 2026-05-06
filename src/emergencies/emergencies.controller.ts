import { Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { EmergenciesService } from './emergencies.service';
import { CreateEmergencyDto, UpdateEmergencyDto } from './dto/emergency.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller({ path: 'emergencies', version: '1' })
export class EmergenciesController {
  constructor(private readonly emergenciesService: EmergenciesService) {}

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.emergenciesService.findAll(page, Math.min(limit, 100), { status });
  }

  @Get('active/count')
  getActiveCount() { return this.emergenciesService.getActiveCount(); }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.emergenciesService.findOne(id); }

  @Post()
  @Roles('admin', 'nurse', 'doctor', 'receptionist')
  create(@Body() dto: CreateEmergencyDto) { return this.emergenciesService.create(dto); }

  @Patch(':id')
  @Roles('admin', 'nurse', 'doctor')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEmergencyDto) {
    return this.emergenciesService.update(id, dto);
  }
}
