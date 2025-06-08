import { Module } from '@nestjs/common';
import { SabyService } from './saby.service';
import { SabyController } from './saby.controller';

@Module({
  controllers: [SabyController],
  providers: [SabyService],
})
export class SabyModule {}
