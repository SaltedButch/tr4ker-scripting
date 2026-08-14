/**
 * Rend l'onglet d'aide de la fenêtre de réglages.
 *
 * @module src/core/settings-help
 */
const HELP_TAB = Object.freeze({
    id: 'help',
    label: 'Aide',
    type: 'help'
});

/**
 * Core-owned help tab.
 *
 * Features only declare their hints; this module aggregates and displays them.
 * It deliberately has no feature lifecycle or enabled state of its own, so the
 * help surface remains available even when every feature is disabled.
 */
export function createSettingsHelpTab({ registry }) {
    function render(content) {
        content.replaceChildren();
        const title = document.createElement('h2');
        title.textContent = 'Aide des fonctionnalités';
        content.append(title);

        const features = registry.getRegisteredFeatures()
            .filter((feature) => registry.getFeatureHints(feature.id).length > 0);
        if (features.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'tm-t4-next-settings-empty';
            empty.textContent = 'Aucune aide n’est encore disponible.';
            content.append(empty);
            return;
        }

        for (const feature of features) {
            const card = document.createElement('section');
            card.className = 'tm-t4-next-settings-card';
            const featureTitle = document.createElement('strong');
            featureTitle.textContent = feature.label || feature.id;
            card.append(featureTitle);

            for (const hint of registry.getFeatureHints(feature.id)) {
                const hintElement = document.createElement('div');
                hintElement.className = 'tm-t4-next-settings-hint';
                hintElement.dataset.kind = hint.kind;
                if (hint.title) {
                    const hintTitle = document.createElement('span');
                    hintTitle.className = 'tm-t4-next-settings-hint-title';
                    hintTitle.textContent = hint.title;
                    hintElement.append(hintTitle);
                }
                hintElement.append(document.createTextNode(hint.text));
                card.append(hintElement);
            }
            content.append(card);
        }
    }

    return Object.freeze({ ...HELP_TAB, render });
}
