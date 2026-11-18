import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema } from './booking.schema.js';
import { Trip, TripSchema } from '../trip/trip.schema.js';
import { BusModel, BusModelSchema } from '../bus/bus.schema.js';
import { AuthModule } from '../auth/auth.module.js';

import { BookingController } from './booking.controller.js';
import { BookingService } from './booking.service.js';

@Module({
  imports: [
    AuthModule,

    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Trip.name, schema: TripSchema },
      { name: BusModel.name, schema: BusModelSchema },
    ]),
  ],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService, MongooseModule],
})
export class BookingModule {}
