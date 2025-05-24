import { prlint } from '../main/linterService.js';
import * as github from '@actions/github';
import * as actionCore from '@actions/core';
import { MockInstance } from 'vitest';

vi.mock('@actions/core');

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
        'Unsupported GitHub event: push - this action only supports pull https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request'
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
        'Pull Request title does not conform to the conventional commit spec. For help see: https://github.com/conventional-changelog/commitlint/#what-is-commitlint'
      );
    });

    test('that prlint should fail when pull request scope has lowercase jira-', async () => {
      setCtx('feat(jira-123): ya de da', 'chore_fix-something');

      await prlint();
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenNthCalledWith(1, '- scope should have uppercase JIRA- prefix');
      expect(setFailedSpy).toHaveBeenCalledTimes(1);
      expect(setFailedSpy).toHaveBeenCalledWith(
        'Pull Request title does not conform to the conventional commit spec. For help see: https://github.com/conventional-changelog/commitlint/#what-is-commitlint'
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
      expect(errorSpy).toHaveBeenNthCalledWith(1, '- type must be one of [build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test]');
      expect(setFailedSpy).toHaveBeenCalledTimes(1);
      expect(setFailedSpy).toHaveBeenCalledWith(
        'Pull Request title does not conform to the conventional commit spec. For help see: https://github.com/conventional-changelog/commitlint/#what-is-commitlint'
      );
    });

    test('that prlint should fail when pr title has a subject with invalid case', async () => {
      setCtx('fix: UPPER CASE', 'chore_fix-something');

      await prlint();
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenNthCalledWith(1, '- subject must not be sentence-case, start-case, pascal-case, upper-case');
      expect(setFailedSpy).toHaveBeenCalledTimes(1);
      expect(setFailedSpy).toHaveBeenCalledWith(
        'Pull Request title does not conform to the conventional commit spec. For help see: https://github.com/conventional-changelog/commitlint/#what-is-commitlint'
      );
    });
  });
});
