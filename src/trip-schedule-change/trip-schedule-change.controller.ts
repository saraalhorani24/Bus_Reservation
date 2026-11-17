import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TripScheduleChangeService } from './trip-schedule-change.service.js';
import { CreateTripScheduleChangeDto } from './dto/create-trip-schedule-change.dto.js';
import { UpdateTripScheduleChangeDto } from './dto/update-trip-schedule-change.dto.js';

@Controller('trip-schedule-change')
export class TripScheduleChangeController {
  constructor(private readonly tripScheduleChangeService: TripScheduleChangeService) {}

  @Post()
  create(@Body() createTripScheduleChangeDto: CreateTripScheduleChangeDto) {
    return this.tripScheduleChangeService.create(createTripScheduleChangeDto);
  }

  @Get()
  findAll() {
    return this.tripScheduleChangeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tripScheduleChangeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTripScheduleChangeDto: UpdateTripScheduleChangeDto) {
    return this.tripScheduleChangeService.update(+id, updateTripScheduleChangeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tripScheduleChangeService.remove(+id);
  }
}
