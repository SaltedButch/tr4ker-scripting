/**
 * Valide, compare et expose les raccourcis clavier des features.
 *
 * @module src/core/shortcuts
 */
const SUPPORTED_MODIFIERS = new Set(['platform', 'shift', 'ctrl']);

function detectMacPlatform() {
    const platform = [
        navigator.userAgentData?.platform,
        navigator.platform,
        navigator.userAgent
    ].filter(Boolean).join(' ');

    return /mac|iphone|ipad|ipod/i.test(platform);
}

/**
 * Indique si la condition vérifiée par « hasPlatformModifier » est satisfaite.
 *
 * @function hasPlatformModifier
 */
export function hasPlatformModifier(event, { isMac = detectMacPlatform() } = {}) {
    return isMac
        ? event.metaKey === true && event.altKey !== true
        : event.altKey === true && event.metaKey !== true;
}

function normalizeKey(value) {
    return String(value || '').trim().toLowerCase();
}

function isEditableTarget(target) {
    return target instanceof HTMLElement && (
        target.isContentEditable
        || target.matches('input, textarea, select')
    );
}

/**
 * Valide les données reçues par « validateShortcut ».
 *
 * @function validateShortcut
 */
export function validateShortcut(shortcut, featureId) {
    if (!shortcut || typeof shortcut !== 'object') {
        throw new Error(`Feature '${featureId}' contains an invalid shortcut.`);
    }
    if (!shortcut.id || typeof shortcut.id !== 'string') {
        throw new Error(`Every shortcut in feature '${featureId}' must declare an id.`);
    }
    if (!normalizeKey(shortcut.key)) {
        throw new Error(`Shortcut '${shortcut.id}' in feature '${featureId}' must declare a key.`);
    }

    const modifiers = shortcut.modifiers || ['platform'];
    if (!Array.isArray(modifiers) || modifiers.some((modifier) => !SUPPORTED_MODIFIERS.has(modifier))) {
        throw new Error(`Shortcut '${shortcut.id}' in feature '${featureId}' uses an unsupported modifier.`);
    }
}

/**
 * Indique si la condition vérifiée par « matchesShortcut » est satisfaite.
 *
 * @function matchesShortcut
 */
export function matchesShortcut(event, shortcut, { isMac = detectMacPlatform() } = {}) {
    if (event.isComposing || normalizeKey(event.key) !== normalizeKey(shortcut.key)) return false;

    const modifiers = new Set(shortcut.modifiers || ['platform']);
    const expectsPlatform = modifiers.has('platform');
    const expectsAlt = expectsPlatform && !isMac;
    const expectsMeta = expectsPlatform && isMac;

    return event.altKey === expectsAlt
        && event.metaKey === expectsMeta
        && event.shiftKey === modifiers.has('shift')
        && event.ctrlKey === modifiers.has('ctrl');
}

/**
 * Formate la valeur reçue par « formatShortcut ».
 *
 * @function formatShortcut
 */
export function formatShortcut(shortcut, { isMac = detectMacPlatform() } = {}) {
    const modifiers = new Set(shortcut.modifiers || ['platform']);
    const labels = [];

    if (modifiers.has('ctrl')) labels.push(isMac ? '⌃' : 'Ctrl');
    if (modifiers.has('shift')) labels.push(isMac ? '⇧' : 'Maj');
    if (modifiers.has('platform')) labels.push(isMac ? '⌘' : 'Alt');
    labels.push(String(shortcut.key).toUpperCase());

    return labels.join(isMac ? '' : '+');
}

/**
 * Crée l'API publique « createFeatureShortcutApi ».
 *
 * @function createFeatureShortcutApi
 */
export function createFeatureShortcutApi({ feature, addListener }) {
    const shortcuts = new Map(feature.shortcuts.map((shortcut) => [shortcut.id, shortcut]));

    return {
        definitions: [...shortcuts.values()],
        hasPlatformModifier,
        format(shortcutId) {
            const shortcut = shortcuts.get(shortcutId);
            if (!shortcut) throw new Error(`Unknown shortcut '${shortcutId}' in feature '${feature.id}'.`);
            return formatShortcut(shortcut);
        },
        bind(shortcutId, handler) {
            const shortcut = shortcuts.get(shortcutId);
            if (!shortcut) throw new Error(`Unknown shortcut '${shortcutId}' in feature '${feature.id}'.`);
            if (typeof handler !== 'function') throw new Error(`Shortcut '${shortcutId}' requires a handler.`);

            addListener(document, 'keydown', (event) => {
                if (!matchesShortcut(event, shortcut)) return;
                if (!shortcut.allowInEditable && isEditableTarget(event.target)) return;
                if (shortcut.preventDefault !== false) event.preventDefault();
                handler(event, shortcut);
            }, true);
        }
    };
}
