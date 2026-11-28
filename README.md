# Pull Request Linter Action

[![PR Lint Tests](https://github.com/gavinastur/pr-linter-action/actions/workflows/pr-lint-tests.yml/badge.svg)](https://github.com/gavinastur/pr-linter-action/actions/workflows/pr-lint-tests.yml)
[![Release](https://github.com/gavinastur/pr-linter-action/actions/workflows/release.yml/badge.svg)](https://github.com/gavinastur/pr-linter-action/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A GitHub action that enforces conventional commit spec on pull requests to ensure a clean commit history. see https://www.conventionalcommits.org/

## Features

Uses [`@commitlint/config-conventional`](https://github.com/conventional-changelog/commitlint) plus a `scope-jira` rule, defined in `src/main/config/commitlint.rules.ts`.

## Usage

Add the following to a workflow `.yml` file in the `/.github/workflows` directory of your repo.
This is a JavaScript action that runs on the runner's built-in Node.js 24. It does not change the Node version for the rest of your job.

```yaml
steps:
  - name: PR Lint
    uses: gavinastur/pr-linter-action@v1
```

The action only reads the pull request title from the event payload, so it does not need an `actions/checkout` step.

## Commit and PR conventions

> **Note:** Only the PR title is validated, not the PR body.

Commits should follow the convention `chore: readme update` or `fix(nav-123): my new feature` otherwise the build will fail. For complex examples see the link below.
PR titles which form the commit to the main branch must contain the following convention so that we can build an informative semantic changelog

`chore:` non functional change to the codebase (this correlates with PATCH in Semantic Versioning).
`fix:` patches a bug in your codebase (this correlates with PATCH).
`feat:` new feature to the codebase (this correlates with MINOR).

More information on the spec including further options are available here https://www.conventionalcommits.org/ you can also check the rules in (`src/main/config/commitlint.rules.ts`)

## Notes for maintainers

Releases are automated by `.github/workflows/release.yml` using semantic-release.
The action runs from a bundled `dist/index.mjs` (built with `npm run build`). `dist/` is not committed on pull requests: the release workflow builds it and `@semantic-release/git` commits it in the release commit, which is what the `vX.Y.Z` tag points to. This keeps Renovate PRs free of generated code.
The workflow is triggered manually via `workflow_dispatch`.
Conventional commit messages determine the next semantic version and generate release notes.
Each release creates an immutable `vX.Y.Z` tag and updates the moving major tag (`vX`).
Release notes are published on the [Releases](https://github.com/gavinastur/pr-linter-action/releases) page; there is no `CHANGELOG.md`.

## Manual release

To trigger a release manually:

1. Go to **Actions → Release** in the GitHub repository.
2. Click **Run workflow**.
3. Select the `main` branch.
4. Set `dry-run`:
   - `false` _(default)_ — publishes a real release, creates `vX.Y.Z` tag, and advances the `vX` tag.
   - `true` — runs semantic-release in dry-run mode; no release or tag is created.
5. Click **Run workflow**.

> **Tip:** Run with `dry-run: true` first to confirm the next version number before committing to a real release.
