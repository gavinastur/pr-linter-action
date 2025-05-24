import { Commit } from 'conventional-commits-parser';

export default {
  rules: {
    'scope-jira': [2, 'always'],
  },
  plugins: [
    {
      rules: {
        'scope-jira': (commit: Commit) => {
          const SCOPE_JIRA = 'JIRA-';
          const scope = commit.scope;
          if (!scope || !scope.toUpperCase().trim().startsWith(SCOPE_JIRA)) {
            return [true];
          }
          return [scope.trim().startsWith(SCOPE_JIRA), `scope should have uppercase ${SCOPE_JIRA} prefix`];
        },
      },
    },
  ],
};
