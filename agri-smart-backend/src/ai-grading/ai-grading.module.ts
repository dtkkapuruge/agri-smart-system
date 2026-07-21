import { Module } from '@nestjs/common';
import { AiGradingService } from './ai-grading.service';
import { AiGradingController } from './ai-grading.controller';

@Module({
  providers: [AiGradingService],
  controllers: [AiGradingController]
})
export class AiGradingModule {}
