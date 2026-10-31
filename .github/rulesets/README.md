# Rulesets GitHub

Importe les trois fichiers JSON, un par un, dans `Settings` → `Rules` →
`Rulesets` → `New ruleset` → `Import a ruleset` :

1. `protect-main.json`
2. `protect-userscripts.json`
3. `protect-pimpmyshoutbox-next-tags.json`

Le ruleset `main` requiert le job CI `validate` et une approbation. Si le
dépôt n'a qu'un seul mainteneur, GitHub ne permettra pas à ce mainteneur de
s'auto-approuver : ajoute un second mainteneur de confiance avant l'import,
ou ramène temporairement `required_approving_review_count` à `0`.

Le ruleset `userscripts` ne requiert pas de pull request, car le workflow
`Publish Userscripts` écrit directement sur cette branche. Il bloque toutefois
sa suppression, les force-push et les commits de merge. Après l'import,
déclenche ce workflow manuellement et vérifie qu'il peut effectuer un push
rapide normal.

Le ruleset de tags autorise la création de nouvelles releases V4, mais rend
chaque tag existant non modifiable et non supprimable.
