# Release Notes

Ce fichier suit l'état fonctionnel du userscript à partir de la version actuellement en place. Aucun historique antérieur n'est reconstruit.

## Règle de mise à jour

- Ajouter une ligne explicative dans ce fichier à chaque nouvelle feature livrée.
- Ouvrir une nouvelle section seulement quand la version du userscript change.
- Garder des formulations courtes, orientées usage, sans reconstituer les anciennes releases.

## Version en préparation

- Renommage du userscript en `PimpMyShoutbox` ; le fichier publié devient `pimpmyshoutbox.user.js`.
- Ajout d’un mode manuel pour choisir soi-même les emojis et réactions depuis les pickers natifs, avec réordonnancement dans les paramètres, en alternative au classement automatique par compteur.

### TODO reprise refactor

- Continuer à extraire des helpers partagés pour la création des modales et des composants UI répétitifs.
- Réduire progressivement la taille globale de `pimpmyshoutbox.user.js`, toujours au-dessus de 10 000 lignes.
- Traiter le point `KLIPY_API_KEY` en dur, relevé par l’audit comme dette technique à clarifier ou isoler proprement.
- Rejouer `python3 tools/build_userscripts.py --check` et `python3 tools/audit_userscripts.py` après chaque bloc de refactor pour garder un suivi stable.
- Ajouter et maintenir un contrôle syntaxique `node --check` dans la CI et dans la publication pour bloquer les userscripts non parsables avant `dist`.

## v2.65 - 2026-04-18

- Validation renforcée des métadonnées userscript au build pour détecter les URLs invalides avant génération du `dist`.
- Ajout d’un audit statique local pour relever la taille du script, les fonctions trop longues et quelques hotspots de maintenabilité.
- Correction de la métadonnée `@icon` du userscript, qui contenait un caractère parasite.
- Début du chantier de refactorisation avec centralisation des accès `localStorage/sessionStorage` et normalisation unifiée des réglages de mentions.
- Refactor initial de la modale de paramètres avec extraction de la collecte des éléments DOM et de la logique d’interaction hors de `openSettingsModal`.
- Poursuite du découpage de la modale de paramètres avec séparation des handlers par domaine (`blacklist`, `mentions`, accessibilité, import/export, toggles de features).
- Extraction du template HTML de la modale de paramètres en helpers de rendu par section, avec sortie complète du bloc `settings` des fonctions surdimensionnées relevées par l’audit.
- Refactorisation des modales de réponses rapides avec extraction du rendu, des contrôleurs et des bindings pour sortir `openSavedPhrasesConfigModal`, `openSavedPhraseQuickAddModal` et `openSavedPhrasesPickerModal` des fonctions trop volumineuses.
- Refactorisation du menu compact des réponses rapides avec extraction de l’entête, des lignes et de l’action `Autres` pour sortir `buildSavedPhrasesMenuContent` des fonctions trop volumineuses.
- Refactorisation du panneau AFK avec séparation du modèle de vue, du rendu HTML, de la récupération des éléments et des bindings pour sortir `renderAfkPanel` des fonctions trop volumineuses.
- Refactorisation du bloc Klipy GIF avec séparation plus nette entre helpers API et helpers UI, et découpage de `injectKlipyGifToolbar` en helpers de montage, rendu et bindings.
- Ajout de commentaires JSDoc sur les structures de données et les points d’entrée critiques des modules stockage, réponses rapides, AFK, modales de configuration et picker GIF.
- Ajout du raccourci `Ctrl+Alt+R` / `Ctrl+Cmd+R` pour ouvrir directement les réponses rapides, avec navigation clavier dans le menu compact via les flèches, `Home`, `End` et `Entrée`.

## v2.64 - 2026-04-15

- Correction du z-index du picker GIF sur la page chat pour éviter qu’il passe derrière le menu de message privé sur les petites fenêtres.

## v2.63 - 2026-04-15

- Ajout d’un mode inline pour placer la barre d’outils du chat sur la même ligne que l’input, tout en conservant le placement historique au-dessus en option.
- Divers Fix visuel et probleme de z-index
- Ajout d’une option AFK pour couper le son des alertes tout en continuant à marquer les mentions concernées comme déjà notifiées.
- Ajout d’un bouton œil sur le lecteur YouTube pour masquer la vidéo et réduire la fenêtre sans couper le son en cours.
- Ajout d’un bouton `Marquer tout lu` dans le panneau AFK quand plus de deux messages restent en attente.
- Ajout d’une option compacte dans la popup des réponses rapides pour vider entièrement l’input avant d’insérer la réponse sélectionnée.

## v2.62 - 2026-04-14

- Ajout d’un export/import JSON de la configuration principale du script depuis les paramètres, pour sauvegarder et restaurer rapidement les réglages sur une autre installation.
- Déplacement de la tuile `Astuces` en tête de la modale de configuration, sur toute la largeur, pour la rendre plus visible.
- Ajout d’un rappel dans les `Astuces` pour penser à exporter la configuration avant suppression des données navigateur ou changement de profil.
- Stats box désormais déplaçable et redimensionnable directement à la souris, avec mémorisation séparée sur l’accueil et la page chat, et suppression des sliders de position devenus inutiles.
- Correction du bouton `play` YouTube sur les liens déjà rendus en balises `<a>` par le BBCode, y compris quand l’URL n’a pas été linkifiée par le script.

## v2.61 - 2026-04-14

- Limitation du message automatique AFK à 300 caractères, tout en conservant son édition directe depuis le panneau.
- Correction du panneau AFK pour éviter le reset immédiat du textarea pendant la saisie, avec conservation du brouillon non enregistré tant que le panneau reste ouvert.
- Séparation entre activation du mode AFK et activation des réponses automatiques, avec une checkbox dédiée dans le panneau et une protection après F5 pour ignorer les anciens messages réinjectés par le chargement du chat.

## v2.60 - 2026-04-13

- Ajustement du placement des actions natives `Répondre` et `Réagir` quand leur affichage à gauche est activé, pour mieux dégager le texte du message.
- Ajout d'une visionneuse grand format pour les images prévisualisées, ouvrable au clic depuis l'image, le lien image ou l'aperçu flottant.
- Ajout d’un bouton `play` sur les liens YouTube pour ouvrir la vidéo dans un player flottant, déplaçable, redimensionnable et maintenu dans l’écran, sans changer le clic normal sur le lien.
- Affichage du titre de la vidéo dans le player YouTube, avec mise à jour automatique quand on relance une autre vidéo dans la même fenêtre.
- Ajout d’un mode AFK activable au clavier sur le chat en cours, avec réponse automatique, historique dédié des mentions et réponses, et panneau persistant pour relire les messages au retour.
- Limitation globale des réponses automatiques du mode AFK à un envoi maximum par minute, même si plusieurs personnes mentionnent ou répondent entre-temps.
- Ajout d’une coupure dure des réponses automatiques AFK après 30 minutes d’inactivité, tout en continuant à stocker les mentions et réponses reçues.
- Désactivation automatique du mode AFK dès qu’un message est envoyé manuellement depuis l’input du chat, sans couper l’AFK lors des réponses automatiques du script.
- Ajout d’un statut `Non lu / Lu` sur les entrées AFK, avec conservation illimitée des non-lus et limitation des lus aux 50 plus récents.
- Ajout de la fermeture manuelle du panneau AFK quand le mode est inactif, avec réouverture au raccourci et déplacement du panneau à la souris.
- Refonte du paramétrage des notifications sonores avec des pills `Désactivé / Accueil / Chat / Les deux`, et repli automatique des réglages audio quand le son est coupé.
- Harmonisation des libellés, messages de validation et textes d’aide affichés dans les écrans du script, avec accents corrigés sans sur-traduire les termes techniques de l’interface.

## v2.52 - Snapshot initial - 2026-04-13

- Initialisation du fichier de release notes à partir de l'état réel du script, sans rétroaction sur les versions précédentes.
- Blacklist de pseudos avec ajout ou retrait depuis les paramètres ou via `Alt+clic`, et comptage des messages bloqués pendant la session.
- Stats box de suivi des messages bloqués, déplaçable, réductible, masquable et mémorisée séparément pour l'accueil et la page chat.
- Masquage de la shoutbox sur la page d'accueil avec réglage persistant.
- Mise en avant personnalisée d'utilisateurs avec couleur et opacité configurables.
- Détection des mentions `@moi` avec surbrillance configurable, clignotement optionnel, conservation de la couleur et prise en compte possible des réponses citées.
- Notifications sonores de mention avec plusieurs styles, URL audio personnalisée et délai anti-spam.
- Réponses rapides sauvegardées avec activation dédiée, configuration complète, ajout rapide depuis le texte du chat, édition, suppression, import/export JSON et suggestions contextuelles.
- Bouton GIF Klipy dans le chat avec tendances, recherche et insertion automatique en BBCode image.
- Raccourcis d'interaction sur la page chat avec double-clic pour répondre et clic long pour ouvrir les réactions.
- Déplacement optionnel des actions de message à gauche pour rendre `Répondre` et `Réagir` plus accessibles.
- Réglages de confort avec taille de police, URLs cliquables, prévisualisation des liens directs d'images au survol, ascenseur visible du chat et alignement des boutons du chat à droite.
- Mode debug qui n'efface pas les messages blacklistés mais les marque en rouge pour vérification.
