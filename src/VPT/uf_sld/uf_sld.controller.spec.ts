import { Test, TestingModule } from '@nestjs/testing';
import { UfSldController } from './uf_sld.controller';
import { UfSldService } from './uf_sld.service';

describe('UfSldController', () => {
  let controller: UfSldController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UfSldController],
      providers: [UfSldService],
    }).compile();

    controller = module.get<UfSldController>(UfSldController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
