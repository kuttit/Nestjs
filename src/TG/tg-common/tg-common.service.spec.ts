import { Test, TestingModule } from '@nestjs/testing';
import { TG_CommonService } from './tg-common.service';

describe('CgCommonService', () => {
  let service: TG_CommonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TG_CommonService],
    }).compile();

    service = module.get<TG_CommonService>(TG_CommonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
