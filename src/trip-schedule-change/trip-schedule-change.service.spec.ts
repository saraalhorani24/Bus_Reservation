import { Test, TestingModule } from '@nestjs/testing';
import { TripScheduleChangeService } from './trip-schedule-change.service.js';

describe('TripScheduleChangeService', () => {
  let service: TripScheduleChangeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TripScheduleChangeService],
    }).compile();

    service = module.get<TripScheduleChangeService>(TripScheduleChangeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
