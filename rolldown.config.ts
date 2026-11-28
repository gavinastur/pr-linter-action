import { defineConfig } from 'rolldown';

// Bundles the action and all of its dependencies into one file for `runs.using: node24`.
// dist/ is only built and committed by the release workflow (see .releaserc.json),
// so dependency update PRs never need to rebuild it.
export default defineConfig({
  input: 'src/main/index.ts',
  platform: 'node',
  output: {
    file: 'dist/index.mjs',
    format: 'esm',
  },
});
