import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listLinearTeams } from '../../scripts/setup/lib/validate.js';

test('listLinearTeams returns teams from the connection', async () => {
  const fakeClient = {
    teams: () => Promise.resolve({
      nodes: [
        { id: 't1', key: 'ENG', name: 'Engineering' },
        { id: 't2', key: 'OPS', name: 'Operations' },
      ],
    }),
  };
  const result = await listLinearTeams('lin_api_ok', () => fakeClient as any);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.teams.length, 2);
    assert.equal(result.teams[0]?.key, 'ENG');
  }
});

test('listLinearTeams returns error when call throws', async () => {
  const builder = () => ({ teams: () => Promise.reject(new Error('boom')) });
  const result = await listLinearTeams('lin_api_x', builder as any);
  assert.equal(result.ok, false);
});
