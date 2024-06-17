import { Test, TestingModule } from '@nestjs/testing';
import { DfdService } from './dfd.service';

describe('DfdService', () => {
  let service: DfdService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DfdService],
    }).compile();

    service = module.get<DfdService>(DfdService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
