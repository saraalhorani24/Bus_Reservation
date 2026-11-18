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
import { BusService } from './bus.service.js';
import { CreateBusDto } from './dto/create-bus.dto.js';
import { UpdateBusDto } from './dto/update-bus.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { ALL_USER_ROLES, UserRole } from '../auth/roles.js';

@Controller('bus')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ALL_USER_ROLES)
export class BusController {
  constructor(private readonly busService: BusService) {}

  @Post('seed')
  @Roles(UserRole.ADMIN)
  seed() {
    return this.busService.seedBusModels();
  }

  @Post()
  @Roles(UserRole.ADMIN)
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
  @Roles(UserRole.ADMIN)
  updateFleetCount(
    @Param('id') id: string,
    @Body('totalBusesCount') totalBusesCount: number,
  ) {
    return this.busService.updateFleetCount(id, totalBusesCount);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateBusDto: UpdateBusDto) {
    return this.busService.updateBusModel(id, updateBusDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.busService.remove(id);
  }
}
