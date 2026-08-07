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

```bash
npm install
npm run check
```

Le bundle de développement est créé dans `dist/pimpmyshoutbox-next.user.js`.
Il porte volontairement le nom **Next (development)** et ne doit pas remplacer
le script V3 publié.

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

Les premières migrations devront viser des fonctionnalités indépendantes,
comme le récapitulatif de crédits ou les options d’apparence, avant les zones
transverses (modal de réglages, observer des messages, barres d’outils).
