import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { TextInput } from '@inkjs/ui';
import type { SetupState } from '../lib/schema.js';

type Props = {
  state: SetupState;
  onUpdate: (patch: Partial<SetupState>) => void;
  onNext: () => void;
  onBack: () => void;
};

const FIELDS: Array<{
  key: keyof Pick<SetupState, 'AGENTS_MAX_CONCURRENT' | 'AGENTS_MAX_CODE_EXECUTORS' | 'AGENTS_TIMEOUT_MINUTES' | 'AGENTS_MAX_RETRIES'>;
  label: string;
  hint: string;
  defaultValue: number;
}> = [
  { key: 'AGENTS_MAX_CONCURRENT',     label: 'Max concurrent analysis tasks',       hint: '1-50',  defaultValue: 5 },
  { key: 'AGENTS_MAX_CODE_EXECUTORS', label: 'Max concurrent Claude Code instances', hint: '1-20',  defaultValue: 1 },
  { key: 'AGENTS_TIMEOUT_MINUTES',    label: 'Per-agent timeout (minutes)',          hint: '1-1440', defaultValue: 60 },
  { key: 'AGENTS_MAX_RETRIES',        label: 'Max retries on failure',               hint: '0-10',  defaultValue: 2 },
];

export function AgentSettingsStep({ state, onUpdate, onNext, onBack }: Props) {
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, number>>(() => ({
    AGENTS_MAX_CONCURRENT: state.AGENTS_MAX_CONCURRENT,
    AGENTS_MAX_CODE_EXECUTORS: state.AGENTS_MAX_CODE_EXECUTORS,
    AGENTS_TIMEOUT_MINUTES: state.AGENTS_TIMEOUT_MINUTES,
    AGENTS_MAX_RETRIES: state.AGENTS_MAX_RETRIES,
  }));

  useInput((_, k) => { if (k.escape) onBack(); });

  function commit(val: string) {
    const n = Number.parseInt(val, 10);
    if (!Number.isFinite(n)) { setError('Enter a whole number.'); return; }
    setError(null);
    const field = FIELDS[index];
    if (!field) return;
    const next = { ...values, [field.key]: n };
    setValues(next);
    if (index === FIELDS.length - 1) {
      onUpdate(next as Partial<SetupState>);
      onNext();
    } else {
      setIndex(index + 1);
    }
  }

  const field = FIELDS[index];
  if (!field) return null;
  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">Step 5 of 7: Agent settings</Text>
      <Text>{field.label} <Text dimColor>({field.hint})</Text></Text>
      <Box>
        <Text>Value: </Text>
        <TextInput
          defaultValue={String(values[field.key] ?? field.defaultValue)}
          onSubmit={commit}
        />
      </Box>
      {error && <Text color="red">✗ {error}</Text>}
      <Text dimColor>Field {index + 1} of {FIELDS.length} · Enter to confirm · Esc to go back.</Text>
    </Box>
  );
}
