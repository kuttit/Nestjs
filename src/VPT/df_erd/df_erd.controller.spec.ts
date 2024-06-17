import { Test, TestingModule } from '@nestjs/testing';
import { DfErdController } from './df_erd.controller';
import { DfErdService } from './df_erd.service';

describe('DfErdController', () => {
  let controller: DfErdController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DfErdController],
      providers: [DfErdService],
    }).compile();

    controller = module.get<DfErdController>(DfErdController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
