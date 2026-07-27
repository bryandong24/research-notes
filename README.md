# Research Notes

A small public technical-notes site for foveated robot perception. The site is intentionally
separate from the private experiment repository: only edited prose and an allowlisted set of
small demonstration videos belong here.

## Local development

Requirements: Node 22.12 or newer and pnpm 11.

```bash
pnpm install
pnpm dev
```

The production site is built for:

```text
https://bryandong24.github.io/research-notes/
```

Validate the complete public artifact before publishing:

```bash
pnpm test
pnpm audit:public
pnpm build
pnpm audit:dist
```

## Media contract

The expected media allowlist is defined in `scripts/expected-media.mjs`. Components refer to
those assets through `import.meta.env.BASE_URL`, so links work both locally and at the GitHub
Pages project subpath.

Do not symlink files from a private checkout. Copy only the selected, already compressed,
browser-ready MP4s into `public/media/`; the audit rejects symlinks, model artifacts,
credential-like strings, workstation paths, files over 25 MiB, and a public tree over 100 MiB.

## Publishing a new note

1. Add an MDX file under `src/content/notes/<year>/`.
2. Keep the first screen outcome-led: one claim, one visual, then interpretation.
3. Put protocols, tables, and secondary metrics in collapsed technical appendices.
4. Add only explicitly reviewed media to the allowlist.
5. Run all four validation commands above.

The workflow builds and deploys on `main`, but GitHub Pages must first be enabled with
**GitHub Actions** as its source. This repository is intended to be public; never copy private
datasets, checkpoints, caches, or raw experiment output trees into it.
