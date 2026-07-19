# Suivi de migration vers Tr4ker

Dernière mise à jour : 2026-07-19  
Cible principale : `https://tr4ker.net/communication?conv=1`

## Légende

- ✅ Migré/adapté dans `src/userscripts/blacklist-shoutbox.user.js`
- 🟡 Adapté mais à valider sur une session Tr4ker connectée
- ⏸️ Non applicable ou dépend d’un comportement qui n’est pas présent dans les sources HTML fournies
- ❌ Bloqué par une information/API manquante

## Fonctionnalités

| Fonctionnalité | État | Notes de validation |
| --- | --- | --- |
| Chargement sur `tr4ker.net` | ✅ | `@match` Tr4ker et route `/communication` ajoutés. |
| Détection des messages | ✅ | Utilise `[data-msg-id]` et le conteneur `messageList` de Tr4ker. |
| Extraction pseudo/texte/heure | ✅ | Utilise `msgSender`, `msgBubble` et `msgTime`. L’identifiant du message sécurise les signatures. |
| Blacklist / masquage de pseudos | ✅ | Le masquage agit sur les lignes Tr4ker et conserve les compteurs de session. |
| Stats des messages masqués | ✅ | Le panneau existant réutilise la nouvelle racine du chat. |
| Mise en avant de pseudos | ✅ | Compatible avec les lignes groupées Tr4ker via le message précédent. |
| Détection des mentions | ✅ | Les mentions natives et le texte des bulles sont inspectés. |
| Son de mention | 🟡 | Code adapté ; nécessite une validation navigateur après interaction utilisateur pour l’audio. |
| Réponses natives | ✅ | Le bouton `[data-msg-actions]` / titre `Répondre` est reconnu. |
| Contexte des citations | ✅ | Les blocs `quote`, `quoteAuthor` et `quoteBody` sont reconnus. |
| Réponses rapides enregistrées | ✅ | Injection dans le textarea Tr4ker et déclenchement de l’événement `input`. |
| Mode AFK / réponse automatique | 🟡 | Envoi via le bouton natif `Envoyer` ; à valider avec une conversation réelle. |
| GIF Klipy | 🟡 | Le menu userscript reste indépendant et insère `[img]...[/img]`; valider le rendu Tr4ker. |
| Upload ImgBB / collage d’image | 🟡 | Le flux userscript est indépendant du backend Tr4ker ; valider CORS et rendu `[img]`. |
| Catalogue d’images | ✅ | Stockage local et interface conservés. |
| Liens cliquables | ✅ | Le texte est maintenant ciblé via `msgBubble`. |
| Aperçu des images liées | 🟡 | Le ciblage est adapté ; valider sur une URL d’image réellement postée. |
| Player YouTube | ✅ | Reconnaît une URL complète ou le suffixe autorisé `watch?v=ID`, puis ouvre le player userscript sans créer de lien cliquable. |
| Barre d’accès rapide aux emojis | 🟡 | Le textarea et les contrôles natifs sont reconnus ; le picker Tr4ker doit être validé en interaction réelle. |
| Historique/favoris d’emojis | 🟡 | Les heuristiques de picker ont été élargies aux boutons Tr4ker. |
| Réactions / favoris rapides | 🟡 | Le bouton `Réagir` et les pickers génériques sont reconnus ; confirmer la structure du picker ouvert. |
| Taille du texte | ✅ | Application directe à `msgSender`, `msgMeta` et `msgBubble`. |
| Scrollbar personnalisée | ✅ | La nouvelle racine `messageList` est ciblée. |
| Thème clair | 🟡 | L’état et les réglages existent ; les règles de couleurs historiques restent à compléter pour le thème Tr4ker. |
| Position des actions à gauche | 🟡 | Le conteneur d’actions est reconnu ; le style historique devra être ajusté si l’option est utilisée. |
| Export/import de configuration | ✅ | Les réglages restent exportables et importables localement. |

## Stockage local

Les clés actives utilisent désormais le préfixe `tm_t4_` (ou `tm_hidden_shout_users_t4`). Au premier lancement de cette version, les anciennes valeurs `torr9` sont copiées vers leurs nouvelles clés, puis les anciennes entrées sont supprimées uniquement après confirmation de la copie. La clé de migration `tm_t4_storage_migration_v1` empêche de répéter l’opération.

## Requêtes externes et CSP

Les appels Klipy, ImgBB et YouTube passent par `GM_xmlhttpRequest`, car la CSP de Tr4ker bloque les `fetch` cross-origin exécutés dans le contexte de la page. Une réinstallation du userscript est nécessaire pour que Tampermonkey prenne en compte `@grant GM_xmlhttpRequest` et les directives `@connect`.

## Vérifications restantes

1. Installer le userscript sur une session Tr4ker connectée.
2. Vérifier blacklist, mention, réponse, réaction et envoi AFK sur `conv=1`.
3. Ouvrir les pickers emoji/réaction et confirmer leurs sélecteurs après ouverture.
4. Tester `watch?v=EHsfF1-2TDw` dans un message et vérifier l’ouverture du player YouTube.
5. Tester un lien image, un GIF Klipy et une image collée.
6. Ajuster le thème clair et la position des actions si le CSS Tr4ker réel diffère de l’export fourni.

## Limites connues

L’export HTML contient l’état rendu d’une conversation mais pas les états ouverts des pickers ni une session authentifiée. La migration couvre donc les points d’intégration observables et laisse en validation les comportements qui dépendent d’un clic, du WebSocket ou des permissions du compte. Le userscript cible désormais exclusivement Tr4ker.
