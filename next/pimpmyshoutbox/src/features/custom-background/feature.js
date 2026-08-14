/**
 * Implémente la feature « Custom Background » et son cycle de vie.
 *
 * @module src/features/custom-background/feature
 */
import { CONFIGURATION_IMPORTED_EVENT } from '../../core/config-backup.js';
import { defineFeature } from '../../core/feature-registry.js';
import { renderCustomBackgroundSettings } from './settings.js';

const COLOR_STORAGE_KEY = 'tm_t4_custom_background_color';
const LEGACY_ENABLED_STORAGE_KEY = 'tm_t4_custom_background_enabled';
const DEFAULT_COLOR = '#131313';
const ROOT_ATTRIBUTE = 'data-tm-custom-background';
const MANAGED_PROPERTIES = ['--surface', '--surface-dim', '--surface-container-low', 'background-color'];

function normalizeHexColor(value, fallback = DEFAULT_COLOR) {
    const match = String(value || '').trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!match) return fallback;
    const hex = match[1].length === 3
        ? match[1].split('').map((part) => part + part).join('')
        : match[1];
    return `#${hex.toLowerCase()}`;
}

function clearBackground() {
    const root = document.documentElement;
    if (!(root instanceof HTMLElement)) return;
    for (const property of MANAGED_PROPERTIES) root.style.removeProperty(property);
    root.removeAttribute(ROOT_ATTRIBUTE);
}

function applyBackground(color) {
    const root = document.documentElement;
    if (!(root instanceof HTMLElement)) return;
    const normalizedColor = normalizeHexColor(color);
    for (const property of ['--surface', '--surface-dim', '--surface-container-low', 'background-color']) {
        root.style.setProperty(property, normalizedColor);
    }
    root.setAttribute(ROOT_ATTRIBUTE, '1');
}

/**
 * Déclare la feature et son cycle de vie.
 *
 * @function feature
 */
export default defineFeature({
    id: 'custom-background',
    label: 'Couleur de fond personnalisée',
    defaultEnabled: false,
    legacyEnabledStorageKey: LEGACY_ENABLED_STORAGE_KEY,
    pages: [],
    storageKeys: [LEGACY_ENABLED_STORAGE_KEY, COLOR_STORAGE_KEY],
    settings: { area: 'site', category: 'appearance', order: 40, render: renderCustomBackgroundSettings },
    hints: [{ id: 'purpose', title: 'Fonctionnement', text: 'Applique la couleur choisie à l’arrière-plan de Tr4ker.', kind: 'info', order: 10 }],
    setup(context) {
        const getColor = () => normalizeHexColor(context.storage.get(COLOR_STORAGE_KEY));
        const apply = (color = getColor()) => {
            if (!context.platform.isTr4kerPage()) return;
            applyBackground(color);
        };
        const setColor = (color) => {
            const normalizedColor = normalizeHexColor(color);
            context.storage.set(COLOR_STORAGE_KEY, normalizedColor);
            apply(normalizedColor);
            return normalizedColor;
        };
        const preview = (color) => apply(normalizeHexColor(color));
        context.customBackground = { getColor, setColor, preview, apply };
        context.on(window, 'storage', (event) => { if (event.key === COLOR_STORAGE_KEY) apply(); });
        context.on(window, CONFIGURATION_IMPORTED_EVENT, apply);
        apply();
        return () => { delete context.customBackground; clearBackground(); };
    },
    onRoute(context) { context.customBackground?.apply(); }
});
