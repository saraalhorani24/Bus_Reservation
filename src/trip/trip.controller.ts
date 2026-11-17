import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { TripService } from './trip.service.js';
import { CreateTripDto } from './dto/create-trip.dto.js';
import { UpdateTripDto } from './dto/update-trip.dto.js';

@Controller('trip')
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @Post()
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
  update(
    @Param('id') id: string,
    @Body() updateTripDto: UpdateTripDto,
    @Body('userId') userId?: string,
  ) {
    return this.tripService.updateTrip(id, updateTripDto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tripService.deleteTrip(id);
  }
}
