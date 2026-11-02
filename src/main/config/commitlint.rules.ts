import { type Rule, RuleConfigSeverity, type UserConfig } from '@commitlint/types';

const SCOPE_JIRA = 'JIRA-';

const scopeJira: Rule = ({ scope }) => {
  if (!scope?.toUpperCase().trim().startsWith(SCOPE_JIRA)) {
    return [true];
  }
  return [scope.trim().startsWith(SCOPE_JIRA), `scope should have uppercase ${SCOPE_JIRA} prefix`];
};

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-jira': [RuleConfigSeverity.Error, 'always'],
  },
  plugins: [{ rules: { 'scope-jira': scopeJira } }],
} satisfies UserConfig;
