import { Test, TestingModule } from '@nestjs/testing';
import { TripScheduleChangeController } from './trip-schedule-change.controller.js';
import { TripScheduleChangeService } from './trip-schedule-change.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

describe('TripScheduleChangeController', () => {
  let controller: TripScheduleChangeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TripScheduleChangeController],
      providers: [TripScheduleChangeService],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TripScheduleChangeController>(
      TripScheduleChangeController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
