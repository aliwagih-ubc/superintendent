import { createChildLogger } from '../../utils/logger.js';
import { PROVIDER_NAMES, type ProviderName } from './types.js';

const logger = createChildLogger({ module: 'provider-registry' });

function isProviderName(value: string): value is ProviderName {
  return (PROVIDER_NAMES as string[]).includes(value);
}

export function resolveProviderName(labels: string[], defaultProvider: ProviderName): ProviderName {
  for (const label of labels) {
    const normalized = label.trim().toLowerCase();
    if (normalized.startsWith('provider:')) {
      const candidate = normalized.slice('provider:'.length);
      if (isProviderName(candidate)) {
        return candidate;
      }
      logger.warn({ label }, 'Unknown provider label; using default provider');
    }
  }
  return defaultProvider;
}
