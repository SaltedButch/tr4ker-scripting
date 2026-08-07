import { createFeatureContext } from './feature-context.js';
import { resolveFeatureHints, validateFeatureHints } from './feature-hints.js';
import { isSettingsCategory } from './settings-categories.js';
import { validateShortcut } from './shortcuts.js';

function matchesPage(feature, page) {
    return !Array.isArray(feature.pages) || feature.pages.length === 0 || feature.pages.includes(page);
}

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
    if (definition.shortcuts !== undefined && !Array.isArray(definition.shortcuts)) {
        throw new Error(`Feature '${definition.id}' shortcuts must be an array.`);
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

    return Object.freeze({
        defaultEnabled: true,
        pages: [],
        shortcuts: [],
        hints: [],
        ...definition,
        settings: {
            category: 'general',
            order: 100,
            ...definition.settings
        }
    });
}

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
            refreshFeature(feature);
        },
        getRegisteredFeatures() {
            return [...features.values()];
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
        getFeatureHints(featureId, platformOptions) {
            const feature = features.get(featureId);
            if (!feature) throw new Error(`Unknown feature '${featureId}'.`);
            return resolveFeatureHints(feature, platformOptions);
        }
    };
}
