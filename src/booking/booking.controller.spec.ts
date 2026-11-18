import { Test, TestingModule } from '@nestjs/testing';
import { BookingController } from './booking.controller.js';
import { BookingService } from './booking.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

describe('BookingController', () => {
  let controller: BookingController;

  const mockBookingService = {
    createBooking: vi.fn(),
    getAllBookings: vi.fn(),
    getCustomerBookings: vi.fn(),
    getBookingById: vi.fn(),
    updateBooking: vi.fn(),
    cancelBooking: vi.fn(),
    confirmBooking: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        {
          provide: BookingService,
          useValue: mockBookingService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BookingController>(BookingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
