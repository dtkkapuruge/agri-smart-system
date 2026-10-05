import { Module } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { AiGradingModule } from '../ai-grading/ai-grading.module';

@Module({
  imports: [AiGradingModule],
  controllers: [ListingsController],
  providers: [ListingsService],
})
export class ListingsModule {}
