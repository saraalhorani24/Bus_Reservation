import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusService } from './bus.service.js';
import { BusController } from './bus.controller.js';
import { BusModel, BusModelSchema } from './bus.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: BusModel.name, schema: BusModelSchema }]),
  ],
  controllers: [BusController],
  providers: [BusService],
  exports: [BusService, MongooseModule],
})
export class BusModule {}
