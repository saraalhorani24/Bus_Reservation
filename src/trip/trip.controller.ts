import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TripService } from './trip.service.js';
import { CreateTripDto } from './dto/create-trip.dto.js';
import { UpdateTripDto } from './dto/update-trip.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { ALL_USER_ROLES, UserRole } from '../auth/roles.js';

@Controller('trip')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ALL_USER_ROLES)
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createTripDto: CreateTripDto) {
    return this.tripService.createTrip(createTripDto);
  }

  @Get()
  findAll(@Query() filters: any) {
    return this.tripService.getAllTrips(filters);
  }

  @Get('available')
  getAvailable(@Query() filters: any) {
    return this.tripService.getAvailableTrips(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tripService.getTripById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateTripDto: UpdateTripDto,
    @Body('userId') userId?: string,
  ) {
    return this.tripService.updateTrip(id, updateTripDto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.tripService.deleteTrip(id);
  }
}
