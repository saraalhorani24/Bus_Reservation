import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { BusService } from './bus.service.js';
import { CreateBusDto } from './dto/create-bus.dto.js';
import { UpdateBusDto } from './dto/update-bus.dto.js';

@Controller('bus')
export class BusController {
  constructor(private readonly busService: BusService) {}

  @Post('seed')
  seed() {
    return this.busService.seedBusModels();
  }

  @Post()
  create(@Body() createBusDto: CreateBusDto) {
    return this.busService.createBusModel(createBusDto);
  }

  @Get()
  findAll() {
    return this.busService.getAllBusModels();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.busService.getBusModelById(id);
  }

  @Patch(':id/fleet')
  updateFleetCount(
    @Param('id') id: string,
    @Body('totalBusesCount') totalBusesCount: number,
  ) {
    return this.busService.updateFleetCount(id, totalBusesCount);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBusDto: UpdateBusDto) {
    return this.busService.updateBusModel(id, updateBusDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.busService.remove(id);
  }
}
