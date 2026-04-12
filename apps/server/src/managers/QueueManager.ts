// apps/server/src/managers/QueueManager.ts

import { Song } from "@shared/types";

/**
 * QueueManager - Queue sorting and prioritization logic
 *
 * Sorting rules:
 * 1. Primary: Number of votes (descending)
 * 2. Secondary: Time added (FIFO - ascending)
 */
export class QueueManager {
  /**
   * Sort queue based on votes and time
   */
  sortQueue(queue: Song[]): Song[] {
    return [...queue].sort((a, b) => {
      // Primary: More votes = higher priority
      const voteDiff = b.votes.length - a.votes.length;
      if (voteDiff !== 0) return voteDiff;

      // Secondary: Earlier added = higher priority (FIFO)
      return a.addedAt - b.addedAt;
    });
  }

  /**
   * Get position of song in sorted queue
   */
  getSongPosition(queue: Song[], songId: string): number {
    const sorted = this.sortQueue(queue);
    return sorted.findIndex((s) => s.id === songId);
  }

  /**
   * FUTURE: Weighted voting algorithm
   * Allow different vote weights based on user role or reputation
   */
  sortQueueWeighted(queue: Song[], weights: Map<string, number>): Song[] {
    return [...queue].sort((a, b) => {
      const aScore = a.votes.reduce(
        (sum, userId) => sum + (weights.get(userId) || 1),
        0,
      );
      const bScore = b.votes.reduce(
        (sum, userId) => sum + (weights.get(userId) || 1),
        0,
      );

      const scoreDiff = bScore - aScore;
      if (scoreDiff !== 0) return scoreDiff;

      return a.addedAt - b.addedAt;
    });
  }

  /**
   * FUTURE: DJ Mode
   * Lock queue and allow only DJ to add songs
   */
  lockQueue(queue: Song[], djUserId: string): Song[] {
    // Implementation for DJ-only queue management
    return queue;
  }
}
