import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { runAllChecks, type AllChecks } from '../lib/validate.js';
import { writeEnvFileAtomic } from '../lib/persistence.js';
import type { SetupState } from '../lib/schema.js';

type Props = {
  state: SetupState;
  cwd: string;
  onNext: () => void;
  onBack: () => void;
};

export function PreflightStep({ state, cwd, onNext, onBack }: Props) {
  const [checks, setChecks] = useState<AllChecks | null>(null);
  const [wrote, setWrote] = useState(false);
  const [writeError, setWriteError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const c = await runAllChecks(state);
      setChecks(c);
      if (c.linear.ok && c.anthropic.ok && c.repo.ok) {
        try {
          writeEnvFileAtomic(cwd, state);
          setWrote(true);
        } catch (err) {
          setWriteError(err instanceof Error ? err.message : String(err));
        }
      }
    })();
  }, []);

  useInput((_, k) => {
    if (k.escape) onBack();
    if (k.return && wrote) onNext();
  });

  if (!checks) {
    return <Box><Spinner type="dots" /><Text> Running preflight checks...</Text></Box>;
  }

  const line = (label: string, r: { ok: boolean; error?: string }) =>
    r.ok
      ? <Text color="green">✓ {label}</Text>
      : <Text color="red">✗ {label}: {r.error}</Text>;

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">Step 6 of 7: Preflight</Text>
      {line('Linear token + team', checks.linear)}
      {line('Anthropic API key', checks.anthropic)}
      {line('Target repository', checks.repo)}
      {wrote && <Text color="green" bold>✓ .env written</Text>}
      {writeError && <Text color="red">✗ .env write failed: {writeError}</Text>}
      {wrote ? <Text>Press Enter to continue.</Text> : <Text dimColor>Esc to go back and fix failures.</Text>}
    </Box>
  );
}
