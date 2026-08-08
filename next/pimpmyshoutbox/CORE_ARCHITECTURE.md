# Noyau V4 : analyse du monolithe et contrat de migration

## Objectif

Le noyau V4 ne contient aucune règle métier de PimpMyShoutbox. Il fournit les
services dont les features ont besoin, afin qu'elles ne s'appuient plus sur des
variables globales, des sélecteurs copiés ou plusieurs `MutationObserver`.

La V3 contient 1 043 fonctions et concentre dans la même IIFE l'infrastructure
et les features. La séparation V4 est donc faite par responsabilité, pas par
simple découpe de plages de lignes.

## Cartographie V3

| Zone V3 | Lignes approximatives | Destination V4 | Décision |
| --- | ---: | --- | --- |
| Requêtes `GM_xmlhttpRequest` | 135–230 | `core/http.js` | Service partagé ; les permissions restent déclarées par les features qui l'utilisent. |
| Détection des pages | 886–940 | `core/tr4ker-platform.js` | Centralisée, avec les sélecteurs Tr4ker stables. |
| Stockage sûr / JSON / booléens | 964–1046 | `core/storage.js` | Centralisée ; les clés V3 ne sont pas renommées. |
| Normalisation texte, hash, HTML, presse-papier | 7807–8250, 8750–8790 | `core/text.js` | Utilitaires purs ou transverses. |
| Toast | 9600–9650 | `core/toast.js` | Unique service UI, sans logique fonctionnelle. |
| Saisie chat / Wiki | 18300–19460 | `core/chat-input.js` + plateforme | Une seule API de lecture, insertion et limite de longueur. |
| Messages, pseudo logique et contexte | 8820–8950, 9419–9445, 11937–11955 | `core/tr4ker-platform.js` | Les features reçoivent un objet message normalisé. |
| Observer des messages | 22805–22820 | `core/message-stream.js` | Un seul observer, abonnement et replay par feature. |
| Navigation SPA et changements de contexte | 24831–25090 | `core/route-watcher.js` + `core/application.js` | Une seule interception d'historique et un tick de résilience. |
| Modal de configuration transversale | 11600–16090 | `core/settings-modal.js` | Coque, raccourci global et rendu automatique des déclarations des features. |

## Ce qui reste explicitement hors du core

- blacklist et statistiques de messages ;
- mentions, sons, cross-channel et AFK ;
- topbar, burger et Matrix dashboard ;
- réglages visuels, profil et grades ;
- phrases sauvegardées, emoji, réactions et toolbar ;
- GIF, T9 emoji, upload/catalogue d'images et lecteurs média ;
- récapitulatif des crédits ;
- modal de réglages : elle utilisera le registre mais reste une feature/UI.

Ces zones possèdent leurs propres états, clés de stockage, requêtes ou UI. Les
placer dans le core les recouplerait et empêcherait le chargement conditionnel.

## Services disponibles dans une feature

Chaque `setup(context)` reçoit :

```js
context.platform  // pages Tr4ker, input, contexte conversation, messages
context.storage   // get/set/readJson/writeJson/readBoolean/writeBoolean
context.http      // external/externalJson/externalArrayBuffer
context.input     // get/getValue/write/insert/enforceLimit
context.text      // normalizeName, hashString, clipboard, etc.
context.messages  // subscribe(callback, { replay })
context.ui.toast  // show(message, { error, duration })
context.ui.settings // open/close/toggle de la configuration globale
context.shortcuts // declaration et liaison des raccourcis
```

Les abonnements à `context.messages`, listeners, observers, timers et styles
créés via le contexte sont automatiquement nettoyés lorsque la feature change
de page ou est désactivée.

## Contrat du flux de messages

`context.messages.subscribe((message, meta) => {})` fournit :

```js
{
  element, id, username, normalizedUsername,
  text, timestamp, replyText
}
```

`meta.source` vaut `replay`, `scan` ou `mutation`. Une feature responsable de
notifications peut ainsi ne réagir qu'à `mutation`, tandis qu'une feature de
rendu peut traiter les trois. Le core ne masque, ne colore et ne modifie jamais
un message : ces décisions appartiennent aux features.

## Règles de migration

1. Une feature importe uniquement le core et ses propres fichiers.
2. Elle conserve ses clés `tm_t4_*` V3 tant qu'une migration de données n'est
   pas explicitement prévue.
3. Elle n'installe pas son propre route watcher ni observer de liste de messages.
4. Chaque élément DOM créé porte un ID ou un attribut propre à la feature.
5. Toute permission Tampermonkey ou tout domaine `@connect` reste inventorié
   dans la feature avant d'être agrégé dans le metadata final du bundle.

## Configuration globale

Le core fournit la coque de la modal, sans option métier propre. Le raccourci
global est `Ctrl+Alt+C` sous Windows/Linux et `Ctrl+⌘+C` sur macOS. Tant qu'il
n'existe aucune feature enregistrée, la modal explique simplement qu'aucune
feature n'a encore été migrée. Lorsqu'une feature est présente, sa catégorie,
son toggle et ses astuces sont rendus automatiquement depuis sa déclaration.
La coque enregistre également sa taille et sa position ; les onglets sont sur
le côté lorsque la modal est plus haute que large, sinon en haut à l'horizontale.

## Ordre de migration conseillé

1. Récapitulatif des crédits, puis apparence : peu de dépendances au chat.
2. Blacklist : première feature migrée, validation du flux de messages et du panneau flottant.
3. Phrases sauvegardées et outils de saisie : validation du service `input`.
4. Mise en avant et typographie : deuxième usage du flux de messages.
5. Mentions / AFK : validation de l'état et des notifications multi-onglets.
6. Emoji, réactions, médias et topbar : composants les plus couplés à la UI.
