import type Database from 'better-sqlite3';

/** Has this comment already been handled by the mention trigger, or was it posted by the daemon? */
export function isMentionProcessed(db: Database.Database, commentId: string): boolean {
  const row = db.prepare('SELECT 1 FROM processed_mentions WHERE comment_id = ?').get(commentId);
  return row !== undefined;
}

export function markMentionProcessed(
  db: Database.Database,
  m: { commentId: string; ticketId: string; command: string },
): void {
  db.prepare(
    `INSERT OR IGNORE INTO processed_mentions (comment_id, ticket_id, command) VALUES (?, ?, ?)`,
  ).run(m.commentId, m.ticketId, m.command);
}
