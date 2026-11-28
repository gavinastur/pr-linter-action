import { error, setFailed } from '@actions/core';
import { context } from '@actions/github';
import lint from '@commitlint/lint';
import type { LintOptions, LintOutcome } from '@commitlint/types';
import createPreset from 'conventional-changelog-conventionalcommits';
import { HELP_URL, plugins, rules } from './config/commitlint.rules.js';

const lintOptions: LintOptions = {
  // The preset's typings declare its return type as `{}`, but it returns { parser, writer, ... }.
  parserOpts: (createPreset() as { parser: LintOptions['parserOpts'] }).parser,
  plugins,
  // commitlint's default ignores (merge, revert, fixup!, semver, ...) are meant for commits, not PR titles
  defaultIgnores: false,
};

export const prlint = async (): Promise<void> => {
  console.log('prlint: Running');
  try {
    if (!context.payload.pull_request) {
      throw new Error(
        `Unsupported GitHub event: ${context.eventName} - this action only supports pull https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request`,
      );
    }

    const prTitle: unknown = context.payload.pull_request.title;
    if (typeof prTitle !== 'string' || !prTitle.trim()) {
      throw new Error('Pull Request title is missing or empty');
    }
    console.log(`prlint: pull request title: ${prTitle}`);

    const lintOutcome: LintOutcome = await lint(prTitle, rules, lintOptions);
    if (!lintOutcome.valid) {
      lintOutcome.errors.forEach((err) => {
        console.error('prlint:', err.message);
        error(`- ${err.message}`);
      });
      setFailed(`Pull Request title does not conform to the conventional commit spec. For help see: ${HELP_URL}`);
    }

    console.log('prlint: Done');
  } catch (error) {
    const errMessage: string = error instanceof Error ? error.message : String(error);
    console.error('prlint:', error);
    setFailed(errMessage);
  }
};
