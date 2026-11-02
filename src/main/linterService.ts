import { error, setFailed } from '@actions/core';
import { context } from '@actions/github';
import lint from '@commitlint/lint';
import load from '@commitlint/load';
import type { LintOptions, LintOutcome, QualifiedConfig } from '@commitlint/types';
import configCustom from '../main/config/commitlint.rules.js';

const getLintOptions = (configuration: QualifiedConfig): LintOptions => ({
  parserOpts: configuration.parserPreset?.parserOpts || {},
  plugins: configuration.plugins || {},
  ignores: configuration.ignores || [],
  // commitlint's default ignores (merge, revert, fixup!, semver, ...) are meant for commits, not PR titles
  defaultIgnores: false,
});

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

    const config: QualifiedConfig = await load(configCustom);
    const lintOutcome: LintOutcome = await lint(prTitle, config.rules, getLintOptions(config));
    if (!lintOutcome.valid) {
      lintOutcome.errors.forEach((err) => {
        console.error('prlint:', err.message);
        error(`- ${err.message}`);
      });
      setFailed(`Pull Request title does not conform to the conventional commit spec. For help see: ${config.helpUrl}`);
    }

    console.log('prlint: Done');
  } catch (error) {
    const errMessage: string = error instanceof Error ? error.message : String(error);
    console.error('prlint:', error);
    setFailed(errMessage);
  }
};
