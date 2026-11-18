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

  describe('getTripById', () => {
    it('should throw BadRequestException for invalid id', async () => {
      await expect(service.getTripById('invalid-id')).rejects.toThrow('Invalid trip ID');
    });

    it('should throw NotFoundException if trip not found', async () => {
      const validId = '507f1f77bcf86cd799439011';
      mockModel.findById.mockReturnValueOnce({
        populate: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.getTripById(validId)).rejects.toThrow('Trip not found');
    });

    it('should return trip with tripBooking when found', async () => {
      const validId = '507f1f77bcf86cd799439011';
      const tripData = { _id: validId, source: 'Cairo', destination: 'Alexandria' };
      const bookingData = [{ _id: 'b1', status: 'confirmed', tripId: validId }];

      mockModel.findById.mockReturnValueOnce({
        populate: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(tripData),
        }),
      });

      mockModel.find.mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue(bookingData),
      });

      const result = await service.getTripById(validId);
      expect(result).toEqual({
        ...tripData,
        tripBooking: bookingData,
      });
    });
  });
});
