// Smoke tests for the bundled action (dist/index.mjs), run with `npm run test:dist` after `npm run build`.
//
// The bundle is copied to an empty temp directory and run the way GitHub runs a node24 action:
// a plain `node` process with an event payload file and no node_modules to fall back on.
// This catches bundling problems (missing dependencies, broken dynamic requires) that the
// Vitest unit tests cannot see, because they run the TypeScript source.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../../dist/index.mjs', import.meta.url));

let dir: string;

before(() => {
  assert.ok(existsSync(DIST), `${DIST} not found, run "npm run build" first`);
  dir = mkdtempSync(join(tmpdir(), 'prlint-dist-'));
  copyFileSync(DIST, join(dir, 'index.mjs'));
});

after(() => {
  rmSync(dir, { recursive: true, force: true });
});

const runAction = (eventName: string, payload: object) => {
  const eventPath = join(dir, 'event.json');
  writeFileSync(eventPath, JSON.stringify(payload));
  const result = spawnSync(process.execPath, [join(dir, 'index.mjs')], {
    cwd: dir,
    encoding: 'utf8',
    // Only pass what the action needs, so runner variables (GITHUB_OUTPUT, GITHUB_STEP_SUMMARY, ...)
    // from the CI job running these tests don't leak into the child process.
    env: { PATH: process.env.PATH, GITHUB_EVENT_NAME: eventName, GITHUB_EVENT_PATH: eventPath },
  });
  const errors = result.stdout
    .split('\n')
    .filter((line) => line.startsWith('::error::'))
    .map((line) => line.slice('::error::'.length));
  return { status: result.status, errors, stderr: result.stderr };
};

const runForTitle = (title: unknown) => runAction('pull_request', { pull_request: { title } });

describe('dist/index.mjs', () => {
  for (const title of ['feat: add thing', 'fix(JIRA-123): handle empty input', 'chore(deps): update dependency foo to v2']) {
    test(`passes a valid title: ${title}`, () => {
      const { status, errors, stderr } = runForTitle(title);
      assert.deepEqual(errors, [], stderr);
      assert.equal(status, 0, stderr);
    });
  }

  const failures: Array<{ title: unknown; expected: string }> = [
    { title: 'bug: ya de da', expected: '- type must be one of' },
    { title: 'feat(jira-123): ya de da', expected: '- scope should have uppercase JIRA- prefix' },
    { title: 'fix: Sentence case', expected: '- subject must not be sentence-case' },
    { title: 'Merge branch foo', expected: '- type may not be empty' },
    { title: '   ', expected: 'Pull Request title is missing or empty' },
    { title: undefined, expected: 'Pull Request title is missing or empty' },
  ];

  for (const { title, expected } of failures) {
    test(`fails an invalid title: ${JSON.stringify(title)}`, () => {
      const { status, errors, stderr } = runForTitle(title);
      assert.equal(status, 1, stderr);
      assert.ok(
        errors.some((error) => error.startsWith(expected)),
        `expected an error starting with "${expected}", got:\n${errors.join('\n')}\n${stderr}`,
      );
    });
  }

  test('fails on an event that is not a pull request', () => {
    const { status, errors, stderr } = runAction('push', {});
    assert.equal(status, 1, stderr);
    assert.ok(
      errors.some((error) => error.startsWith('Unsupported GitHub event: push')),
      errors.join('\n'),
    );
  });
});
