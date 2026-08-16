# Feature Blacklist

Première feature métier migrée depuis `pimpmyshoutbox.user.js` V3.

## Comportements repris

- lecture et écriture de la clé V3 `tm_hidden_shout_users_t4` ;
- reconnaissance des messages groupés : un message sans pseudo direct hérite du
  pseudo du message précédent uniquement lorsqu'il est explicitement groupé ;
- masquage local des messages correspondant à un pseudo blacklisté ;
- raccourci souris `Alt + clic` sur Windows/Linux, `⌘ + clic` sur macOS ;
- compteurs de messages filtrés limités à la session courante ;
- panneau de statistiques déplaçable/redimensionnable, utilisant les clés V3
  `tm_t4_stats_box_position_chat`, `tm_t4_stats_box_size_chat` et
  `tm_t4_stats_box_hidden_chat`.

## Différences assumées avec V3 à ce stade

- la feature ne modifie pas les statistiques globales, les mentions ou les
  surbrillances : ces responsabilités seront migrées séparément.
- le bouton de mentions à relire présent dans la stats box V3 n'est pas rendu
  avant la migration de la feature Mentions ; il ne serait pas fonctionnel.

## Test manuel

1. Désactiver temporairement le userscript V3 dans Tampermonkey : les deux
   versions écoutent le même `Alt/⌘ + clic` et lisent la même clé de stockage.
2. Installer le bundle `pimpmyshoutbox-next.user.js`.
3. Ouvrir `/communication`, puis `Ctrl+Alt+C` (`Ctrl+⌘+C` sur Mac).
4. Vérifier l'onglet **Chat**, ajouter un pseudo et vérifier le masquage.
5. Tester le raccourci souris sur un pseudo.
6. Déplacer/redimensionner le panneau **Messages filtrés**, puis recharger la
   page pour vérifier la persistance.
