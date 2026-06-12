import { createChildLogger } from '../utils/logger.js';
import { config } from '../config.js';
import { getDatabase, type LinearTaskType } from '../queue/database.js';
import { isMentionProcessed, markMentionProcessed } from '../queue/mention-store.js';
import { linearQueue } from '../queue/linear-queue.js';
import { linearClient } from './client.js';
import { parseMention, getHelpText, type SuperintendentCommand } from '../utils/mention-parser.js';

const logger = createChildLogger({ module: 'mention-trigger' });

export { isMentionProcessed, markMentionProcessed } from '../queue/mention-store.js';

/** Map an @superintendent command to the queue task type that runs it. `help` has no task. */
export function commandToTaskType(command: SuperintendentCommand): LinearTaskType | null {
  switch (command) {
    case 'work': return 'execute';
    case 'plan': return 'plan';
    case 'clarify': return 'refine';
    case 'rewrite': return 'consolidate';
    case 'help': return null;
  }
}

/**
 * Polls Linear for new @superintendent comments and enqueues the matching work.
 * Replaces the webhook trigger removed in Phase 1. Cheap, recency-filtered query so
 * it can run on a short interval (default 5s) without exhausting the rate budget.
 */
export class MentionTrigger {
  private timer: NodeJS.Timeout | null = null;
  private polling = false;
  private readonly lookbackMs: number;

  constructor(lookbackSeconds = 600) {
    this.lookbackMs = lookbackSeconds * 1000;
  }

  start(intervalMs: number): void {
    if (this.timer) return;
    logger.info({ intervalMs, lookbackMs: this.lookbackMs }, 'Starting mention trigger poller');
    void this.pollOnce();
    this.timer = setInterval(() => void this.pollOnce(), intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async pollOnce(): Promise<number> {
    if (this.polling) return 0;
    this.polling = true;
    try {
      const sinceIso = new Date(Date.now() - this.lookbackMs).toISOString();
      const comments = await linearClient.getRecentMentionComments(sinceIso);
      const db = getDatabase();
      let enqueued = 0;

      for (const c of comments) {
        // Bot-posted comments are recorded as processed when addComment runs, so they are
        // skipped here. We cannot filter by author: with a personal token the daemon's API
        // identity is the same user who types the commands.
        if (isMentionProcessed(db, c.commentId)) continue;

        const parsed = parseMention(c.body);
        if (!parsed.found || !parsed.command) continue;

        if (parsed.command === 'help') {
          await linearClient.addComment(c.ticketId, getHelpText());
          markMentionProcessed(db, { commentId: c.commentId, ticketId: c.ticketId, command: 'help' });
          continue;
        }

        const taskType = commandToTaskType(parsed.command);
        if (!taskType) {
          markMentionProcessed(db, { commentId: c.commentId, ticketId: c.ticketId, command: parsed.command });
          continue;
        }

        linearQueue.enqueue({
          ticketId: c.ticketId,
          ticketIdentifier: c.ticketIdentifier,
          taskType,
          priority: 2, // High: user explicitly asked for it
        });
        markMentionProcessed(db, { commentId: c.commentId, ticketId: c.ticketId, command: parsed.command });
        enqueued++;
        logger.info({ ticket: c.ticketIdentifier, command: parsed.command, taskType }, 'Mention triggered work');
      }

      return enqueued;
    } catch (err) {
      logger.warn({ err }, 'Mention poll failed (will retry next interval)');
      return 0;
    } finally {
      this.polling = false;
    }
  }
}

export const mentionTrigger = new MentionTrigger(config.daemon.mentionLookbackSeconds);
