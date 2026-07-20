# tr4ker-scripting

Repository ready for Tampermonkey userscript development with:

- a clean `src -> dist` pipeline,
- automatic generation of `@updateURL` and `@downloadURL`,
- a dedicated `userscripts` publishing branch,
- a classic git flow based on `main`, `develop`, `feature/*`, `release/*` and `hotfix/*`.
- Python tooling for build tasks, plus a Node.js syntax gate to catch broken userscripts before publish.

## Structure

```text
.
├── .github/workflows/
├── src/userscripts/
├── tools/
├── CONTRIBUTING.md
├── Makefile
└── userscripts.json
```

- `src/userscripts/*.user.js`: source files you edit every day.
- `dist/`: generated publish-ready files (`*.user.js`, `*.meta.js`, `manifest.json`).
- `tools/build_userscripts.py`: injects repository URLs and builds Tampermonkey artifacts.
- `tools/check_userscripts_syntax.py`: runs `node --check` on every source userscript.
- `tools/bump_version.py`: updates the `@version` metadata of one source script.
- `RELEASE_NOTES.md`: release notes for `pimpmyshoutbox`.
- `RELEASE_NOTES_TORR9CONF.md`: release notes for `torr9conf`.
- `TR4KER_MIGRATION.md`: suivi des fonctionnalités migrées et des validations restantes pour Tr4ker.
- `Makefile`: optional shortcut for environments where `make` is available.

## Quick start

```bash
git switch develop
python3 tools/build_userscripts.py --check
python3 tools/check_userscripts_syntax.py
python3 tools/build_userscripts.py
```

To list the available script ids:

```bash
python3 tools/build_userscripts.py --list
```

To bump a published version before a release:

```bash
python3 tools/bump_version.py pimpmyshoutbox 3.0.33
python3 tools/bump_version.py torr9conf 1.0.6
```

If `make` is available on your machine, use `make check` for the full metadata + syntax gate. This requires `node` to be installed locally.

## Tampermonkey auto-update

Published artifacts are served from the `userscripts` branch. For each source file in `src/userscripts`, the build generates:

- `dist/<script-id>.user.js`: installable script,
- `dist/<script-id>.meta.js`: lightweight metadata used by Tampermonkey update checks.

Current published scripts:

```text
https://raw.githubusercontent.com/SaltedButch/tr4ker-scripting/userscripts/pimpmyshoutbox.user.js
https://raw.githubusercontent.com/SaltedButch/tr4ker-scripting/userscripts/torr9conf.user.js
```

Current metadata URLs:

```text
https://raw.githubusercontent.com/SaltedButch/tr4ker-scripting/userscripts/pimpmyshoutbox.meta.js
https://raw.githubusercontent.com/SaltedButch/tr4ker-scripting/userscripts/torr9conf.meta.js
```

Those URLs are injected automatically at build time, so source files stay clean.

Current script ids:

- `pimpmyshoutbox`
- `torr9conf`

## Git flow

The intended branch policy is:

- `main`: production-ready source only.
- `develop`: staging branch for the next release.
- `feature/*`: new feature branches created from `develop`.
- `release/*`: release hardening branches created from `develop`.
- `hotfix/*`: urgent fixes created from `main`.
- `userscripts`: generated artifacts branch used by Tampermonkey.

Detailed release steps are documented in [CONTRIBUTING.md](/CONTRIBUTING.md).

## GitHub Actions

- `CI`: validates metadata and parses every userscript with `node --check` on pushes and pull requests.
- `Publish Userscripts`: re-runs the syntax gate, rebuilds `dist/` on every push to `main` and publishes the result to `userscripts`.

## Next repository actions

1. Push the local `develop` branch to GitHub once created: `git push -u origin develop`
2. Optionally protect `main`, `develop` and `userscripts` in GitHub settings.
3. Install scripts in Tampermonkey from the raw `userscripts` URLs, never from `src/`.
