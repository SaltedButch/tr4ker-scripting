# Mosaïque de canaux

Le canal principal conserve l'interface native. Le bouton **+** des canaux
rejoints ouvre jusqu'à trois panneaux supplémentaires.

## Envoi des messages

- Clic sur **Envoyer** ou **Entrée** ; **Maj + Entrée** conserve le retour à la
  ligne et la composition IME ne déclenche pas d'envoi.
- Les identifiants des conversations conservent le type fourni par l'API dans
  les paquets WebSocket. Leur représentation texte sert aux clés DOM et locales.
- Le brouillon et le contexte de réponse sont conservés jusqu'à confirmation
  du serveur. Le champ et le bouton sont temporairement verrouillés pour éviter
  les doubles envois ; les textes insérés entre-temps par un autre outil ne sont
  pas effacés lorsque la confirmation arrive.
- Un refus, une coupure ou dix secondes sans confirmation affichent une erreur
  et laissent le texte disponible. Le socket ne garde pas de messages en file
  d'attente : une reconnexion ne provoque aucun envoi tardif automatique.
- Un seul message attend une confirmation sur le socket de la mosaïque, afin
  de pouvoir rattacher une erreur serveur sans identifiant de canal à cet envoi.

Les listeners et les délais du socket utilisent le contexte du noyau ; fermer
la feature arrête les reconnexions et les attentes de confirmation.

## Vérification

`npm test` simule une API avec identifiants numériques ou textuels, l'envoi
au clic et au clavier, une réponse, un refus suivi d'une nouvelle tentative,
une absence de confirmation, une déconnexion et la désactivation de la feature.
Aucun message n'est envoyé au site pendant ces tests.

Sur Tr4ker, ouvrir un canal supplémentaire et vérifier l'envoi au clic, puis
avec Entrée, et une réponse à un message. Le texte doit disparaître uniquement
après son apparition dans le canal. Vérifier ensuite qu'une coupure réseau
conserve le brouillon et que la reconnexion ne l'envoie pas automatiquement.
