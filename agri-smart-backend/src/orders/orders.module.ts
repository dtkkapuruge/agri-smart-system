import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
 import { MatchingModule } from '../matching/matching.module';

@Module({
  imports: [MatchingModule], // 👈 Add this line!
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}

