import { Test, TestingModule } from '@nestjs/testing';
import { ShiftController } from 'src/shift/shift.controller';
import { ShiftService } from 'src/shift/shift.service';

describe('ShiftController', () => {
  let controller: ShiftController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShiftController],
      providers: [ShiftService],
    }).compile();

    controller = module.get<ShiftController>(ShiftController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
