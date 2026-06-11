import { getDatabase } from '../queue/database.js';
import { config } from '../config.js';
import { createChildLogger } from '../utils/logger.js';
import { createPublisherClient } from './supabase-client.js';
import { toUpsertClient } from './supabase-upsert.js';
import { syncOnce } from './sync.js';
import { buildSnapshot } from './snapshot.js';
import { enqueue } from './outbox.js';
import packageJson from '../../package.json' with { type: 'json' };

const logger = createChildLogger({ module: 'publisher' });
let timer: NodeJS.Timeout | null = null;

const INTERVAL_MS = 10_000;

export function startPublisher(slots: { total: number; used: () => number }): void {
  const supabase = createPublisherClient();
  if (!supabase) {
    logger.info('Supabase not configured; publisher disabled');
    return;
  }
  const client = toUpsertClient(supabase);
  logger.info('Publisher started');

  const tick = async () => {
    try {
      const db = getDatabase();
      const snap = buildSnapshot({
        version: packageJson.version,
        pollIntervalSeconds: config.daemon.pollIntervalSeconds,
        slotsTotal: slots.total,
        slotsUsed: slots.used(),
      });
      enqueue(db, 'tickets', snap.tickets);
      enqueue(db, 'sessions', snap.sessions);
      enqueue(db, 'daemon_heartbeat', [snap.heartbeat]);
      await syncOnce(db, client);
    } catch (err) {
      logger.error({ err }, 'Publisher tick failed');
    }
  };

  timer = setInterval(tick, INTERVAL_MS);
  void tick();
}

export function stopPublisher(): void {
  if (timer) { clearInterval(timer); timer = null; }
}
