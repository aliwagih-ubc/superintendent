import { spawn, ChildProcess, execSync } from 'node:child_process';
import fs from 'node:fs';
import { config } from '../../config.js';
import { createChildLogger } from '../../utils/logger.js';
import { costRecorder } from '../../cost/recorder.js';
import { getProvider } from '../providers/index.js';
import { claudeCodeProvider } from '../providers/claude-code.js';
import { filesChangedSince } from '../providers/git-files.js';
import type { CodingProvider, ProviderName } from '../providers/types.js';

// Find the claude binary path at startup
function findClaudePath(): string {
  try {
    // Try to find claude in PATH
    const claudePath = execSync('which claude', { encoding: 'utf-8' }).trim();
    if (claudePath) {
      return claudePath;
    }
  } catch {
    // which failed, try common locations
  }

  // Fallback to npx which should always work if @anthropic-ai/claude-code is installed
  return 'npx';
}

const CLAUDE_PATH = findClaudePath();
const USE_NPX = CLAUDE_PATH === 'npx';
import {
  type AgentConfig,
  type AgentInput,
  type AgentOutput,
  CodeExecutorInputSchema,
  CodeExecutorOutputSchema,
  type CodeExecutorInput,
  type CodeExecutorOutput,
  type Agent,
  AgentExecutionError,
  AgentTimeoutError,
} from '../core/index.js';
import type { SessionRecord } from '../../sessions/index.js';

const logger = createChildLogger({ module: 'code-executor' });

/**
 * Context passed to execution methods for session tracking
 */
export interface ExecutionContext {
  /** Callback invoked when Claude Code's session ID is captured from output */
  onSessionIdCaptured?: (sessionId: string) => void;
}

export class CodeExecutorAgent implements Agent<CodeExecutorInput, CodeExecutorOutput> {
  readonly config: AgentConfig = {
    type: 'code-executor',
    name: 'CodeExecutor',
    description: 'Executes Claude Code CLI for implementation',
    modelTier: 'advanced', // Uses external Claude Code
    cacheable: false,
    maxConcurrent: config.agents.maxConcurrent,
    timeoutMs: config.agents.timeoutMinutes * 60 * 1000,
  };

  readonly inputSchema = CodeExecutorInputSchema;
  readonly outputSchema = CodeExecutorOutputSchema;

  private runningProcesses: Map<string, { process: ChildProcess; ticketId: string; recentOutput: string[]; startedAt: Date }> = new Map();
  private readonly MAX_OUTPUT_LINES = 5; // Keep last N lines for UI display
  private jsonBuffer: Map<string, string> = new Map(); // Buffer for incomplete JSON lines
  private capturedSessionIds: Map<string, string> = new Map(); // processId -> Claude session ID

  validateInput(input: unknown): CodeExecutorInput {
    return this.inputSchema.parse(input);
  }

  async execute(
    input: AgentInput<CodeExecutorInput>,
    context?: ExecutionContext
  ): Promise<AgentOutput<CodeExecutorOutput>> {
    const startTime = Date.now();
    const { ticketIdentifier, prompt, worktreePath, branchName } = input.data;
    const providerName: ProviderName = input.data.provider ?? config.agents.codingProvider;
    const provider = getProvider(providerName);

    logger.info(
      { ticketId: ticketIdentifier, worktree: worktreePath, branch: branchName, provider: providerName },
      'Starting code execution'
    );

    try {
      const result = await this.runProvider(provider, input.data.baseSha, ticketIdentifier, prompt, worktreePath, context);
      const durationMs = Date.now() - startTime;

      if (result.costUsd !== undefined) {
        costRecorder.record({
          ticketId: input.ticketId,
          ticketIdentifier: input.ticketIdentifier,
          agentType: providerName,
          model: providerName,
          source: 'claude_code',
          costUsd: result.costUsd,
        });
      }

      return {
        success: result.success,
        data: result,
        metadata: {
          modelUsed: providerName,
          durationMs,
          cached: false,
        },
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;

      if (error instanceof AgentTimeoutError || error instanceof AgentExecutionError) {
        return {
          success: false,
          error: error.message,
          metadata: {
            modelUsed: providerName,
            durationMs,
            cached: false,
          },
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          modelUsed: providerName,
          durationMs,
          cached: false,
        },
      };
    }
  }

  private async runProvider(
    provider: CodingProvider,
    baseSha: string | undefined,
    ticketIdentifier: string,
    prompt: string,
    worktreePath: string,
    context?: ExecutionContext
  ): Promise<CodeExecutorOutput> {
    return new Promise((resolve, reject) => {
      let output = '';
      const timeoutMs = this.config.timeoutMs!;
      let sessionIdCaptured = false;

      const spawnSpec = provider.buildSpawn(prompt, worktreePath);

      // Verify worktree exists before spawning
      if (!fs.existsSync(worktreePath)) {
        reject(new AgentExecutionError(
          'code-executor',
          ticketIdentifier,
          `Worktree path does not exist: ${worktreePath}. The worktree may need to be recreated.`,
          false // Don't retry - worktree issue needs to be fixed
        ));
        return;
      }

      logger.info(
        { ticketId: ticketIdentifier, provider: provider.name, command: spawnSpec.command, cwd: worktreePath, promptLength: prompt.length },
        'Spawning coding provider'
      );

      const childProcess = spawn(
        spawnSpec.command,
        spawnSpec.args,
        {
          cwd: worktreePath,
          env: {
            ...process.env,
            ...spawnSpec.env,
          },
          stdio: ['ignore', 'pipe', 'pipe'], // No stdin needed - prompt is in args
        }
      );

      const processId = `exec-${ticketIdentifier}-${Date.now()}`;
      const processEntry = { process: childProcess, ticketId: ticketIdentifier, recentOutput: [] as string[], startedAt: new Date() };
      this.runningProcesses.set(processId, processEntry);

      // Set timeout
      const timeout = setTimeout(() => {
        logger.warn({ ticketId: ticketIdentifier }, 'Claude Code execution timed out');
        this.killProcess(processId);
        reject(new AgentTimeoutError('code-executor', ticketIdentifier, timeoutMs));
      }, timeoutMs);

      childProcess.stdout?.on('data', (data: Buffer) => {
        const text = data.toString();
        output += text;
        // Update recent output for UI display
        this.appendRecentOutput(processEntry, text, processId);
        logger.debug({ ticketId: ticketIdentifier, bytes: text.length }, 'Claude Code output');

        // Try to capture session ID from stream-json output (only once)
        if (!sessionIdCaptured && context?.onSessionIdCaptured) {
          const sessionId = this.extractSessionIdFromOutput(text);
          if (sessionId) {
            sessionIdCaptured = true;
            this.capturedSessionIds.set(processId, sessionId);
            context.onSessionIdCaptured(sessionId);
            logger.info({ ticketId: ticketIdentifier, sessionId }, 'Captured Claude Code session ID');
          }
        }
      });

      childProcess.stderr?.on('data', (data: Buffer) => {
        const text = data.toString();
        output += text;
        // Update recent output for UI display (stderr too)
        this.appendRecentOutput(processEntry, text, processId);
        logger.warn({ ticketId: ticketIdentifier, stderr: text.slice(0, 200) }, 'Claude Code stderr');
      });

      childProcess.on('close', (code: number | null) => {
        clearTimeout(timeout);
        this.runningProcesses.delete(processId);
        this.clearJsonBuffer(processId);
        this.capturedSessionIds.delete(processId);

        const parsed = provider.parseOutput(output, code);
        const filesModified = baseSha ? filesChangedSince(worktreePath, baseSha) : [];
        logger.info(
          { ticketId: ticketIdentifier, provider: provider.name, success: parsed.success, prUrl: parsed.prUrl, exitCode: code },
          'Coding provider execution completed'
        );
        resolve({
          success: parsed.success,
          prUrl: parsed.prUrl,
          commitSha: parsed.commitSha,
          filesModified,
          testResults: parsed.testResults,
          error: parsed.error,
          output,
          costUsd: parsed.costUsd,
        });
      });

      childProcess.on('error', (error: Error) => {
        clearTimeout(timeout);
        this.runningProcesses.delete(processId);
        this.clearJsonBuffer(processId);
        this.capturedSessionIds.delete(processId);
        reject(new AgentExecutionError(
          'code-executor',
          ticketIdentifier,
          `Process error: ${error.message}`,
          true,
          error
        ));
      });
    });
  }

  private killProcess(processId: string): void {
    const entry = this.runningProcesses.get(processId);
    if (entry && !entry.process.killed) {
      entry.process.kill('SIGTERM');
      setTimeout(() => {
        if (!entry.process.killed) {
          entry.process.kill('SIGKILL');
        }
      }, 5000);
    }
    this.runningProcesses.delete(processId);
  }

  killAllProcesses(): void {
    for (const [processId] of this.runningProcesses) {
      this.killProcess(processId);
    }
  }

  getRunningCount(): number {
    return this.runningProcesses.size;
  }

  getRunningTickets(): string[] {
    return Array.from(this.runningProcesses.values()).map((e) => e.ticketId);
  }

  /**
   * Get detailed info about running agents for UI display
   */
  getRunningAgents(): Array<{ id: string; ticketId: string; recentOutput: string[]; startedAt: Date }> {
    return Array.from(this.runningProcesses.entries()).map(([id, entry]) => ({
      id,
      ticketId: entry.ticketId,
      recentOutput: entry.recentOutput,
      startedAt: entry.startedAt,
    }));
  }

  /**
   * Append text to recent output, keeping only the last N lines
   * Handles stream-json format from Claude Code
   */
  private appendRecentOutput(entry: { recentOutput: string[]; ticketId?: string }, text: string, processId?: string): void {
    // Get or create buffer for this process
    const bufferId = processId || 'default';
    let buffer = this.jsonBuffer.get(bufferId) || '';
    buffer += text;

    // Process complete lines (ending with newline)
    const lines = buffer.split('\n');

    // Keep the last incomplete line in the buffer
    const lastLine = lines.pop() || '';
    this.jsonBuffer.set(bufferId, lastLine);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Try to parse as JSON (stream-json format)
      const displayLine = this.extractDisplayLine(trimmed);
      if (!displayLine) continue;

      // Truncate long lines for display
      const truncated = displayLine.length > 80 ? displayLine.slice(0, 77) + '...' : displayLine;
      entry.recentOutput.push(truncated);

      // Keep only the last N lines
      if (entry.recentOutput.length > this.MAX_OUTPUT_LINES) {
        entry.recentOutput.shift();
      }
    }
  }

  /**
   * Clear the JSON buffer for a process (call on process exit)
   */
  private clearJsonBuffer(processId: string): void {
    this.jsonBuffer.delete(processId);
  }

  /**
   * Extract Claude Code session ID from stream-json output
   */
  private extractSessionIdFromOutput(text: string): string | null {
    // Look for sessionId in JSON lines
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('{')) continue;

      try {
        const json = JSON.parse(trimmed) as Record<string, unknown>;
        if (typeof json.sessionId === 'string' && json.sessionId.length > 0) {
          return json.sessionId;
        }
        // Also check nested in message or result objects
        if (json.message && typeof (json.message as Record<string, unknown>).sessionId === 'string') {
          return (json.message as Record<string, unknown>).sessionId as string;
        }
      } catch {
        // Not valid JSON, skip
      }
    }
    return null;
  }

  /**
   * Resume an interrupted Claude Code session
   */
  async resumeSession(session: SessionRecord): Promise<CodeExecutorOutput> {
    if (!session.sessionId) {
      throw new AgentExecutionError(
        'code-executor',
        session.ticketIdentifier,
        'Cannot resume session: no Claude Code session ID was captured',
        false
      );
    }

    if (!fs.existsSync(session.worktreePath)) {
      throw new AgentExecutionError(
        'code-executor',
        session.ticketIdentifier,
        `Cannot resume session: worktree no longer exists at ${session.worktreePath}`,
        false
      );
    }

    logger.info(
      { ticketId: session.ticketIdentifier, sessionId: session.sessionId, worktree: session.worktreePath },
      'Resuming Claude Code session'
    );

    // sessionId is guaranteed non-null by the check above
    const sessionId = session.sessionId;

    return new Promise((resolve, reject) => {
      let output = '';
      const timeoutMs = this.config.timeoutMs!;

      // Build args for resume mode
      const baseArgs: string[] = [
        '--resume', sessionId,               // Resume existing session
        '--dangerously-skip-permissions',    // Auto-approve all tool usage
        '--output-format', 'stream-json',    // Streaming JSON for real-time output
        '--verbose',                         // Required for stream-json
      ];
      const args: string[] = USE_NPX
        ? ['@anthropic-ai/claude-code', ...baseArgs]
        : baseArgs;

      logger.info(
        { ticketId: session.ticketIdentifier, sessionId, cwd: session.worktreePath },
        'Spawning Claude Code for session resume'
      );

      const childProcess = spawn(
        CLAUDE_PATH,
        args,
        {
          cwd: session.worktreePath,
          env: {
            ...process.env,
            CLAUDE_FLOW_NON_INTERACTIVE: 'true',
          },
          stdio: ['ignore', 'pipe', 'pipe'] as const,
        }
      );

      const processId = `resume-${session.ticketIdentifier}-${Date.now()}`;
      const processEntry = { process: childProcess, ticketId: session.ticketIdentifier, recentOutput: [] as string[], startedAt: new Date() };
      this.runningProcesses.set(processId, processEntry);

      const timeout = setTimeout(() => {
        logger.warn({ ticketId: session.ticketIdentifier }, 'Claude Code resume timed out');
        this.killProcess(processId);
        reject(new AgentTimeoutError('code-executor', session.ticketIdentifier, timeoutMs));
      }, timeoutMs);

      childProcess.stdout?.on('data', (data: Buffer) => {
        const text = data.toString();
        output += text;
        this.appendRecentOutput(processEntry, text, processId);
        logger.debug({ ticketId: session.ticketIdentifier, bytes: text.length }, 'Claude Code resume output');
      });

      childProcess.stderr?.on('data', (data: Buffer) => {
        const text = data.toString();
        output += text;
        this.appendRecentOutput(processEntry, text, processId);
        logger.warn({ ticketId: session.ticketIdentifier, stderr: text.slice(0, 200) }, 'Claude Code resume stderr');
      });

      childProcess.on('close', (code: number | null) => {
        clearTimeout(timeout);
        this.runningProcesses.delete(processId);
        this.clearJsonBuffer(processId);

        const parsed = claudeCodeProvider.parseOutput(output, code);
        resolve({
          success: parsed.success,
          prUrl: parsed.prUrl,
          commitSha: parsed.commitSha,
          filesModified: [],
          testResults: parsed.testResults,
          error: parsed.error,
          output,
          costUsd: parsed.costUsd,
        });
      });

      childProcess.on('error', (error: Error) => {
        clearTimeout(timeout);
        this.runningProcesses.delete(processId);
        this.clearJsonBuffer(processId);
        reject(new AgentExecutionError(
          'code-executor',
          session.ticketIdentifier,
          `Resume process error: ${error.message}`,
          true,
          error
        ));
      });
    });
  }

  /**
   * Extract a human-readable line from stream-json output
   */
  private extractDisplayLine(line: string): string | null {
    // Try to parse as JSON
    if (line.trim().startsWith('{')) {
      try {
        const json = JSON.parse(line) as Record<string, unknown>;

        // Handle different message types from Claude Code stream-json
        const type = json.type as string | undefined;

        if (type === 'assistant' && json.message) {
          const msg = json.message as { content?: Array<{ type: string; text?: string; name?: string; input?: Record<string, unknown> }> };
          if (msg.content) {
            for (const block of msg.content) {
              if (block.type === 'text' && block.text) {
                // Clean up the text - remove markdown formatting for display
                const cleanText = block.text
                  .replace(/```[\s\S]*?```/g, '[code]') // Replace code blocks
                  .replace(/\n+/g, ' ') // Collapse newlines
                  .trim();
                return `💬 ${cleanText.slice(0, 80)}`;
              }
              if (block.type === 'tool_use' && block.name) {
                // Show tool name with relevant context from input
                const input = block.input;
                let context = '';
                if (input) {
                  // Extract useful context based on tool type
                  if (block.name === 'Read' && input.file_path) {
                    const filePath = String(input.file_path);
                    context = ` → ${filePath.split('/').slice(-2).join('/')}`;
                  } else if (block.name === 'Write' && input.file_path) {
                    const filePath = String(input.file_path);
                    context = ` → ${filePath.split('/').slice(-2).join('/')}`;
                  } else if (block.name === 'Edit' && input.file_path) {
                    const filePath = String(input.file_path);
                    context = ` → ${filePath.split('/').slice(-2).join('/')}`;
                  } else if (block.name === 'Bash' && input.command) {
                    const cmd = String(input.command).slice(0, 40);
                    context = ` → ${cmd}${String(input.command).length > 40 ? '...' : ''}`;
                  } else if (block.name === 'Grep' && input.pattern) {
                    context = ` → "${input.pattern}"`;
                  } else if (block.name === 'Glob' && input.pattern) {
                    context = ` → ${input.pattern}`;
                  }
                }
                return `🔧 ${block.name}${context}`;
              }
            }
          }
        }

        // Skip 'user' type messages - these are tool results and aren't useful to display
        if (type === 'user') {
          return null;
        }

        if (type === 'result') {
          const result = json.result as string | undefined;
          if (result) {
            // Clean up result text
            const cleanResult = result.replace(/\n+/g, ' ').trim();
            return `✅ ${cleanResult.slice(0, 60)}`;
          }
          if (json.is_error) {
            return `❌ Error: ${(json.error as string) || 'Unknown error'}`;
          }
        }

        if (type === 'system' && json.message) {
          return `ℹ️ ${String(json.message).slice(0, 60)}`;
        }

        // Skip other internal message types that aren't useful to display
        if (type === 'content_block_start' || type === 'content_block_delta' || type === 'content_block_stop') {
          return null;
        }

        return null;
      } catch {
        // Not valid JSON, treat as plain text
      }
    }

    // Plain text output (non-JSON)
    const trimmed = line.trim();
    // Skip empty or very short lines
    if (trimmed.length < 3) return null;
    return trimmed;
  }
}

export const codeExecutorAgent = new CodeExecutorAgent();
