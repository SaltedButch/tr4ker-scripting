# Référence des API Tr4ker observées

Cette page recense les routes HTTP et événements WebSocket visibles dans le client web Tr4ker fourni dans `SOURCE TR4KER/`.

Dernière vérification ciblée : **31 octobre 2026**, pour les trois headers custom
de **PimpMyShoutbox Next**. Le bundle public
[`/assets/V6OUW5OR.js`](https://tr4ker.net/assets/V6OUW5OR.js), récupéré sur le site,
est identique à celui de `SOURCE TR4KER/NewTraker/Chat/TR4KER_files/` (SHA-256 :
`7f92511caca6df485a36219e69e2fd65dda664df106e37a7d12ea8023770b300`).
Les observations ci-dessous décrivent le client publié ; les réponses réservées
à une session connectée n'ont pas été interrogées pendant cette vérification.

Ce ne sont pas des API publiques documentées ou garanties. Un userscript doit donc :

- utiliser les requêtes en lecture seule en priorité ;
- laisser le navigateur transmettre la session Tr4ker, sans stocker ni exporter de jeton ;
- vérifier le statut et la forme des réponses avant utilisation ;
- prévoir qu’une route, un champ ou un événement puisse changer.

## Vérification des headers custom Next

| Header | Requêtes HTTP | Données utilisées | Résultat dans le client actuel |
| --- | --- | --- | --- |
| Hommage à T9 | `GET /api/me/stats` | `summary.uploaded`, `summary.downloaded`, `summary.bonus_upload`, `summary.bonus_download` | Route et champs toujours utilisés par le site. |
| Matrix | `GET /api/me/stats`, `GET /api/me` si les crédits sont affichés | Totaux, `statistics`, `money` | Routes et champs toujours utilisés par le site. |
| Sobre | `GET /api/me/stats`, `GET /api/me` si les crédits sont affichés | Totaux, `statistics`, `money` | Routes et champs toujours utilisés par le site. |

`GET /api/me` renvoie directement l'objet du compte, dont `id`, `username`,
`avatar_url` (éventuellement absent ou nul) et `money`. Le site lit ces champs
directement, sans enveloppe `user` ou `data`.

`GET /api/me/stats` est consommé avec la structure suivante :

```text
summary: uploaded, downloaded, bonus_upload, bonus_download
statistics: uploaded_last_24h, downloaded_last_24h,
            uploaded_last_7d, downloaded_last_7d,
            uploaded_last_30d, downloaded_last_30d
snapshots: tableau optionnel
freeleech_count
```

Le client tolère une valeur absente pour `statistics` et `snapshots`. Le ratio
des headers est calculé à partir des volumes ; les totaux incluent les bonus.
Aucun remplacement ni signal de dépréciation des deux endpoints utilisés par
les headers n'a été relevé dans le client publié.

### Profil T9 : changement du DOM, sans changement d'endpoint

Le pseudo et l'avatar du header T9 sont repris du DOM natif, sans requête
supplémentaire à `/api/me`. Le sélecteur historique
`aside[aria-label="Navigation"] a[aria-label="Mon compte"]` ne correspond plus
aux trois captures NewTraker (Accueil, Chat et Torrent). Le client actuel rend :

```css
aside[aria-label="Navigation"] button[aria-label="Mon profil"]
```

Le pseudo reste dans `[class*="username"]` et l'avatar dans `img[src]`.
Un autre panneau natif propose aussi `aside a[href="/mon-compte/profil"]`.
Next prend en charge ces variantes et actualise le profil après un chargement
tardif ou une modification du DOM. L'absence d'avatar utilise l'initiale du pseudo.

Le bouton natif `button[aria-label="Déconnexion"]` est également présent dans
la barre de navigation latérale compacte, en dehors de l'ancien `aside`.
Next délègue le clic à ce bouton ; le site appelle lui-même
`POST /api/auth/logout` uniquement après l'action de l'utilisateur.

### Navigation des trois headers

Les liens **Teams**, **Demandes** et **Boutique** des headers utilisent
`/communaute/teams`, `/communaute/demandes` et `/communaute/boutique`.
Le client actuel rend toujours ces sous-sections, ainsi que `/communaute/forum`.
Il connaît aussi les pages `/teams`, `/requests` et `/shop`. Les liens existants
sont conservés : ce sont des routes de navigation, pas des endpoints API.

## Temps réel : WebSocket

Connexion observée : `wss://tr4ker.net/api/ws` (ou `ws://` hors HTTPS).

Événements de chat observés :

- `msg.send`, `msg.edit`, `msg.deleted`, `msg.received`
- `reaction.add`, `reaction.remove`, `reaction.updated`
- `read`
- `ping` / `pong`

Les réactions sont donc à surveiller dans les frames WebSocket des DevTools, plutôt que dans les appels Fetch/XHR.

## Chat, salons et messages privés

Routes observées :

- `/api/channels`
- `/api/channels/{slug}`
- `/api/channels/{slug}/join`
- `/api/channels/order`
- `/api/conversations`
- `/api/conversations/{id}`
- `/api/conversations/{id}/messages`
- `/api/conversations/dms?limit={n}&offset={n}`
- `/api/dm/{identifiant}`
- `/api/messages/{id}`

Pistes : raccourcis de salons, suivi local de lecture, recherche locale, alertes ciblées et outil de diagnostic des réactions.

## Compte, préférences et notifications

Routes observées :

- `/api/me`
- `/api/me/stats`
- `/api/me/preferences`
- `/api/me/notifications`
- `/api/me/notifications/unread`
- `/api/me/notifications/{id}/read`
- `/api/me/notifications/read`
- `/api/me/notifications/bulk`
- `/api/me/favorites` et `/api/me/favorites/ids`
- `/api/me/downloads`
- `/api/me/torrents`
- `/api/me/titles`, `/api/me/equipped-title`, `/api/me/featured-badges`
- `/api/me/reports/received`, `/api/me/reports/submitted`
- `/api/me/sw-rewards`
- `/api/me/follows` : liste des comptes suivis ;
- `/api/me/blocks` : lecture des blocages natifs (`blocks` dans la réponse) ;
- `/api/me/duplicates`, `/api/me/duplicates/count` : consultation des doublons ;
- `/api/me/reports/received/count` : compteur de signalements reçus.

Autres actions de compte observées dans le client vérifié :

- `PUT /api/me/profile` : bio, citation et signature ;
- `PATCH /api/me/shoutbox` : visibilité de la shoutbox (`hidden`) ;
- `POST` / `DELETE /api/me/blocks/{pseudo encodé}` : blocage / déblocage natif ;
- `/api/me/merge/candidate`, `/api/me/merge/preview`, `/api/me/merge/request` :
  parcours de fusion de comptes.

Les blocages natifs sont distincts de la blacklist locale de PimpMyShoutbox.
Ces routes sont recensées sans être ajoutées automatiquement au userscript.

Pistes : compteur de notifications compact, synthèse personnelle, raccourcis de favoris et aperçu des titres/badges.

## Profils, badges et teams

Routes observées :

- `/api/users/{pseudo}`
- `/api/users/{pseudo}/uploads`
- `/api/users/{pseudo}/featured-badges`
- `/api/users/search?q={recherche}`
- `/api/badges`
- `/api/teams`
- `/api/teams/{id}`
- `/api/teams/{id}/members`
- `/api/teams/{id}/releases`

Pistes : carte profil enrichie au survol, recherche rapide d’utilisateur, filtre d’uploader et informations de team.

## Torrents et recherche

Routes observées :

- `/api/torrents`
- `/api/torrents/{slug}`
- `/api/torrents/{slug}/related`
- `/api/torrents/{slug}/download`
- `/api/torrents/{slug}/favorite`
- `/api/torrents/{slug}/thanks`
- `/api/torrents/{slug}/freeleech`
- `/api/torrents/{slug}/reports/fixed`
- `/api/torrents/recent?period={période}&limit={n}`
- `/api/torrents?q={recherche}&limit={n}&search_in=title`
- `/api/torrents/preflight`

Pistes : recherche depuis le chat, panneau de contenus similaires, suivi des favoris et aide à la navigation.

## Données publiques et métadonnées

Routes observées :

- `/api/public/config`
- `/api/public/features`
- `/api/public/stats`
- `/api/public/categories`
- `/api/image-domains`
- `/api/announcements`
- `/api/polls/active`
- `/api/wiki/nav`, `/api/wiki/search?q={recherche}`, `/api/wiki/articles/{slug}`

Pistes : activer des options selon les fonctionnalités du site, recherche wiki depuis le chat, rappel de sondages et validation d’URL d’image.

## Recherche de médias

Routes observées :

- `/api/tmdb/search`, `/api/tmdb/suggest`, `/api/tmdb/genres`, `/api/tmdb/credits`
- `/api/music/search`, `/api/music/detail`
- `/api/games/search`, `/api/games/detail`
- `/api/books/search`, `/api/books/work`, `/api/books/editions`

Pistes : fiches compactes, suggestions de recherche et enrichissement de références de films, séries, musique, jeux ou livres.

## Communauté et modération

Routes observées :

- `/api/requests` et les actions associées (`participate`, `claim`, `confirm`, `dispute`, `unclaim`)
- `/api/tickets`
- `/api/reports/{id}/verify` et `/api/reports/{id}/dispute-abusive`
- `/api/migrations/match`
- `/api/shop`, `/api/shop/history`, `/api/shop/buy`

Ces routes peuvent modifier l’état du compte ou du site. Elles ne doivent pas être appelées automatiquement par le userscript. Elles peuvent en revanche alimenter une interface de consultation si l’utilisateur lance explicitement l’action.

## Endpoints d’administration

Des routes sous `/api/admin/` sont aussi présentes dans les sources, notamment pour les annonces et le wiki. Elles nécessitent les droits correspondants et sont hors périmètre de PimpMyShoutbox.

