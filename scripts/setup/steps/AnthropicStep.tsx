import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { TextInput } from '@inkjs/ui';
import Spinner from 'ink-spinner';
import { validateAnthropicKey } from '../lib/validate.js';
import type { SetupState } from '../lib/schema.js';

type Props = {
  state: SetupState;
  onUpdate: (patch: Partial<SetupState>) => void;
  onNext: () => void;
  onBack: () => void;
};

const MODELS = [
  { id: 'claude-haiku-4-5', label: 'Haiku 4.5  (fastest, cheapest)' },
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6 (default, best balance)' },
  { id: 'claude-opus-4-8',  label: 'Opus 4.8   (highest quality, slower)' },
];

type Phase = 'enter-key' | 'validating' | 'choose-model';

export function AnthropicStep({ state, onUpdate, onNext, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('enter-key');
  const [key, setKey] = useState(state.ANTHROPIC_API_KEY ?? '');
  const [error, setError] = useState<string | null>(null);
  const [modelIndex, setModelIndex] = useState(
    Math.max(0, MODELS.findIndex((m) => m.id === state.ANTHROPIC_MODEL)),
  );

  useInput((_, k) => {
    if (k.escape) onBack();
    if (phase === 'choose-model') {
      if (k.upArrow) setModelIndex((i) => Math.max(0, i - 1));
      if (k.downArrow) setModelIndex((i) => Math.min(MODELS.length - 1, i + 1));
      if (k.return) {
        const model = MODELS[modelIndex];
        if (model) {
          onUpdate({ ANTHROPIC_API_KEY: key, ANTHROPIC_MODEL: model.id });
          onNext();
        }
      }
    }
  });

  async function submitKey(val: string) {
    setKey(val);
    setPhase('validating');
    setError(null);
    const model = MODELS[modelIndex];
    if (!model) return;
    const v = await validateAnthropicKey(val, model.id);
    if (!v.ok) {
      setError(v.error);
      setPhase('enter-key');
      return;
    }
    setPhase('choose-model');
  }

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">Step 3 of 7: Anthropic</Text>

      {phase === 'enter-key' && (
        <>
          <Text>Paste your Anthropic API key (starts with sk-ant-):</Text>
          <Box>
            <Text>Key: </Text>
            <TextInput defaultValue={key} onSubmit={submitKey} />
          </Box>
          {error && <Text color="red">✗ {error}</Text>}
          <Text dimColor>Esc to go back.</Text>
        </>
      )}

      {phase === 'validating' && (
        <Box>
          <Spinner type="dots" />
          <Text> Validating key with a 1-token call...</Text>
        </Box>
      )}

      {phase === 'choose-model' && (
        <>
          <Text color="green">✓ key valid</Text>
          <Text>Choose default model:</Text>
          {MODELS.map((m, i) => (
            <Text key={m.id} color={i === modelIndex ? 'cyan' : undefined}>
              {i === modelIndex ? '▶ ' : '  '}{m.label}
            </Text>
          ))}
          <Text dimColor>↑/↓ to choose · Enter to confirm · Esc to go back.</Text>
        </>
      )}
    </Box>
  );
}
