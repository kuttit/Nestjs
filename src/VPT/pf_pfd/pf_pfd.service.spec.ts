import { Test, TestingModule } from '@nestjs/testing';
import { PfPfdService } from './pf_pfd.service';

describe('PfPfdService', () => {
  let service: PfPfdService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PfPfdService],
    }).compile();

    service = module.get<PfPfdService>(PfPfdService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
