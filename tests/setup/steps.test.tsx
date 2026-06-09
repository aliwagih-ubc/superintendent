import { test } from 'node:test';
import assert from 'node:assert/strict';
import { render } from 'ink-testing-library';
import React from 'react';
import { WelcomeStep } from '../../scripts/setup/steps/WelcomeStep.js';
import { CompleteStep } from '../../scripts/setup/steps/CompleteStep.js';
import { defaultSetupState } from '../../scripts/setup/lib/schema.js';

test('WelcomeStep renders the title and instructions', () => {
  const { lastFrame } = render(<WelcomeStep state={defaultSetupState()} onNext={() => {}} />);
  const frame = lastFrame() ?? '';
  assert.match(frame, /Superintendent: Setup Wizard/);
  assert.match(frame, /3 minutes/);
});

test('CompleteStep renders next-steps', () => {
  const { lastFrame } = render(<CompleteStep state={defaultSetupState()} />);
  const frame = lastFrame() ?? '';
  assert.match(frame, /Setup complete/);
  assert.match(frame, /npm run dev/);
  assert.match(frame, /npm run doctor/);
});
