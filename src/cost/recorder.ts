import { getDatabase } from '../queue/database.js';
import { createChildLogger } from '../utils/logger.js';
import { costForUsage } from './pricing.js';
import { insertCostEvent } from './storage.js';
import type { CostEventInput } from './types.js';

const logger = createChildLogger({ module: 'cost-recorder' });

export class CostRecorder {
  // Best-effort: a recording failure must never break an agent run.
  record(event: CostEventInput): void {
    try {
      let costUsd: number | null;
      if (event.costUsd !== undefined) {
        costUsd = event.costUsd;
      } else if (event.usage) {
        costUsd = costForUsage(event.model, event.usage);
      } else {
        costUsd = null;
      }

      if (costUsd === null) {
        logger.warn({ model: event.model, agentType: event.agentType }, 'No price for model; recording cost as null');
      }

      insertCostEvent(getDatabase(), { ...event, costUsd });
    } catch (err) {
      logger.error({ err }, 'Failed to record cost event');
    }
  }
}

export const costRecorder = new CostRecorder();
