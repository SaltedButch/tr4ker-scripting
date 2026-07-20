# Contribution guide

## Branch model

The repository follows a classic git flow:

- `main`: stable code only. Every merge to `main` triggers the publication of Tampermonkey artifacts to the `userscripts` branch.
- `develop`: integration branch for the next release.
- `feature/<topic>`: functional work branched from `develop`.
- `release/<version>`: release preparation branched from `develop`.
- `hotfix/<version>`: urgent production fix branched from `main`.
- `userscripts`: generated branch, never edited by hand.

## Daily workflow

1. Start from `develop`.
2. Create a feature branch: `git switch -c feature/my-script-change`.
3. Add or edit source files in `src/userscripts/*.user.js`.
4. Run `python3 tools/build_userscripts.py --check` during development and `python3 tools/build_userscripts.py` before local manual installation.
5. Open a pull request towards `develop`.

## Release workflow

1. Create `release/x.y.z` from `develop`.
2. Bump the published metadata version of the impacted script:

   ```bash
   python3 tools/bump_version.py pimpmyshoutbox 3.0.33
   ```

3. Rebuild artifacts:

   ```bash
   python3 tools/build_userscripts.py
   ```

4. Merge `release/x.y.z` into `main`.
5. Tag the merge commit with `vx.y.z`.
6. Merge `main` back into `develop`.

The GitHub workflow then regenerates `dist/` and force-pushes the published artifacts to the `userscripts` branch. Tampermonkey auto-updates from that branch via the generated `@updateURL` and `@downloadURL`.

## Hotfix workflow

1. Branch `hotfix/x.y.z` from `main`.
2. Apply the fix, bump the impacted script version, then merge into `main`.
3. Merge the same hotfix back into `develop`.

## Versioning rules

- Keep `@version` numeric only: `2.15`, `2.16.1`, etc.
- Every published behavioral change must bump `@version`.
- Cosmetic or documentation-only changes do not require a version bump unless they affect the generated script shipped to Tampermonkey.
- The `Makefile` is optional and only meant as a convenience wrapper where `make` exists.
