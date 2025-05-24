import configCustom from '../main/config/commitlint.rules.js';
import configConventional from '@commitlint/config-conventional';
import lint from '@commitlint/lint';
import load from '@commitlint/load';
import { LintOptions, LintOutcome, PluginRecords, QualifiedConfig, QualifiedRules } from '@commitlint/types';
import { context } from '@actions/github';
import { error, setFailed } from '@actions/core';
import { mkdirSync, writeFileSync } from 'fs';
import * as commitlintSchema from '@commitlint/config-validator/lib/commitlint.schema.json' with { type: 'json' };
import path from 'path';
import { fileURLToPath } from 'url';

const pathName = `${path.dirname(fileURLToPath(import.meta.url))}/config/`;
const schemaFileName = `${pathName}/commitlint.schema.json`;
// Write the commitlint schema since the action requires it as an actual file at runtime
console.log('prlint: generating commitlint schema:', schemaFileName);
mkdirSync(pathName, { recursive: true });
writeFileSync(schemaFileName, JSON.stringify(commitlintSchema, null, 2));

const getLintOptions = (configuration: QualifiedConfig): LintOptions => ({
  parserOpts: configuration.parserPreset?.parserOpts || {},
  plugins: configuration.plugins || {},
  ignores: configuration.ignores || [],
  defaultIgnores: configuration.defaultIgnores || true,
});

export const prlint = async (): Promise<void> => {
  console.log('prlint: Running');
  try {
    if (!context.payload.pull_request) {
      throw new Error(
        `Unsupported GitHub event: ${context.eventName} - this action only supports pull https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request`
      );
    }

    const prTitle: string = context.payload.pull_request.title;
    console.log(`prlint: pull request title: ${prTitle}`);

    const configLocal: QualifiedConfig = await load({}, {});
    configLocal.rules = configCustom.rules as unknown as QualifiedRules;
    configLocal.plugins = configCustom.plugins as unknown as PluginRecords;

    const lintOutcome: LintOutcome = await lint(prTitle, { ...configConventional.rules, ...configLocal.rules }, getLintOptions(configLocal));
    if (!lintOutcome.valid) {
      lintOutcome.errors.forEach((err) => {
        console.error('prlint:', err.message);
        error(`- ${err.message}`);
      });
      setFailed(`Pull Request title does not conform to the conventional commit spec. For help see: ${configLocal.helpUrl}`);
    }

    console.log('prlint: Done');
  } catch (error) {
    const errMessage: string = error instanceof Error ? error.message : String(error);
    console.error('prlint:', error);
    setFailed(errMessage);
  }
};
