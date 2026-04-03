# Pull Request Linter Action

A GitHub action that enforces conventional commit spec on pull requests to ensure a clean commit history. see https://www.conventionalcommits.org/ 

## Features
Uses default commit lint config which is auto generated at build time (`src/main/config/commitlint-config.ts`) based on https://github.com/conventional-changelog/commitlint

FYI: The reason for pre building the config is a workaround since `@commitlint/load` requires typescript as a runtime dependency which causes odd side effects given we build from TS to JS.

## Usage
Add the following to a workflow `.yml` file in the `/.github/workflows` directory of your repo.
This action is a composite action and sets up Node from its bundled `.nvmrc` automatically.

```yaml
steps:
  - name: PR Lint
    uses: gavinastur/pr-linter-action@v1
```

If your workflow also needs repository files for other steps, keep your `actions/checkout` step.

## Commit and PR conventions
> **Note:** Only the PR title is validated, not the PR body.

Commits should follow the convention `chore: readme update` or `fix(nav-123): my new feature` otherwise the build will fail. For complex examples see the link below. 
PR titles which form the commit to the main branch must contain the following convention so that we can build an informative semantic changelog

`chore:` non functional change to the codebase (this correlates with PATCH in Semantic Versioning).
`fix:` patches a bug in your codebase (this correlates with PATCH).
`feat:` new feature to the codebase (this correlates with MINOR).

More information on the spec including further options are available here https://www.conventionalcommits.org/ you can also check the rules in (`src/main/config/commitlint-config.ts`)


## Notes for maintainers

Releases are automated by `.github/workflows/release.yml` using semantic-release.
The workflow is triggered manually via `workflow_dispatch`.
Conventional commit messages determine the next semantic version and generate release notes.
Each release creates an immutable `vX.Y.Z` tag and updates the moving major tag (`vX`).

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
