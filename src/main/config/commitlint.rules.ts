import configConventional from '@commitlint/config-conventional';
import { type Plugin, type QualifiedRules, type Rule, RuleConfigSeverity } from '@commitlint/types';

// The config is assembled here rather than with @commitlint/load, because load resolves
// `extends` and `parserPreset` from node_modules at runtime, which the bundled dist does not have.

export const HELP_URL = 'https://github.com/conventional-changelog/commitlint/#what-is-commitlint';

const SCOPE_JIRA = 'JIRA-';

const scopeJira: Rule = ({ scope }) => {
  if (!scope?.toUpperCase().trim().startsWith(SCOPE_JIRA)) {
    return [true];
  }
  return [scope.trim().startsWith(SCOPE_JIRA), `scope should have uppercase ${SCOPE_JIRA} prefix`];
};

export const rules: QualifiedRules = {
  ...(configConventional.rules as QualifiedRules),
  'scope-jira': [RuleConfigSeverity.Error, 'always'],
};

export const plugins: Record<string, Plugin> = {
  local: { rules: { 'scope-jira': scopeJira } },
};
