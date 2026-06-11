import { z } from 'zod';

export const StepIdSchema = z.enum([
  'welcome',
  'linear',
  'anthropic',
  'repo',
  'agentSettings',
  'preflight',
  'complete',
]);
export type StepId = z.infer<typeof StepIdSchema>;

export const SetupStateSchema = z.strictObject({
  // Linear
  LINEAR_WORKSPACE_SLUG: z.string().optional(),
  LINEAR_CLIENT_ID: z.string().optional(),
  LINEAR_CLIENT_SECRET: z.string().optional(),
  LINEAR_TEAM_ID: z.string().uuid().optional(),
  LINEAR_PROJECT_ID: z.string().uuid().optional(),
  LINEAR_PERSONAL_TOKEN: z.string().optional(),
  linearAuthMode: z.enum(['oauth', 'pat']).default('pat'),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-4-6'),

  // Repo
  GITHUB_REPO: z.string().optional(),
  AGENTS_WORK_DIR: z.string().optional(),

  // Agent settings
  AGENTS_MAX_CONCURRENT: z.number().int().min(1).max(20).default(5),
  AGENTS_MAX_CODE_EXECUTORS: z.number().int().min(1).max(10).default(1),
  AGENTS_TIMEOUT_MINUTES: z.number().int().min(1).max(1440).default(60),
  AGENTS_MAX_RETRIES: z.number().int().min(0).max(10).default(2),

  // Daemon
  DAEMON_POLL_INTERVAL_SECONDS: z.number().int().min(5).max(3600).default(30),

  // Progress tracking
  completedSteps: z.array(StepIdSchema).default([]),
});
export type SetupState = z.infer<typeof SetupStateSchema>;

export function defaultSetupState(): SetupState {
  return SetupStateSchema.parse({});
}
