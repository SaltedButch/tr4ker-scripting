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
    let searchQuery = '';

    function normalizeSearchText(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    function getVisibleFeatures(features) {
        const query = normalizeSearchText(searchQuery);
        if (!query) return features;
        return features.filter((feature) => {
            const hints = registry.getFeatureHints(feature.id);
            const searchableText = [
                feature.id,
                feature.label,
                ...hints.flatMap((hint) => [hint.title, hint.text])
            ].map(normalizeSearchText).join(' ');
            return searchableText.includes(query);
        });
    }

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

        const searchLabel = document.createElement('label');
        searchLabel.textContent = 'Rechercher dans l’aide';
        searchLabel.style.cssText = 'display:grid;gap:6px;margin:0 0 14px;color:#d4d4d8;font-size:12px;font-weight:600;';
        const searchInput = document.createElement('input');
        searchInput.type = 'search';
        searchInput.value = searchQuery;
        searchInput.placeholder = 'Feature, raccourci, mention, AFK…';
        searchInput.setAttribute('aria-label', 'Rechercher dans l’aide des fonctionnalités');
        searchInput.style.cssText = 'width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.16);border-radius:8px;background:#18181b;color:#fff;padding:9px 10px;font:inherit;font-weight:400;outline:none;';
        searchLabel.append(searchInput);
        content.append(searchLabel);

        const results = document.createElement('div');
        content.append(results);

        function renderResults() {
            results.replaceChildren();
            const visibleFeatures = getVisibleFeatures(features);
            if (visibleFeatures.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'tm-t4-next-settings-empty';
                empty.textContent = `Aucune aide ne correspond à « ${searchQuery} ».`;
                results.append(empty);
                return;
            }

            for (const feature of visibleFeatures) {
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
                results.append(card);
            }
        }

        searchInput.addEventListener('input', () => {
            searchQuery = searchInput.value;
            renderResults();
        });
        renderResults();
    }

    return Object.freeze({ ...HELP_TAB, render });
}
