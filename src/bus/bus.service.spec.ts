import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BusService } from './bus.service.js';
import { BusModel } from './bus.schema.js';

describe('BusService', () => {
  let service: BusService;

  const mockBusModel = {
    find: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
    findByIdAndDelete: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusService,
        {
          provide: getModelToken(BusModel.name),
          useValue: mockBusModel,
        },
      ],
    }).compile();

    service = module.get<BusService>(BusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
