# Mentions @moi

Cette migration suit toutes les nouvelles mentions de la shoutbox via le
WebSocket Tr4ker : message, auteur, réponse citée et identifiant arrivent dans
le flux temps réel. Le DOM n’est plus analysé pour détecter une mention ; il ne
sert qu’à appliquer la surbrillance au message courant identifié par le socket.
Les réglages V3 sont relus depuis `tm_t4_mention_highlight_settings` sans
conversion manuelle.

## Garantie audio multi-onglets

Avant de jouer un son réel, chaque onglet demande une réservation partagée dans
`localStorage`. Sur les navigateurs qui le proposent, cette opération est
sérialisée avec la Web Locks API ; sur les autres, un court arbitrage confirme
le dernier propriétaire de la réservation. Une erreur de stockage désactive le
son pour cet événement : la règle est qu’une mention produit **zéro ou un** son,
jamais un son par onglet.

Les sons intégrés proposent plusieurs signatures (ping, doux, cloche, double,
carillon et pop). Leur volume, de 0 à 100 %, s’applique aussi aux fichiers
Pixabay personnalisés.

## Canaux et boîte de réception

La liste des canaux est récupérée à la volée depuis `/api/channels`, comme dans
la V3. Le canal actuellement ouvert reste toujours suivi ; l’option
**Surveiller aussi les canaux non ouverts** active les checkboxes de sélection.
Une mention venant d’un autre canal affiche un toast avec son extrait. Si la
boîte de réception est activée, elle est aussi conservée dans
`tm_t4_mention_inbox_v1` et accessible depuis la bulle ✉.

La boîte de réception V3 et les notifications de messages privés restent des
modules séparés. Le transport WebSocket est néanmoins déjà centralisé dans ce
module pour les mentions : il ne dépend plus du canal ouvert ni de l’analyse du
HTML historique.
