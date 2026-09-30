import { Module } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { MatchingController } from './matching.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],   // PrismaService + ConfigService (for guard)
  controllers: [MatchingController],
  providers: [MatchingService],
  exports: [MatchingService],            // Still exported for OrdersModule to use
})
export class MatchingModule {}

