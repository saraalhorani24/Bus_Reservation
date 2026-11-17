import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TripController } from './trip.controller.js';
import { TripService } from './trip.service.js';
import { Trip } from './trip.schema.js';
import { BusModel } from '../bus/bus.schema.js';
import { Booking } from '../booking/booking.schema.js';
import { TripScheduleChange } from '../trip-schedule-change/trip-schedule-change.schema.js';

describe('TripController', () => {
  let controller: TripController;

  const mockModel = {
    find: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
    findByIdAndDelete: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TripController],
      providers: [
        TripService,
        {
          provide: getModelToken(Trip.name),
          useValue: mockModel,
        },
        {
          provide: getModelToken(BusModel.name),
          useValue: mockModel,
        },
        {
          provide: getModelToken(Booking.name),
          useValue: mockModel,
        },
        {
          provide: getModelToken(TripScheduleChange.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    controller = module.get<TripController>(TripController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
