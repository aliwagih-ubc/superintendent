import React from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import type { SetupState } from '../lib/schema.js';

type Props = { state: SetupState };

export function CompleteStep(_: Props) {
  const { exit } = useApp();
  useInput((_, k) => { if (k.return) exit(); });

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="green">✓ Setup complete</Text>
      <Text>Next steps:</Text>
      <Box flexDirection="column" marginLeft={2}>
        <Text>1. Start the daemon:    <Text bold>npm run dev</Text></Text>
        <Text>2. Re-check config:     <Text bold>npm run doctor</Text></Text>
        <Text>3. Inspect sessions:    <Text bold>npm run session</Text></Text>
      </Box>
      <Text dimColor>.env was written. Press Enter to exit.</Text>
    </Box>
  );
}
