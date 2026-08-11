import { clamp, normalizeName } from '../../core/text.js';

export const MENTION_SETTINGS_STORAGE_KEY = 'tm_t4_mention_highlight_settings';

const DEFAULTS = Object.freeze({
    username: '',
    color: '#22c55e',
    opacityPercent: 18,
    blinkSeconds: 6,
    keepHighlightAfterBlink: true,
    includeReplyContext: false,
    soundEnabled: false,
    soundScope: 'off',
    soundStyle: 'ping',
    soundCustomUrl: '',
    soundCooldownSeconds: 8,
    soundVolumePercent: 100
});

function normalizeColor(value) {
    const color = String(value || '').trim();
    return /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : DEFAULTS.color;
}

function normalizeSoundStyle(value) {
    const style = String(value || '').trim().toLowerCase();
    return ['ping', 'soft', 'bell', 'double', 'chime', 'pop', 'custom'].includes(style) ? style : DEFAULTS.soundStyle;
}

function normalizeSoundScope(value, legacyEnabled) {
    const scope = String(value ?? (legacyEnabled === true ? 'chat' : 'off')).trim().toLowerCase();
    // V3 accepted "both" during a short transition but used it as "chat".
    return scope === 'chat' || scope === 'both' ? 'chat' : 'off';
}

function normalizeCustomUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    try {
        const url = new URL(raw);
        return url.protocol === 'https:' && url.hostname.toLowerCase() === 'cdn.pixabay.com'
            ? url.href
            : '';
    } catch {
        return '';
    }
}

export function normalizeMentionSettings(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...DEFAULTS };
    const soundScope = normalizeSoundScope(value.soundScope, value.soundEnabled);
    return {
        username: normalizeName(value.username),
        color: normalizeColor(value.color),
        opacityPercent: clamp(Number.isFinite(Number(value.opacityPercent)) ? Number(value.opacityPercent) : DEFAULTS.opacityPercent, 0, 100),
        blinkSeconds: clamp(Number.isFinite(Number(value.blinkSeconds)) ? Number(value.blinkSeconds) : DEFAULTS.blinkSeconds, 0, 30),
        keepHighlightAfterBlink: value.keepHighlightAfterBlink !== false,
        includeReplyContext: value.includeReplyContext === true,
        soundEnabled: soundScope !== 'off',
        soundScope,
        soundStyle: normalizeSoundStyle(value.soundStyle),
        soundCustomUrl: normalizeCustomUrl(value.soundCustomUrl),
        soundCooldownSeconds: clamp(Number.isFinite(Number(value.soundCooldownSeconds)) ? Number(value.soundCooldownSeconds) : DEFAULTS.soundCooldownSeconds, 0, 300),
        // Les réglages V3 n’avaient pas de volume : ils conservent donc le
        // niveau historique (100 %).
        soundVolumePercent: clamp(Number.isFinite(Number(value.soundVolumePercent)) ? Number(value.soundVolumePercent) : DEFAULTS.soundVolumePercent, 0, 100)
    };
}

export function createMentionState({ storage }) {
    let settings = normalizeMentionSettings(storage.readJson(MENTION_SETTINGS_STORAGE_KEY, null));

    return Object.freeze({
        get: () => ({ ...settings }),
        reload() {
            settings = normalizeMentionSettings(storage.readJson(MENTION_SETTINGS_STORAGE_KEY, null));
            return this.get();
        },
        save(nextSettings) {
            settings = normalizeMentionSettings({ ...settings, ...nextSettings });
            storage.writeJson(MENTION_SETTINGS_STORAGE_KEY, settings);
            return this.get();
        }
    });
}
