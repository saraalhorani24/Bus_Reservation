import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TripService } from './trip.service.js';
import { TripController } from './trip.controller.js';
import { Trip, TripSchema } from './trip.schema.js';
import { BusModule } from '../bus/bus.module.js';
import { BookingModule } from '../booking/booking.module.js';
import { TripScheduleChangeModule } from '../trip-schedule-change/trip-schedule-change.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Trip.name, schema: TripSchema }]),
    BusModule,
    BookingModule,
    TripScheduleChangeModule,
  ],
  controllers: [TripController],
  providers: [TripService],
  exports: [TripService, MongooseModule],
})
export class TripModule {}
