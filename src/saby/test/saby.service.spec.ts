import { Test, TestingModule } from '@nestjs/testing';
import { SabyService } from './saby.service';

describe('SabyService', () => {
  let service: SabyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SabyService],
    }).compile();

    service = module.get<SabyService>(SabyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
