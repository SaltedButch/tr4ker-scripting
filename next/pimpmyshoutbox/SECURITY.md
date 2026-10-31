# Publication et sécurité

## Publication V4

Le workflow **Publish Userscripts** construit les scripts legacy et Next depuis
`main`, exécute leurs vérifications, puis publie les artefacts générés sur la
branche `userscripts`. Next est construit dans `next/pimpmyshoutbox/dist/`, puis
ses deux fichiers sont copiés dans le `dist/` de publication, à côté du legacy.

Les URL restent stables entre les versions :

- installation et `@downloadURL` : `https://raw.githubusercontent.com/SaltedButch/tr4ker-scripting/userscripts/pimpmyshoutbox-next.user.js` ;
- `@updateURL` : `https://raw.githubusercontent.com/SaltedButch/tr4ker-scripting/userscripts/pimpmyshoutbox-next.meta.js`.

Avant publication, augmenter manuellement `@version` dans `metadata.user.js`.
Le gestionnaire de userscripts peut alors comparer la version installée à celle
du fichier `.meta.js` et récupérer le nouveau `.user.js` selon ses réglages de
mise à jour. Les URL ne changent pas lors du bump.

La publication modifie les artefacts par des commits normaux, sans `push --force`.
Les accès d'écriture restent limités aux workflows de publication et `main`
conserve ses protections de revue et de CI.

Le workflow **Archive PimpMyShoutbox Next release** peut aussi conserver une
archive facultative depuis un tag `pimpmyshoutbox-next-v<version>` correspondant
au `@version`, avec `SHA256SUMS`. Cette archive n'est pas le canal de mise à jour
et n'est pas nécessaire pour publier Next.

## Secrets Klipy et ImgBB

La clé Klipy qui figurait dans l’historique Git doit être révoquée puis
renouvelée dans Klipy. Elle doit rester exclusivement dans l’environnement du
Worker, jamais dans le userscript ni dans un artefact de release.

La clé ImgBB et les URL de suppression sont stockées dans le coffre-fort du
gestionnaire de userscripts (`GM_*`), pas dans le `localStorage` partagé avec
la page. Lors de l’activation de la fonctionnalité ImgBB, les anciennes valeurs
locales sont migrées puis supprimées.

## Données envoyées à la gateway

Les recherches GIF et le manifeste d’émoticônes envoient un identifiant
aléatoire propre à l’installation dans `X-Client-ID`. Il est utilisé uniquement
pour appliquer la limitation de requêtes : le Worker ne conserve ni adresse IP,
ni contenu des recherches, ni autre donnée personnelle. Cette information est
également affichée dans les réglages de la fonctionnalité Klipy.
