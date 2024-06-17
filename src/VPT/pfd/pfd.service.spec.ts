import { Test, TestingModule } from '@nestjs/testing';
import { PfdService } from './pfd.service';

describe('PfdService', () => {
  let service: PfdService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PfdService],
    }).compile();

    service = module.get<PfdService>(PfdService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
