import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UserModule } from './user/user.module.js';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module.js';
import { BookingModule } from './booking/booking.module.js';
import { TripModule } from './trip/trip.module.js';
import { TripScheduleChangeModule } from './trip-schedule-change/trip-schedule-change.module.js';
import { BusModule } from './bus/bus.module.js';
import { NotificationModule } from './notification/notification.module.js';

@Module({
  imports: [UserModule, MongooseModule.forRoot('mongodb://localhost/nest'), AuthModule, BookingModule, TripModule, TripScheduleChangeModule, BusModule, NotificationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
