import { formatShortcut } from './shortcuts.js';

const SUPPORTED_HINT_KINDS = new Set(['info', 'tip', 'warning']);
const SHORTCUT_TOKEN_PATTERN = /\{\{shortcut:([a-z0-9-]+)\}\}/gi;

function getShortcutReferences(text) {
    return [...String(text || '').matchAll(SHORTCUT_TOKEN_PATTERN)].map((match) => match[1]);
}

export function validateFeatureHints(hints, feature) {
    if (hints === undefined) return;
    if (!Array.isArray(hints)) {
        throw new Error(`Feature '${feature.id}' hints must be an array.`);
    }

    const hintIds = new Set();
    const shortcutIds = new Set(feature.shortcuts.map((shortcut) => shortcut.id));

    for (const hint of hints) {
        if (!hint || typeof hint !== 'object' || !hint.id || typeof hint.id !== 'string') {
            throw new Error(`Every hint in feature '${feature.id}' must declare an id.`);
        }
        if (hintIds.has(hint.id)) {
            throw new Error(`Feature '${feature.id}' declares hint '${hint.id}' more than once.`);
        }
        hintIds.add(hint.id);

        if (!hint.text || typeof hint.text !== 'string') {
            throw new Error(`Hint '${hint.id}' in feature '${feature.id}' must declare text.`);
        }
        if (hint.kind && !SUPPORTED_HINT_KINDS.has(hint.kind)) {
            throw new Error(`Hint '${hint.id}' in feature '${feature.id}' uses an unsupported kind.`);
        }

        for (const shortcutId of getShortcutReferences(hint.text)) {
            if (!shortcutIds.has(shortcutId)) {
                throw new Error(`Hint '${hint.id}' in feature '${feature.id}' references unknown shortcut '${shortcutId}'.`);
            }
        }
    }
}

export function resolveFeatureHints(feature, platformOptions) {
    const shortcuts = new Map(feature.shortcuts.map((shortcut) => [shortcut.id, shortcut]));

    return feature.hints
        .map((hint) => ({
            id: hint.id,
            title: hint.title || '',
            kind: hint.kind || 'info',
            order: Number.isFinite(hint.order) ? hint.order : 100,
            text: hint.text.replace(SHORTCUT_TOKEN_PATTERN, (_, shortcutId) => (
                formatShortcut(shortcuts.get(shortcutId), platformOptions)
            ))
        }))
        .sort((left, right) => left.order - right.order);
}
