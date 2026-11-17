import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TripScheduleChangeService } from './trip-schedule-change.service.js';
import { TripScheduleChangeController } from './trip-schedule-change.controller.js';
import { TripScheduleChange, TripScheduleChangeSchema } from './trip-schedule-change.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TripScheduleChange.name, schema: TripScheduleChangeSchema }]),
  ],
  controllers: [TripScheduleChangeController],
  providers: [TripScheduleChangeService],
  exports: [MongooseModule],
})
export class TripScheduleChangeModule {}
