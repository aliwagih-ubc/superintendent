import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { TextInput } from '@inkjs/ui';
import { validateRepoPath } from '../lib/validate.js';
import type { SetupState } from '../lib/schema.js';

type Props = {
  state: SetupState;
  onUpdate: (patch: Partial<SetupState>) => void;
  onNext: () => void;
  onBack: () => void;
};

export function RepoStep({ state, onUpdate, onNext, onBack }: Props) {
  const [path, setPath] = useState(state.AGENTS_WORK_DIR ?? '');
  const [error, setError] = useState<string | null>(null);
  const [githubRepo, setGithubRepo] = useState<string | null>(null);

  useInput((_, k) => {
    if (k.escape) onBack();
  });

  function submit(val: string) {
    setPath(val);
    setError(null);
    const v = validateRepoPath(val);
    if (!v.ok) {
      setError(v.error);
      return;
    }
    setGithubRepo(v.githubRepo);
    onUpdate({ AGENTS_WORK_DIR: val, GITHUB_REPO: v.githubRepo });
    onNext();
  }

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">Step 4 of 7: Target repository</Text>
      <Text>The project the AI agents will actually write code in.</Text>
      <Text dimColor>Give the full path to a folder already on this computer (a git clone of your GitHub repo).</Text>
      <Text dimColor>Its `origin` remote must point at github.com.</Text>
      <Text dimColor>Example: /Users/you/code/my-repo</Text>
      <Box>
        <Text>Path: </Text>
        <TextInput defaultValue={path} onSubmit={submit} />
      </Box>
      {error && <Text color="red">✗ {error}</Text>}
      {githubRepo && <Text color="green">✓ github: {githubRepo}</Text>}
      <Text dimColor>Esc to go back.</Text>
    </Box>
  );
}
