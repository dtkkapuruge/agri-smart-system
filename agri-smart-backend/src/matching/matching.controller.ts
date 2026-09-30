import {
  Controller,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MatchingService } from './matching.service';
import { SupabaseAuthGuard } from '../auth/auth.guard';

/**
 * MatchingController
 *
 * Exposes the tiered farmer-matching workflow as HTTP endpoints.
 * All routes are protected by SupabaseAuthGuard — a valid Supabase
 * JWT must be sent as:  Authorization: Bearer <token>
 *
 * Routes
 * ──────
 *  POST /matching/start/:orderId    → Triggers tiered matching for an order
 *  POST /matching/accept/:matchId   → Farmer accepts the matched order
 *  POST /matching/reject/:matchId   → Farmer rejects the matched order
 */
@Controller('matching')
@UseGuards(SupabaseAuthGuard) // 🔒 All routes require authentication
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /matching/start/:orderId
  // ─────────────────────────────────────────────────────────────────────────────
  /**
   * Manually (re-)trigger tiered matching for an existing order.
   * Normally matching fires automatically when an order is created, but this
   * endpoint lets admins/support re-run it on demand.
   *
   * @param orderId  UUID of the order to match
   * @returns Array of matched farmer records with tier and score metadata
   */
  @Post('start/:orderId')
  @HttpCode(HttpStatus.OK)
  async startMatching(@Param('orderId') orderId: string) {
    const matches = await this.matchingService.startTieredMatching(orderId);
    return {
      message: `Tiered matching initiated for order ${orderId}`,
      matched_farmers: matches.length,
      matches,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /matching/accept/:matchId
  // ─────────────────────────────────────────────────────────────────────────────
  /**
   * Farmer accepts a matched order notification.
   * Sets MatchingLog.response_status = 'ACCEPTED' and updates
   * Order.farmer_id + Order.status = 'MATCHED'.
   *
   * @param matchId  UUID of the MatchingLog entry (match_id)
   */
  @Post('accept/:matchId')
  @HttpCode(HttpStatus.OK)
  async acceptMatch(@Param('matchId') matchId: string) {
    return this.matchingService.acceptMatch(matchId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /matching/reject/:matchId
  // ─────────────────────────────────────────────────────────────────────────────
  /**
   * Farmer rejects a matched order notification.
   * Sets MatchingLog.response_status = 'REJECTED'.
   * If all Tier-1 farmers have rejected, the response body includes
   * `tier2_escalated: true` to signal that Tier-2 is now active.
   *
   * @param matchId  UUID of the MatchingLog entry (match_id)
   */
  @Post('reject/:matchId')
  @HttpCode(HttpStatus.OK)
  async rejectMatch(@Param('matchId') matchId: string) {
    return this.matchingService.rejectMatch(matchId);
  }
}
