import { Test, TestingModule } from '@nestjs/testing';
import { UfdService } from './ufd.service';

describe('UfdService', () => {
  let service: UfdService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UfdService],
    }).compile();

    service = module.get<UfdService>(UfdService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
