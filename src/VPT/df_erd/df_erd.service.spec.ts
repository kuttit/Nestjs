import { Test, TestingModule } from '@nestjs/testing';
import { DfErdService } from './df_erd.service';

describe('DfErdService', () => {
  let service: DfErdService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DfErdService],
    }).compile();

    service = module.get<DfErdService>(DfErdService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
