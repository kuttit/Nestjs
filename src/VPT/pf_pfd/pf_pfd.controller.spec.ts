import { Test, TestingModule } from '@nestjs/testing';
import { PfPfdController } from './pf_pfd.controller';
import { PfPfdService } from './pf_pfd.service';

describe('PfPfdController', () => {
  let controller: PfPfdController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PfPfdController],
      providers: [PfPfdService],
    }).compile();

    controller = module.get<PfPfdController>(PfPfdController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
