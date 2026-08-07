import { defineFeature } from './src/core/feature-registry.js';

export default defineFeature({
    id: 'my-feature',
    label: 'Ma nouvelle feature',
    defaultEnabled: true,
    pages: ['chat'],
    storageKeys: [
        // 'tm_t4_my_feature_enabled'
    ],
    settings: {
        // Une des catégories déclarées dans src/core/settings-categories.js.
        category: 'chat',
        // Les réglages de la catégorie sont triés par cet ordre, puis par label.
        order: 100
    },
    shortcuts: [
        {
            id: 'open-panel',
            label: 'Ouvrir le panneau de la feature',
            key: 'P',
            // `platform` signifie Alt sous Windows/Linux et ⌘ Command sur macOS.
            modifiers: ['platform'],
            allowInEditable: false,
            preventDefault: true
        }
    ],
    hints: [
        {
            id: 'purpose',
            title: 'À quoi sert cette feature ?',
            text: 'Explique ici le bénéfice concret et le fonctionnement attendu.',
            kind: 'info',
            order: 10
        },
        {
            id: 'shortcut',
            title: 'Raccourci',
            text: 'Utilisez {{shortcut:open-panel}} pour ouvrir le panneau rapidement.',
            kind: 'tip',
            order: 20
        }
    ],

    setup(context) {
        context.shortcuts.bind('open-panel', (event, shortcut) => {
            // …
        });

        // Enregistrer ici les listeners, observers, timers et styles via context.
        // Ils seront automatiquement nettoyés lorsque la feature s’arrête.
        context.on(document, 'click', (event) => {
            // …
        });

        return () => {
            // Nettoyage métier spécifique facultatif.
        };
    },

    onRoute(context) {
        // Appelé lors des navigations SPA tant que la feature est active.
    },

    teardown(context) {
        // Facultatif : retirer les éléments DOM propres à la feature.
    }
});
