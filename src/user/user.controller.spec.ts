import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller.ts';
import { UserService } from './user.service.ts';

describe('UserController', () => {
  let controller: UserController;

  const mockUserService = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
