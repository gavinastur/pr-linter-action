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
  - name: PR Linter
    id: test
    uses: gavinastur/pr-linter-action@v1
```

If your workflow also needs repository files for other steps, keep your `actions/checkout` step.


## Commit and PR conventions

Commits should follow the convention `chore: readme update` or `fix(nav-123): my new feature` otherwise the build will fail. For complex examples see the link below. 
PR titles which form the commit to the main branch must contain the following convention so that we can build an informative semantic changelog

`chore:` non functional change to the codebase (this correlates with PATCH in Semantic Versioning).

`fix:` patches a bug in your codebase (this correlates with PATCH).

`feat:` new feature to the codebase (this correlates with MINOR).

More information on the spec including further options are available here https://www.conventionalcommits.org/ you can also check the rules in (`src/main/config/commitlint-config.ts`)

## Branch conventions

The PR LInter does not validate branch names yet but we suggest the following

`type/subject` or `type_subject`

`jir-123/my-new-feature`

`chore/my-new-feature`

`chore_my-new-feature`


## Notes for maintainers

Because this a GitHub action and requires us to commit the dist folder, some dependency updates cause the dist folder to need updating. Hence you'll see the `dist-check` workflow fail.
To fix this you simply have to checkout that branch, run `npm install` and then commit the dist changes. Bit of a pain, if Renovate could run "Git hooks" it wouldn’t be an issue.

Releases are automated by `.github/workflows/release.yml` using release-please.
The workflow runs after successful CI on `main` and can also be triggered manually with `workflow_dispatch`.
For manual runs, set `dry_run: true` to preview versioning behavior without publishing a release or moving the `vX` tag.
Conventional commit messages determine the next semantic version and generate release notes.
Each release creates an immutable `vX.Y.Z` tag and updates the moving major tag (`vX`).

## Manual release

To trigger a release manually:

1. Go to **Actions → Release** in the GitHub repository.
2. Click **Run workflow**.
3. Select the `main` branch.
4. Set `dry_run`:
   - `false` _(default)_ — publishes a real release, creates `vX.Y.Z` tag, and advances the `vX` tag.
   - `true` — runs release-please in preview mode; no release, tag, or PR is created or modified.
5. Click **Run workflow**.

> **Tip:** Run with `dry_run: true` first to confirm the next version number before committing to a real release.
