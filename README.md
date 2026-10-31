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

### Migration de PimpMyShoutbox legacy vers Next

La dernière mise à jour legacy, **3.01.21**, ajoute **(DEPRECATED)** au nom du
script et affiche une invitation à migrer vers Next. **Me rappeler plus tard**
masque l'invitation jusqu'au prochain jour du calendrier local.

Avant de migrer, exporter la configuration de l'ancien script via **Exporter
la config**, installer Next, puis désactiver **Tr4ker - PimpMyShoutbox
(DEPRECATED)** dans le tableau de bord de Tampermonkey, Greasemonkey ou
Violentmonkey. Recharger Tr4ker et utiliser **Importer une config** dans les
réglages de Next pour sélectionner le fichier JSON sauvegardé.

Le bouton **Installer maintenant** utilise l'URL raw stable du script Next :
`https://raw.githubusercontent.com/SaltedButch/tr4ker-scripting/userscripts/pimpmyshoutbox-next.user.js`.
Le workflow **Publish Userscripts** construit et publie les artefacts legacy et
Next ensemble depuis `main`, dans un même commit de la branche `userscripts`.
Aucune release GitHub n'est nécessaire pour diffuser cette migration.

### Publication des scripts

Published artifacts are served from the `userscripts` branch. For each source file in `src/userscripts`, the build generates:

- `dist/<script-id>.user.js`: installable script,
- `dist/<script-id>.meta.js`: lightweight metadata used by Tampermonkey update checks.

Current published scripts:

```text
https://raw.githubusercontent.com/SaltedButch/tr4ker-scripting/userscripts/pimpmyshoutbox.user.js
https://raw.githubusercontent.com/SaltedButch/tr4ker-scripting/userscripts/pimpmyshoutbox-next.user.js
https://raw.githubusercontent.com/SaltedButch/tr4ker-scripting/userscripts/torr9conf.user.js
```

Current metadata URLs:

```text
https://raw.githubusercontent.com/SaltedButch/tr4ker-scripting/userscripts/pimpmyshoutbox.meta.js
https://raw.githubusercontent.com/SaltedButch/tr4ker-scripting/userscripts/pimpmyshoutbox-next.meta.js
https://raw.githubusercontent.com/SaltedButch/tr4ker-scripting/userscripts/torr9conf.meta.js
```

Les URL legacy sont injectées automatiquement par le build Python. Les URL Next
sont déclarées dans `next/pimpmyshoutbox/metadata.user.js` et reprises dans le
bundle généré. Leur chemin reste stable lorsque la version change : seul
`@version` doit être augmenté manuellement avant publication.

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
- `Publish Userscripts`: validates and rebuilds the legacy and Next scripts on every push to `main`, then publishes their generated artifacts to `userscripts`.
- `Archive PimpMyShoutbox Next release`: optionally archives a tagged Next version in a GitHub Release; automatic updates use the stable raw URLs.

## Next repository actions

1. Push the local `develop` branch to GitHub once created: `git push -u origin develop`
2. Optionally protect `main`, `develop` and `userscripts` in GitHub settings.
3. Install scripts in Tampermonkey from the raw `userscripts` URLs, never from `src/`.
