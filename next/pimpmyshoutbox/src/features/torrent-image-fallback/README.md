# Bypass proxy tr4ker pour les images

Feature Next autonome, activée par défaut dans **Site Tr4ker → Réglages du site**.
Elle fonctionne sur toutes les pages Tr4ker : accueil, chat, profils, forum,
torrents, etc. Les images de la navigation et des modales sont aussi concernées.

## Modes de chargement

Le réglage **Toujours charger les images depuis leur source** est décoché
initialement pour conserver le fonctionnement à la demande. Une fois coché,
les images concernées basculent vers l'original dès leur détection, sans délai
de 8 secondes ni clic supplémentaire. Le choix est mémorisé pour les prochaines
visites et s'applique également aux images ajoutées dynamiquement et aux images
lazy (leur attribut `loading` reste conservé). Il est accessible depuis les
réglages sur l'ensemble du site.

Le bouton **Revenir au proxy** suspend le mode automatique pour la page courante.
À la navigation suivante, la préférence mémorisée s'applique à nouveau.
Décocher l'option restaure le proxy immédiatement et revient au mode à la demande.
Les changements depuis un autre onglet et les imports de configuration sont
également pris en compte. Un fallback natif ne déclenche pas de tentatives
automatiques répétées vers la même URL sur un même élément image.

## Fonctionnement à la demande

- Les éléments `img` de toute la page dont le `src` utilise le
  proxy de la même origine `/api/proxy/image?url=…` sont concernées.
- Une erreur de chargement déclenche immédiatement la proposition. Une image
  encore en attente après **8 secondes** est également proposée. Le contrôle
  périodique peut ajouter jusqu'à une seconde à ce délai.
- Pour une image `loading="lazy"`, le délai commence lorsqu'elle entre dans la
  fenêtre ; les images qui n'ont pas encore été vues ne sont pas déclarées lentes.
- Le bouton **Afficher les images d’origine (N)** charge uniquement les images
  lentes ou en échec au moment du clic. Une image déjà chargée est conservée.
- Lorsque le mode par défaut est désactivé, aucun contournement automatique :
  les images ajoutées ensuite nécessitent un nouveau clic si elles échouent.
  Aucune requête de diagnostic n'est envoyée.
- Les chargements directs utilisent `referrerpolicy="no-referrer"`. Seules les
  URL HTTP(S) absolues sans identifiants sont acceptées ; les proxys d'une autre
  origine et les boucles vers le proxy Tr4ker sont ignorés. Les paramètres signés
  de l'original sont conservés sans décodage supplémentaire.
- `srcset` et les sources d'un éventuel `picture` sont temporairement retirés
  pour empêcher la sélection d'une autre image via le proxy. Une image masquée
  en ligne avec `display:none` est réaffichée lors du clic.
- **Revenir au proxy** et la désactivation restaurent les
  attributs modifiés, tant qu'ils n'ont pas été remplacés entre-temps par le site.
  En mode à la demande, la navigation SPA restaure aussi les images : le choix
  ne se propage pas d'une page à l'autre. En mode automatique, les images communes
  comme les avatars de navigation restent en direct sans rechargement inutile.

L'hébergeur d'origine reçoit une requête d'image après le clic de secours, ou
automatiquement lorsque l'option de chargement direct par défaut est activée.
Le navigateur continue d'appliquer ses règles habituelles (CSP, contenu mixte,
etc.) ; une image supprimée ou un hébergeur indisponible peut rester inaccessible.
Aucune nouvelle permission Tampermonkey ni entrée `@connect` n'est nécessaire.

## Intégration au noyau

- La feature déclare `pages: []`, vérifie `isTr4kerPage()` et analyse le `body`
  entier. Elle utilise le route watcher existant, sans limiter la détection à un
  type de page ni à un élément `main`.
- Listeners, observer des images ajoutées/modifiées, intervalle et style passent
  par `context.on`, `context.observe`, `context.every` et `context.ensureStyle`.
  Le nettoyage métier restaure les images et retire le
  bouton ; le contexte retire les ressources associées.
- L'activation est conservée sous
  `tm-t4-next:feature:torrent-image-fallback:enabled`, incluse dans les sauvegardes.
- La préférence de chargement direct est conservée sous
  `tm-t4-next:torrent-image-fallback:direct-by-default`, également sauvegardée.
  L'identifiant technique historique `torrent-image-fallback` reste inchangé
  malgré l'extension à tout le site, pour conserver les préférences existantes.
- Aucun changement dans le userscript legacy.

## Vérification

`npm test` exécute les tests Node/JSDOM : attente et erreur immédiate, images
chargées ou différées, URL signées et rejet des schémas indésirables, attributs
responsive, restauration, navigation SPA et désactivation via le registre réel.
Les tests couvrent aussi le mode direct persistant, les ajouts dynamiques,
l'exception temporaire par page, l'accueil, le chat, les profils, les images de
navigation et les modales ajoutées dynamiquement, y compris sans élément `main`.
JSDOM est une dépendance de développement uniquement. Ces tests sont aussi
exécutés en CI avant le build Next.

Pour un test navigateur, ralentir ou bloquer `/api/proxy/image*` dans les outils
de développement sur une fiche torrent. Vérifier que le bouton apparaît,
qu'aucune URL ne change avant le clic, puis que seules les images concernées
basculent. Tester le retour au proxy, le passage à un autre torrent, puis la
désactivation dans les réglages. Répéter sur le catalogue avec ses images lazy.
Cocher ensuite le chargement direct par défaut : les images doivent basculer
sans délai ; le retour au proxy doit tenir jusqu'au changement de page.
Répéter sur l'accueil, un profil et dans le chat, puis ouvrir une modale contenant
une image du proxy. Les images directes ou hébergées localement restent intactes.
