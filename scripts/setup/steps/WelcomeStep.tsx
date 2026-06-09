import React from 'react';
import { Box, Text, useInput } from 'ink';
import type { SetupState } from '../lib/schema.js';

type Props = {
  state: SetupState;
  onNext: () => void;
};

export function WelcomeStep({ onNext }: Props) {
  useInput((_, key) => {
    if (key.return) onNext();
  });

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">Superintendent: Setup Wizard</Text>
      <Text>
        Superintendent refines Linear tickets through structured questioning,
        plans the work, runs coding agents, and surfaces full project context,
        back to the same Linear ticket, for both developers and executives.
      </Text>
      <Text dimColor>
        This wizard takes ~3 minutes. You'll need:
      </Text>
      <Box flexDirection="column" marginLeft={2}>
        <Text>• A Linear API token (PAT or OAuth credentials)</Text>
        <Text>• An Anthropic API key</Text>
        <Text>• A local clone of the GitHub repo agents will work in</Text>
      </Box>
      <Text dimColor>Progress is saved after each step. Ctrl-c is safe.</Text>
      <Text bold color="green">Press Enter to begin.</Text>
    </Box>
  );
}
