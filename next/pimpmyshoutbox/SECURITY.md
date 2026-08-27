# Publication et sécurité

## Publication V4

Chaque version V4 est publiée uniquement depuis un tag de release immuable nommé
`pimpmyshoutbox-next-v<version>`. La version déclarée dans
`metadata.user.js` doit correspondre exactement au tag. Le workflow construit
le bundle depuis ce tag, publie les deux artefacts dans une GitHub Release et
ajoute `SHA256SUMS` pour permettre leur vérification.

Avant la première publication, configure dans GitHub :

1. une ruleset qui interdit la mise à jour ou la suppression des tags
   `pimpmyshoutbox-next-v*` et exige une signature vérifiée ;
2. une ruleset qui protège `main` (PR, revue et CI obligatoires) ;
3. les *immutable releases* et l’interdiction de modifier les assets publiés ;
4. l’accès `contents: write` limité au workflow de publication.

Les URL d’installation sont liées au tag de la version. Une mise à jour V4 ne
peut donc jamais être fournie par une branche mutable ou un `push --force`.
Pour passer à une nouvelle version, l’utilisateur installe explicitement
l’artefact de la nouvelle release ; il n’existe pas de redirection silencieuse
vers une release mutable.

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
