import * as actionCore from '@actions/core';
import * as github from '@actions/github';
import type { MockInstance } from 'vitest';
import { prlint } from '../main/linterService.js';

vi.mock('@actions/core');
vi.mock('@actions/github');

const setCtx = (title: string, branch: string) => {
  Object.defineProperty(github, 'context', {
    value: {
      payload: {
        eventName: 'pull_request_target',
        pull_request: {
          title: title,
          head: {
            ref: branch,
          },
        },
      },
    },
  });
};

let setFailedSpy: MockInstance;
let errorSpy: MockInstance;

describe('PR Linter', () => {
  beforeEach(() => {
    setFailedSpy = vi.spyOn(actionCore, 'setFailed');
    errorSpy = vi.spyOn(actionCore, 'error');
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('prlint', () => {
    test('that prlint should not fail when pull request validates', async () => {
      setCtx('chore(): fix something', 'chore/fix-something');
      await prlint();
      expect(setFailedSpy).toHaveBeenCalledTimes(0);
    });

    test('that prlint should fail when not pull request event', async () => {
      Object.defineProperty(github, 'context', {
        value: {
          eventName: 'push',
          payload: {},
        },
      });

      await prlint();
      expect(setFailedSpy).toHaveBeenCalledTimes(1);
      expect(setFailedSpy).toHaveBeenCalledWith(
        'Unsupported GitHub event: push - this action only supports pull https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request',
      );
    });

    test('that prlint should fail when pull request title is missing subject and type', async () => {
      setCtx('ya de da', 'chore_fix-something');

      await prlint();
      expect(errorSpy).toHaveBeenCalledTimes(2);
      expect(errorSpy).toHaveBeenNthCalledWith(1, '- subject may not be empty');
      expect(errorSpy).toHaveBeenNthCalledWith(2, '- type may not be empty');
      expect(setFailedSpy).toHaveBeenCalledTimes(1);
      expect(setFailedSpy).toHaveBeenCalledWith(
        'Pull Request title does not conform to the conventional commit spec. For help see: https://github.com/conventional-changelog/commitlint/#what-is-commitlint',
      );
    });

    test('that prlint should fail when pull request scope has lowercase jira-', async () => {
      setCtx('feat(jira-123): ya de da', 'chore_fix-something');

      await prlint();
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenNthCalledWith(1, '- scope should have uppercase JIRA- prefix');
      expect(setFailedSpy).toHaveBeenCalledTimes(1);
      expect(setFailedSpy).toHaveBeenCalledWith(
        'Pull Request title does not conform to the conventional commit spec. For help see: https://github.com/conventional-changelog/commitlint/#what-is-commitlint',
      );
    });

    test('that prlint should pass when pull request scope has uppercase JIRA-', async () => {
      setCtx('feat(JIRA-123): ya de da', 'chore_fix-something');

      await prlint();
      expect(errorSpy).toHaveBeenCalledTimes(0);
      expect(setFailedSpy).toHaveBeenCalledTimes(0);
    });

    test('that prlint should pass when pull request scope is generic', async () => {
      setCtx('chore(prlint): fix something', 'chore/fix-something');
      await prlint();
      expect(setFailedSpy).toHaveBeenCalledTimes(0);
    });

    test('that prlint should fail when pull request title has invalid type', async () => {
      setCtx('bug: ya de da', 'chore_fix-something');

      await prlint();
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenNthCalledWith(
        1,
        '- type must be one of [build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test]',
      );
      expect(setFailedSpy).toHaveBeenCalledTimes(1);
      expect(setFailedSpy).toHaveBeenCalledWith(
        'Pull Request title does not conform to the conventional commit spec. For help see: https://github.com/conventional-changelog/commitlint/#what-is-commitlint',
      );
    });

    test.each([
      {
        title: 'fix: Sentence case',
        expectedError: '- subject must not be sentence-case',
      },
      {
        title: 'fix: Start Case',
        expectedError: '- subject must not be sentence-case, start-case',
      },
      {
        title: 'fix: UPPER CASE',
        expectedError: '- subject must not be sentence-case, start-case, upper-case',
      },
      {
        title: 'fix: PascalCase',
        expectedError: '- subject must not be sentence-case, pascal-case',
      },
    ])('that prlint should fail when pr title has a subject with invalid case: $title', async ({ title, expectedError }) => {
      setCtx(title, 'chore_fix-something');

      await prlint();
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenNthCalledWith(1, expectedError);
      expect(setFailedSpy).toHaveBeenCalledTimes(1);
      expect(setFailedSpy).toHaveBeenCalledWith(
        'Pull Request title does not conform to the conventional commit spec. For help see: https://github.com/conventional-changelog/commitlint/#what-is-commitlint',
      );
    });

    test.each(['Merge branch foo', 'Revert "feat: something"', 'fixup! wip', '1.2.3'])(
      'that prlint should not apply commitlint default ignores to pr title: %s',
      async (title) => {
        setCtx(title, 'chore_fix-something');

        await prlint();
        expect(errorSpy).toHaveBeenCalledTimes(2);
        expect(errorSpy).toHaveBeenNthCalledWith(1, '- subject may not be empty');
        expect(errorSpy).toHaveBeenNthCalledWith(2, '- type may not be empty');
        expect(setFailedSpy).toHaveBeenCalledTimes(1);
      },
    );

    test.each(['', '   ', undefined])('that prlint should fail when pr title is missing or empty: %j', async (title) => {
      setCtx(title as string, 'chore_fix-something');

      await prlint();
      expect(setFailedSpy).toHaveBeenCalledTimes(1);
      expect(setFailedSpy).toHaveBeenCalledWith('Pull Request title is missing or empty');
    });
  });
});
