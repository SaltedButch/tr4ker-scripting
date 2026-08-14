/**
 * Déclare les features et orchestre leur activation selon la page courante.
 *
 * @module src/core/feature-registry
 */
import { createFeatureContext } from './feature-context.js';
import { resolveFeatureHints, validateFeatureHints } from './feature-hints.js';
import { getSettingsCategory, SETTINGS_CATEGORIES, isSettingsArea, isSettingsCategory } from './settings-categories.js';
import { validateShortcut } from './shortcuts.js';

function matchesPage(feature, page) {
    return !Array.isArray(feature.pages) || feature.pages.length === 0 || feature.pages.includes(page);
}

/**
 * Valide et normalise la définition fournie à « defineFeature ».
 *
 * @function defineFeature
 */
export function defineFeature(definition) {
    if (!definition || typeof definition.id !== 'string' || !definition.id) {
        throw new Error('Every feature must declare a non-empty id.');
    }
    if (typeof definition.setup !== 'function') {
        throw new Error(`Feature '${definition.id}' must declare a setup(context) function.`);
    }
    if (definition.settings !== undefined && (!definition.settings || typeof definition.settings !== 'object')) {
        throw new Error(`Feature '${definition.id}' settings must be an object.`);
    }
    if (definition.settings?.category && !isSettingsCategory(definition.settings.category)) {
        throw new Error(`Feature '${definition.id}' uses the unknown settings category '${definition.settings.category}'.`);
    }
    if (definition.settings?.area && !isSettingsArea(definition.settings.area)) {
        throw new Error(`Feature '${definition.id}' uses the unknown settings area '${definition.settings.area}'.`);
    }
    if (definition.settings?.render && typeof definition.settings.render !== 'function') {
        throw new Error(`Feature '${definition.id}' settings render must be a function.`);
    }
    if (definition.shortcuts !== undefined && !Array.isArray(definition.shortcuts)) {
        throw new Error(`Feature '${definition.id}' shortcuts must be an array.`);
    }
    if (definition.exclusiveWith !== undefined && !Array.isArray(definition.exclusiveWith)) {
        throw new Error(`Feature '${definition.id}' exclusiveWith must be an array.`);
    }

    const shortcutIds = new Set();
    for (const shortcut of definition.shortcuts || []) {
        validateShortcut(shortcut, definition.id);
        if (shortcutIds.has(shortcut.id)) {
            throw new Error(`Feature '${definition.id}' declares shortcut '${shortcut.id}' more than once.`);
        }
        shortcutIds.add(shortcut.id);
    }
    validateFeatureHints(definition.hints, {
        ...definition,
        shortcuts: definition.shortcuts || []
    });

    const settingsCategory = definition.settings?.category || 'general';
    const settingsArea = definition.settings?.area || getSettingsCategory(settingsCategory)?.area || 'tools';

    return Object.freeze({
        defaultEnabled: true,
        pages: [],
        shortcuts: [],
        hints: [],
        exclusiveWith: [],
        ...definition,
        settings: {
            category: settingsCategory,
            area: settingsArea,
            order: 100,
            ...definition.settings
        }
    });
}

/**
 * Crée l'API publique « createFeatureRegistry ».
 *
 * @function createFeatureRegistry
 */
export function createFeatureRegistry({ appId, getPage, logger, services }) {
    const features = new Map();
    const activeContexts = new Map();

    function stopFeature(featureId) {
        const context = activeContexts.get(featureId);
        if (!context) return;

        try {
            context.feature.teardown?.(context);
        } finally {
            context.cleanup();
            activeContexts.delete(featureId);
        }
    }

    function startFeature(feature) {
        if (activeContexts.has(feature.id) || !matchesPage(feature, getPage())) return;

        const context = createFeatureContext({ appId, feature, getPage, logger, services });
        if (!context.isEnabled()) return;

        try {
            const teardown = feature.setup(context);
            if (typeof teardown === 'function') context.addCleanup(teardown);
            activeContexts.set(feature.id, context);
        } catch (error) {
            context.cleanup();
            logger.error(`[PimpMyShoutbox Next] Feature '${feature.id}' failed to start.`, error);
        }
    }

    function refreshFeature(feature) {
        const context = activeContexts.get(feature.id);
        const shouldRun = matchesPage(feature, getPage()) && (context ? context.isEnabled() : (() => {
            const transientContext = createFeatureContext({ appId, feature, getPage, logger, services });
            return transientContext.isEnabled();
        })());

        if (!shouldRun) {
            stopFeature(feature.id);
            return;
        }

        if (!context) {
            startFeature(feature);
            return;
        }

        try {
            feature.onRoute?.(context);
        } catch (error) {
            logger.error(`[PimpMyShoutbox Next] Feature '${feature.id}' failed during route refresh.`, error);
        }
    }

    return {
        register(feature) {
            if (features.has(feature.id)) throw new Error(`Duplicate feature id '${feature.id}'.`);
            features.set(feature.id, feature);
            return this;
        },
        start() {
            for (const feature of features.values()) startFeature(feature);
        },
        refresh() {
            for (const feature of features.values()) refreshFeature(feature);
        },
        stop() {
            for (const featureId of [...activeContexts.keys()].reverse()) stopFeature(featureId);
        },
        setEnabled(featureId, enabled) {
            const feature = features.get(featureId);
            if (!feature) throw new Error(`Unknown feature '${featureId}'.`);

            const context = activeContexts.get(featureId)
                || createFeatureContext({ appId, feature, getPage, logger, services });
            context.setEnabled(enabled);

            if (enabled) {
                for (const conflictingFeatureId of feature.exclusiveWith) {
                    const conflictingFeature = features.get(conflictingFeatureId);
                    if (!conflictingFeature) {
                        logger.warn(`[PimpMyShoutbox Next] Feature '${featureId}' declares unknown exclusive feature '${conflictingFeatureId}'.`);
                        continue;
                    }
                    const conflictingContext = activeContexts.get(conflictingFeatureId)
                        || createFeatureContext({ appId, feature: conflictingFeature, getPage, logger, services });
                    conflictingContext.setEnabled(false);
                    refreshFeature(conflictingFeature);
                }
            }
            refreshFeature(feature);
        },
        getRegisteredFeatures() {
            return [...features.values()];
        },
        getActiveContext(featureId) {
            return activeContexts.get(featureId) || null;
        },
        getFeaturesForSettingsCategory(categoryId) {
            if (!isSettingsCategory(categoryId)) {
                throw new Error(`Unknown settings category '${categoryId}'.`);
            }

            return [...features.values()]
                .filter((feature) => feature.settings.category === categoryId)
                .sort((left, right) => (
                    left.settings.order - right.settings.order
                    || left.label.localeCompare(right.label, 'fr')
                ));
        },
        getFeaturesForSettingsArea(areaId) {
            if (!isSettingsArea(areaId)) {
                throw new Error(`Unknown settings area '${areaId}'.`);
            }
            return [...features.values()]
                .filter((feature) => feature.settings.category !== 'general' && feature.settings.area === areaId)
                .sort((left, right) => (
                    left.settings.order - right.settings.order
                    || left.label.localeCompare(right.label, 'fr')
                ));
        },
        getSettingsCategoriesForArea(areaId) {
            if (!isSettingsArea(areaId)) {
                throw new Error(`Unknown settings area '${areaId}'.`);
            }
            return SETTINGS_CATEGORIES
                .filter((category) => category.id !== 'general' && [...features.values()].some((feature) => (
                    feature.settings.area === areaId && feature.settings.category === category.id
                )))
                .sort((left, right) => left.order - right.order);
        },
        getFeatureHints(featureId, platformOptions) {
            const feature = features.get(featureId);
            if (!feature) throw new Error(`Unknown feature '${featureId}'.`);
            return resolveFeatureHints(feature, platformOptions);
        }
    };
}
