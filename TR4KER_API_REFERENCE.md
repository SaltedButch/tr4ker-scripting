# Référence des API Tr4ker observées

Cette page recense les routes HTTP et événements WebSocket visibles dans le client web Tr4ker fourni dans `SOURCE TR4KER/`.

Ce ne sont pas des API publiques documentées ou garanties. Un userscript doit donc :

- utiliser les requêtes en lecture seule en priorité ;
- laisser le navigateur transmettre la session Tr4ker, sans stocker ni exporter de jeton ;
- vérifier le statut et la forme des réponses avant utilisation ;
- prévoir qu’une route, un champ ou un événement puisse changer.

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

