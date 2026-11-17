import { Test, TestingModule } from '@nestjs/testing';
import { TripScheduleChangeController } from './trip-schedule-change.controller.js';
import { TripScheduleChangeService } from './trip-schedule-change.service.js';

describe('TripScheduleChangeController', () => {
  let controller: TripScheduleChangeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TripScheduleChangeController],
      providers: [TripScheduleChangeService],
    }).compile();

    controller = module.get<TripScheduleChangeController>(TripScheduleChangeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
