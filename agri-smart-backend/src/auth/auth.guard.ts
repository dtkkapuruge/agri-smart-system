import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// WHAT IS A GUARD?
// A Guard runs BEFORE your controller code.
// It checks: "Is this person allowed to access this route?"
// If yes → controller runs normally
// If no  → returns 401 Unauthorized error

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    // Create a Supabase client using your .env values
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL'),
      this.configService.get<string>('SUPABASE_ANON_KEY'),
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Step 1: Get the HTTP request object
    const request = context.switchToHttp().getRequest();

    // Step 2: Get the Authorization header
    // Frontend sends: Authorization: Bearer eyJ...
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header found. Please send your Supabase token.');
    }

    // Step 3: Extract the token (remove "Bearer " prefix)
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('No token found in authorization header.');
    }

    try {
      // Step 4: Ask Supabase "Is this token valid? Who does it belong to?"
      const { data, error } = await this.supabase.auth.getUser(token);

      if (error || !data.user) {
        throw new UnauthorizedException('Invalid or expired token.');
      }

      // Step 5: Attach the Supabase user info to the request
      // Now your controller can access it via request.user
      request.user = data.user;

      // Step 6: Allow the request to proceed
      return true;
    } catch (error) {
      throw new UnauthorizedException('Token verification failed.');
    }
  }
}
