/**
 * Implémente la feature « Adult Mode » et son cycle de vie.
 *
 * @module src/features/adult-mode/feature
 */
import { defineFeature } from '../../core/feature-registry.js';
import { renderAdultModeSettings } from './settings.js';

const ME_ENDPOINT = '/api/me';
const PREFERENCES_ENDPOINT = '/api/me/preferences';

function asPreferences(value) {
    return value && typeof value === 'object' ? value : {};
}

async function readPreferences() {
    const response = await fetch(ME_ENDPOINT, { credentials: 'include' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return asPreferences(await response.json());
}

async function saveAdultPreference(preferences, enabled) {
    const response = await fetch(PREFERENCES_ENDPOINT, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            show_adult: Boolean(enabled),
            upload_anonymous: preferences.upload_anonymous === true,
            mute_mention_notifications: preferences.mute_mention_notifications === true,
            hide_ratio: preferences.hide_ratio === true,
            hide_uploads: preferences.hide_uploads === true,
            hide_leaderboard: preferences.hide_leaderboard === true
        })
    });
    let payload = null;
    try { payload = await response.json(); } catch { /* HTTP status remains authoritative */ }
    if (!response.ok) throw new Error(payload?.error || `HTTP ${response.status}`);
}

/**
 * Déclare la feature et son cycle de vie.
 *
 * @function feature
 */
export default defineFeature({
    id: 'adult-mode',
    label: 'Mode adulte',
    defaultEnabled: true,
    pages: [],
    settings: {
        area: 'site',
        category: 'site',
        order: 10,
        render: renderAdultModeSettings
    },
    shortcuts: [{
        id: 'toggle',
        label: 'Activer ou désactiver le mode adulte',
        key: 'P',
        modifiers: ['ctrl', 'platform'],
        allowInEditable: false,
        preventDefault: true
    }],
    hints: [{
        id: 'shortcut',
        title: 'Raccourci',
        text: 'Utilisez {{shortcut:toggle}} pour modifier rapidement ce réglage.',
        kind: 'tip',
        order: 10
    }],
    setup(context) {
        let request = null;

        async function getEnabled() {
            const preferences = await readPreferences();
            return preferences.show_adult === true;
        }

        async function toggle() {
            if (request) return request;
            request = (async () => {
                const preferences = await readPreferences();
                const enabled = preferences.show_adult !== true;
                await saveAdultPreference(preferences, enabled);
                context.ui.toast.show(enabled ? 'Mode adulte activé.' : 'Mode adulte désactivé.');
                window.setTimeout(() => window.location.reload(), 350);
                return enabled;
            })().finally(() => { request = null; });
            return request;
        }

        context.adultMode = { getEnabled, toggle };
        context.shortcuts.bind('toggle', () => {
            void toggle().catch((error) => {
                context.ui.toast.show(`Impossible de modifier le mode adulte : ${error.message || 'erreur inconnue.'}`, { error: true });
            });
        });
        return () => { delete context.adultMode; };
    }
});
