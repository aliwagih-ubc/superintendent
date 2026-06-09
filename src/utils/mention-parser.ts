/**
 * Parse @superintendent mentions from Linear comments.
 * Extracts the command word following the mention.
 */

export type SuperintendentCommand = 'clarify' | 'rewrite' | 'work' | 'plan' | 'help';

export interface ParsedMention {
  found: boolean;
  command: SuperintendentCommand | null;
  rawText: string;
}

const VALID_COMMANDS = ['clarify', 'rewrite', 'work', 'plan'] as const;

/**
 * Parse a comment body for @superintendent mentions.
 *
 * @param commentBody - The raw comment text from Linear
 * @returns ParsedMention with found=true if mention detected
 *
 * Examples:
 *   "@superintendent clarify" -> { found: true, command: 'clarify' }
 *   "@superintendent work"    -> { found: true, command: 'work' }
 *   "@Superintendent"         -> { found: true, command: 'help' }
 *   "@superintendent unknown"  -> { found: true, command: 'help' }
 *   "hello world"        -> { found: false, command: null }
 */
export function parseMention(commentBody: string): ParsedMention {
  // Match @superintendent (case-insensitive), optionally followed by whitespace and a word
  const mentionRegex = /@superintendent\s*(\w*)/i;
  const match = commentBody.match(mentionRegex);

  if (!match) {
    return { found: false, command: null, rawText: '' };
  }

  const commandWord = match[1]?.toLowerCase() || '';

  // Map to valid commands, default to 'help' for unknown/empty
  const command: SuperintendentCommand = VALID_COMMANDS.includes(
    commandWord as (typeof VALID_COMMANDS)[number]
  )
    ? (commandWord as SuperintendentCommand)
    : 'help';

  return { found: true, command, rawText: match[0] };
}

/**
 * Get the help text to display when user sends empty mention or unknown command.
 */
export function getHelpText(): string {
  return `**Superintendent Commands**

- \`@superintendent plan\` - Enter planning mode to gather requirements through Q&A
- \`@superintendent clarify\` - Ask clarifying questions to understand requirements
- \`@superintendent rewrite\` - Consolidate discussion into an updated description
- \`@superintendent work\` - Start implementing this ticket

Mention me without a command to see this help.`;
}
