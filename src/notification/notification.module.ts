import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { NotificationService } from './notification.service.js';
import { NotificationController } from './notification.controller.js';
import { Notification, NotificationSchema } from './notification.schema.js';

import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
