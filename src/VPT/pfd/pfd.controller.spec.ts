import { Test, TestingModule } from '@nestjs/testing';
import { PfdController } from './pfd.controller';
import { PfdService } from './pfd.service';

describe('PfdController', () => {
  let controller: PfdController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PfdController],
      providers: [PfdService],
    }).compile();

    controller = module.get<PfdController>(PfdController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
