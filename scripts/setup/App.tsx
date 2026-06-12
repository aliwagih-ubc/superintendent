import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { WelcomeStep } from './steps/WelcomeStep.js';
import { LinearStep } from './steps/LinearStep.js';
import { AnthropicStep } from './steps/AnthropicStep.js';
import { RepoStep } from './steps/RepoStep.js';
import { AgentSettingsStep } from './steps/AgentSettingsStep.js';
import { SupabaseStep } from './steps/SupabaseStep.js';
import { PreflightStep } from './steps/PreflightStep.js';
import { CompleteStep } from './steps/CompleteStep.js';
import { loadProgress, saveProgress } from './lib/persistence.js';
import { type SetupState, type StepId } from './lib/schema.js';

const ORDER: StepId[] = ['welcome', 'linear', 'anthropic', 'repo', 'agentSettings', 'supabase', 'preflight', 'complete'];

type Props = { cwd: string; onComplete?: (action: 'dev' | 'doctor') => void };

export function App({ cwd, onComplete }: Props) {
  const [state, setState] = useState<SetupState>(() => loadProgress(cwd));
  const [stepIndex, setStepIndex] = useState<number>(() => {
    const initial = loadProgress(cwd);
    const lastDone = initial.completedSteps[initial.completedSteps.length - 1];
    if (!lastDone) return 0;
    const idx = ORDER.indexOf(lastDone);
    return Math.min(idx + 1, ORDER.length - 1);
  });

  function update(patch: Partial<SetupState>) {
    setState((prev) => {
      const next = { ...prev, ...patch };
      saveProgress(cwd, next);
      return next;
    });
  }

  function next() {
    setState((prev) => {
      const id = ORDER[stepIndex];
      if (!id) return prev;
      const completed: StepId[] = prev.completedSteps.includes(id)
        ? prev.completedSteps
        : [...prev.completedSteps, id];
      const updated = { ...prev, completedSteps: completed };
      saveProgress(cwd, updated);
      return updated;
    });
    setStepIndex((i) => Math.min(i + 1, ORDER.length - 1));
  }

  function back() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  const stepProps = { state, onUpdate: update, onNext: next, onBack: back };
  const currentStepId = ORDER[stepIndex];

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text dimColor>[{stepIndex + 1}/{ORDER.length}] {currentStepId}</Text>
      </Box>
      {stepIndex === 0 && <WelcomeStep {...stepProps} />}
      {stepIndex === 1 && <LinearStep {...stepProps} />}
      {stepIndex === 2 && <AnthropicStep {...stepProps} />}
      {stepIndex === 3 && <RepoStep {...stepProps} />}
      {stepIndex === 4 && <AgentSettingsStep {...stepProps} />}
      {stepIndex === 5 && <SupabaseStep {...stepProps} />}
      {stepIndex === 6 && <PreflightStep {...stepProps} cwd={cwd} />}
      {stepIndex === 7 && <CompleteStep state={state} onAction={onComplete} />}
    </Box>
  );
}
