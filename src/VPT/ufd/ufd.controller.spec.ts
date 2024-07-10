import { Test, TestingModule } from '@nestjs/testing';
import { UfdController } from './ufd.controller';
import { UfdService } from './ufd.service';

describe('UfdController', () => {
  let controller: UfdController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UfdController],
      providers: [UfdService],
    }).compile();

    controller = module.get<UfdController>(UfdController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
