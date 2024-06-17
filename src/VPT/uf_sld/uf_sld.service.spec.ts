import { Test, TestingModule } from '@nestjs/testing';
import { UfSldService } from './uf_sld.service';

describe('UfSldService', () => {
  let service: UfSldService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UfSldService],
    }).compile();

    service = module.get<UfSldService>(UfSldService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
