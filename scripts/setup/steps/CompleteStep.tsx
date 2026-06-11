import React from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import type { SetupState } from '../lib/schema.js';

type Props = {
  state: SetupState;
  onAction?: (action: 'dev' | 'doctor') => void;
};

export function CompleteStep({ onAction }: Props) {
  const { exit } = useApp();
  useInput((input, key) => {
    if (input === 'd') {
      onAction?.('dev');
      exit();
    } else if (input === 'r') {
      onAction?.('doctor');
      exit();
    } else if (key.return) {
      exit();
    }
  });

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="green">✓ Setup complete</Text>
      <Text>.env was written. What would you like to do?</Text>
      <Box flexDirection="column" marginLeft={2}>
        <Text><Text bold color="cyan">d</Text>      Start the daemon now (runs npm run dev)</Text>
        <Text><Text bold color="cyan">r</Text>      Re-check your config (runs npm run doctor)</Text>
        <Text><Text bold color="cyan">Enter</Text>  Exit to the shell</Text>
      </Box>
      <Text dimColor>Later, npm run session inspects agent sessions.</Text>
    </Box>
  );
}
