import { Injectable } from '@nestjs/common';
import { CreateTripScheduleChangeDto } from './dto/create-trip-schedule-change.dto.js';
import { UpdateTripScheduleChangeDto } from './dto/update-trip-schedule-change.dto.js';

@Injectable()
export class TripScheduleChangeService {
  create(createTripScheduleChangeDto: CreateTripScheduleChangeDto) {
    return 'This action adds a new tripScheduleChange';
  }

  findAll() {
    return `This action returns all tripScheduleChange`;
  }

  findOne(id: number) {
    return `This action returns a #${id} tripScheduleChange`;
  }

  update(id: number, updateTripScheduleChangeDto: UpdateTripScheduleChangeDto) {
    return `This action updates a #${id} tripScheduleChange`;
  }

  remove(id: number) {
    return `This action removes a #${id} tripScheduleChange`;
  }
}
