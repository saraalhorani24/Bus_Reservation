import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { TripScheduleChangeService } from './trip-schedule-change.service.js';
import { CreateTripScheduleChangeDto } from './dto/create-trip-schedule-change.dto.js';
import { UpdateTripScheduleChangeDto } from './dto/update-trip-schedule-change.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { ALL_USER_ROLES, UserRole } from '../auth/roles.js';

@Controller('trip-schedule-change')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ALL_USER_ROLES)
export class TripScheduleChangeController {
  constructor(
    private readonly tripScheduleChangeService: TripScheduleChangeService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
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
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateTripScheduleChangeDto: UpdateTripScheduleChangeDto,
  ) {
    return this.tripScheduleChangeService.update(
      +id,
      updateTripScheduleChangeDto,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.tripScheduleChangeService.remove(+id);
  }
}
