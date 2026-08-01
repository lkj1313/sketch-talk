import { Injectable } from '@nestjs/common';
import type { RealtimeRateLimitRule } from '@/realtime/constants/realtime-rate-limit.constants';

@Injectable()
export class RealtimeRateLimitService {
  private readonly requests = new Map<string, Map<string, number[]>>();

  consume(
    socketId: string,
    event: string,
    rule: RealtimeRateLimitRule,
  ): boolean {
    const now = Date.now();
    const windowStart = now - rule.windowMs;
    const socketRequests = this.requests.get(socketId) ?? new Map();
    const recentRequests = (socketRequests.get(event) ?? []).filter(
      (requestedAt) => requestedAt > windowStart,
    );

    if (recentRequests.length >= rule.limit) {
      socketRequests.set(event, recentRequests);
      this.requests.set(socketId, socketRequests);
      return false;
    }

    recentRequests.push(now);
    socketRequests.set(event, recentRequests);
    this.requests.set(socketId, socketRequests);
    return true;
  }

  clearSocket(socketId: string): void {
    this.requests.delete(socketId);
  }
}
