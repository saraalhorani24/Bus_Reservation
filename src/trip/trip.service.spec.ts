import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TripService } from './trip.service.js';
import { Trip } from './trip.schema.js';
import { BusModel } from '../bus/bus.schema.js';
import { Booking } from '../booking/booking.schema.js';
import { TripScheduleChange } from '../trip-schedule-change/trip-schedule-change.schema.js';

describe('TripService', () => {
  let service: TripService;

  const mockModel = {
    find: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
    findByIdAndDelete: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    service = module.get<TripService>(TripService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
