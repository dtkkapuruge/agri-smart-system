import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'; // 👈 Add this
import { AuthService } from './auth.service';
import { SyncProfileDto } from './dto/sync-profile.dto';
import { SupabaseAuthGuard } from './auth.guard';

@ApiTags('Authentication') // 👈 This groups these routes in the interface
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sync-profile')
  @ApiOperation({ summary: 'Link Supabase user to our local database' }) // 👈 Description
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth() // Shows the lock icon for this route
  async syncProfile(@Req() req: any, @Body() dto: SyncProfileDto) {
    return this.authService.syncProfile(req.user, dto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile details' })
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  async getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user);
  }
}
