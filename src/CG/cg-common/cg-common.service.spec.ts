import { Test, TestingModule } from '@nestjs/testing';
import { CgCommonService } from './cg-common.service';

describe('CgCommonService', () => {
  let service: CgCommonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CgCommonService],
    }).compile();

    service = module.get<CgCommonService>(CgCommonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
