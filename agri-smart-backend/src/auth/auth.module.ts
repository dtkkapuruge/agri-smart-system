import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseAuthGuard } from './auth.guard';

// WHAT IS A MODULE?
// A Module groups related files together.
// It tells NestJS: "These controllers and services belong together."

@Module({
  controllers: [AuthController],
  providers: [AuthService, SupabaseAuthGuard],
  exports: [SupabaseAuthGuard], // Other modules can use the guard too
})
export class AuthModule {}
