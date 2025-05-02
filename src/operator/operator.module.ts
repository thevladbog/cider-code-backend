import { Module } from '@nestjs/common';
import { OperatorService } from './operator.service';
import { OperatorController } from './operator.controller';
import { UserModule } from 'src/user/user.module';

@Module({
  controllers: [OperatorController],
  providers: [OperatorService],
  imports: [UserModule],
})
export class OperatorModule {}
