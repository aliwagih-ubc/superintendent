#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { argv, exit } from 'node:process';

const COMMANDS = {
  setup: 'setup',
  doctor: 'doctor',
  start: 'dev',
  dev: 'dev',
  session: 'session',
  auth: 'auth',
};

const sub = argv[2];
const rest = argv.slice(3);

if (!sub || sub === '--help' || sub === '-h') {
  console.log('Usage: super <command>');
  console.log('');
  console.log('Commands:');
  console.log('  setup     Run the interactive setup wizard');
  console.log('  doctor    Re-validate your .env');
  console.log('  start     Start the daemon (alias: dev)');
  console.log('  session   Inspect agent sessions');
  console.log('  auth      Re-do Linear auth');
  exit(sub ? 0 : 1);
}

const npmScript = COMMANDS[sub];
if (!npmScript) {
  console.error(`Unknown command: ${sub}`);
  exit(2);
}

const child = spawn('npm', ['run', npmScript, ...(rest.length ? ['--', ...rest] : [])], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
child.on('exit', (code) => exit(code ?? 0));
