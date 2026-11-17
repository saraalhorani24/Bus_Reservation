import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BookingService } from './booking.service.js';
import { Booking } from './booking.schema.js';
import { Trip } from '../trip/trip.schema.js';
import { BusModel } from '../bus/bus.schema.js';

describe('BookingService', () => {
  let service: BookingService;

  const mockModel = {
    find: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    create: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: getModelToken(Booking.name),
          useValue: mockModel,
        },
        {
          provide: getModelToken(Trip.name),
          useValue: mockModel,
        },
        {
          provide: getModelToken(BusModel.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
