# PimpMyShoutbox Next

Ce dossier est le laboratoire de la refonte modulaire de PimpMyShoutbox. Il ne
participe ni au build `src/userscripts -> dist`, ni à la publication actuelle.

## Principes

- Un seul noyau gère le cycle de vie, les routes SPA et le nettoyage.
- Une feature est autonome : `id`, pages compatibles, réglages, `setup`,
  `onRoute` et nettoyage.
- Une feature ne crée pas de listener, observer ou timer directement : elle
  utilise le contexte afin que tout soit arrêté correctement.
- Les clés de stockage et les IDs DOM de la V3 sont conservés pendant la
  migration, sauf migration documentée.

L'analyse des responsabilités V3 et les contrats du noyau sont documentés dans
[CORE_ARCHITECTURE.md](./CORE_ARCHITECTURE.md).

## Démarrer

Node.js **22** est requis (le fichier `.nvmrc` permet à nvm de sélectionner la
bonne version) :

```bash
nvm use
npm install
npm run check
```

Le bundle de développement est créé dans `dist/pimpmyshoutbox-next.user.js`.
Il porte volontairement le nom **Next (development)** et ne doit pas remplacer
le script V3 publié.

Une fois installé, le raccourci `Ctrl+Alt+C` sous Windows/Linux ou `Ctrl+⌘+C`
sous macOS ouvre la configuration globale. Elle est volontairement vide tant
qu'aucune feature n'a été migrée. La fenêtre peut être déplacée avec son en-tête
et redimensionnée depuis son coin inférieur droit ; sa position et sa taille
sont conservées localement. Ses onglets passent automatiquement en haut à
l'horizontale lorsqu'elle est plus large que haute.

## Ajouter une feature

1. Copier `feature.template.js` dans `src/features/<nom>/feature.js`.
2. Donner un `id` stable, préfixé par le domaine fonctionnel si nécessaire.
3. Déclarer les pages concernées, les clés de stockage et la catégorie de réglages.
4. Enregistrer la feature dans `src/entry.js`.
5. Vérifier qu’une désactivation et un changement de route retirent bien son UI.

Le registre expose `setEnabled(featureId, enabled)` pour la future modal de
réglages. Les activations sont stockées sous `tm-t4-next:feature:<id>:enabled`;
les modules migrés pourront conserver leurs clés V3 métier dans `storageKeys`.

## Catégories de réglages

Une feature choisit l’onglet de ses réglages dans sa déclaration :

```js
settings: {
  category: 'media',
  order: 30
}
```

Les catégories admises sont définies dans `src/core/settings-categories.js` :
`general`, `chat`, `mentions`, `media`, `shortcuts`, `appearance` et
`statistics`. Le registre les valide et expose
`getFeaturesForSettingsCategory(categoryId)` pour la future modal.

Chaque feature est rendue selon le même standard dans sa catégorie : son
`label` forme le titre de la carte, une checkbox **Activer la feature** est
placée dessous, et les réglages déclarés dans `settings.render` ne s’affichent
que lorsqu’elle est active. L’identifiant technique n’est jamais affiché aux
utilisateurs.

## Raccourcis

Les raccourcis sont déclarés dans la feature et liés dans `setup` :

```js
shortcuts: [{
  id: 'open-panel',
  label: 'Ouvrir le panneau',
  key: 'P',
  modifiers: ['platform']
}],

setup(context) {
  context.shortcuts.bind('open-panel', () => openPanel());
}
```

`platform` est automatiquement interprété comme `Alt` sous Windows/Linux et
`⌘ Command` sous macOS. Les modificateurs `shift` et `ctrl` peuvent être ajoutés
si besoin. Par défaut, les raccourcis ne se déclenchent pas dans un champ de
saisie et empêchent le comportement navigateur associé ; ces deux choix peuvent
être modifiés avec `allowInEditable` et `preventDefault`.

## Astuces utilisateur

Une feature peut fournir des textes d’aide que la future modal affichera avec
ses réglages ou dans une zone d’aide dédiée :

```js
hints: [
  {
    id: 'purpose',
    title: 'À quoi ça sert ?',
    text: 'Explique le bénéfice et le fonctionnement de la feature.',
    kind: 'info'
  },
  {
    id: 'shortcut',
    title: 'Raccourci',
    text: 'Utilisez {{shortcut:open-panel}} pour ouvrir le panneau.',
    kind: 'tip'
  }
]
```

Les types disponibles sont `info`, `tip` et `warning`. Le token
`{{shortcut:<id>}}` est validé contre les raccourcis déclarés par la feature,
puis remplacé automatiquement par le libellé adapté à la plateforme (`Alt+P`
ou `⌘P`, par exemple).

## Mode debug

Le noyau expose l’état global du mode debug aux features via
`context.globals.isDebugModeEnabled()`. Une feature qui doit réagir au
changement sans rechargement peut s’abonner avec
`context.globals.subscribeToDebugMode(callback)` et enregistrer la fonction de
désabonnement par `context.addCleanup(...)`. Le template contient un exemple
commenté.

Après la blacklist, les prochaines migrations viseront des fonctionnalités
indépendantes comme le récapitulatif de crédits ou les options d’apparence,
avant les zones les plus transverses (mentions/AFK, barres d’outils, médias).

La première feature migrée est la [blacklist](./src/features/blacklist/README.md).
