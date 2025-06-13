import { Test, TestingModule } from '@nestjs/testing';
import { CodeController } from 'src/code/code.controller';
import { CodeService } from 'src/code/code.service';

describe('CodeController', () => {
  let controller: CodeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CodeController],
      providers: [CodeService],
    }).compile();

    controller = module.get<CodeController>(CodeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
