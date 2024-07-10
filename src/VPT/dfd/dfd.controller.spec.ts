import { Test, TestingModule } from '@nestjs/testing';
import { DfdController } from './dfd.controller';
import { DfdService } from './dfd.service';

describe('DfdController', () => {
  let controller: DfdController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DfdController],
      providers: [DfdService],
    }).compile();

    controller = module.get<DfdController>(DfdController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
