import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { TextInput } from '@inkjs/ui';
import Spinner from 'ink-spinner';
import { validateLinearToken, listLinearTeams, type LinearTeam } from '../lib/validate.js';
import type { SetupState } from '../lib/schema.js';

type Props = {
  state: SetupState;
  onUpdate: (patch: Partial<SetupState>) => void;
  onNext: () => void;
  onBack: () => void;
};

type Phase = 'enter-token' | 'validating' | 'choose-team';

export function LinearStep({ state, onUpdate, onNext, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('enter-token');
  const [token, setToken] = useState(state.LINEAR_PERSONAL_TOKEN ?? '');
  const [error, setError] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [teams, setTeams] = useState<LinearTeam[]>([]);
  const [teamIndex, setTeamIndex] = useState(0);

  useInput((_, key) => {
    if (key.escape) onBack();
    if (phase === 'choose-team') {
      if (key.upArrow) setTeamIndex((i) => Math.max(0, i - 1));
      if (key.downArrow) setTeamIndex((i) => Math.min(teams.length - 1, i + 1));
      if (key.return) {
        const team = teams[teamIndex];
        if (team) {
          onUpdate({ LINEAR_TEAM_ID: team.id });
          onNext();
        }
      }
    }
  });

  async function submitToken(val: string) {
    setToken(val);
    setPhase('validating');
    setError(null);
    const v = await validateLinearToken(val);
    if (!v.ok) {
      setError(v.error);
      setPhase('enter-token');
      return;
    }
    setWorkspaceName(v.workspaceName);
    onUpdate({ LINEAR_PERSONAL_TOKEN: val });
    const t = await listLinearTeams(val);
    if (!t.ok) {
      setError(t.error);
      setPhase('enter-token');
      return;
    }
    setTeams(t.teams);
    setPhase('choose-team');
  }

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">Step 2 of 7: Linear</Text>

      {phase === 'enter-token' && (
        <>
          <Text>Paste your Linear API token. Create one at:</Text>
          <Text dimColor>https://linear.app/settings/api</Text>
          <Box>
            <Text>Token: </Text>
            <TextInput
              defaultValue={token}
              onSubmit={submitToken}
            />
          </Box>
          {error && <Text color="red">✗ {error}</Text>}
          <Text dimColor>Esc to go back.</Text>
        </>
      )}

      {phase === 'validating' && (
        <Box>
          <Spinner type="dots" />
          <Text> Validating token...</Text>
        </Box>
      )}

      {phase === 'choose-team' && (
        <>
          <Text color="green">✓ workspace: {workspaceName}</Text>
          <Text>Choose the team Superintendent should monitor:</Text>
          {teams.map((t, i) => (
            <Text key={t.id} color={i === teamIndex ? 'cyan' : undefined}>
              {i === teamIndex ? '▶ ' : '  '}{t.key} - {t.name}
            </Text>
          ))}
          <Text dimColor>↑/↓ to choose · Enter to confirm · Esc to go back.</Text>
        </>
      )}
    </Box>
  );
}
