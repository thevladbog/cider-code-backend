import { Test, TestingModule } from '@nestjs/testing';
import { SabyController } from '../saby.controller';
import { SabyService } from '../saby.service';

describe('SabyController', () => {
  let controller: SabyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SabyController],
      providers: [SabyService],
    }).compile();

    controller = module.get<SabyController>(SabyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
