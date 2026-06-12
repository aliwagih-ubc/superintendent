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

type Phase = 'intro' | 'url' | 'key';

export function SupabaseStep({ state, onUpdate, onNext, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [url, setUrl] = useState(state.SUPABASE_URL ?? '');

  useInput((input, key) => {
    if (key.escape) onBack();
    if (phase === 'intro') {
      if (input === 's') onNext();
      if (key.return) setPhase('url');
    }
  });

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">Step 6 of 8: Hosted dashboard (optional)</Text>
      {phase === 'intro' && (
        <>
          <Text>Superintendent can push cost and status to Supabase so you get a hosted web dashboard.</Text>
          <Text dimColor>This is optional. Skip it and the daemon runs fully local, exactly as before.</Text>
          <Text>Press Enter to set it up, or s to skip.</Text>
        </>
      )}
      {phase === 'url' && (
        <Box>
          <Text>Supabase project URL: </Text>
          <TextInput defaultValue={url} onSubmit={(v) => { setUrl(v); onUpdate({ SUPABASE_URL: v }); setPhase('key'); }} />
        </Box>
      )}
      {phase === 'key' && (
        <Box>
          <Text>Service role key: </Text>
          <TextInput onSubmit={(v) => { onUpdate({ SUPABASE_SERVICE_ROLE_KEY: v }); onNext(); }} />
        </Box>
      )}
    </Box>
  );
}
