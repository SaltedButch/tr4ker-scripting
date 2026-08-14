/**
 * Regroupe les fonctions de la feature « Mentions ».
 *
 * @module src/features/mentions/channel-catalog
 */
export const CROSS_CHANNEL_ENABLED_STORAGE_KEY = 'tm_t4_cross_channel_mention_enabled';
export const CROSS_CHANNEL_IDS_STORAGE_KEY = 'tm_t4_cross_channel_mention_channels';

/**
 * Crée l'API publique « createMentionChannelCatalog ».
 *
 * @function createMentionChannelCatalog
 */
export function createMentionChannelCatalog({ storage, staleAfterMs = 5 * 60 * 1000 }) {
    let channels = new Map();
    let fetchedAt = 0;
    let request = null;

    function loadSelectedIds() {
        const value = storage.readJson(CROSS_CHANNEL_IDS_STORAGE_KEY, null);
        if (!Array.isArray(value)) return null; // V3: null means every channel.
        return [...new Set(value.map((id) => String(id || '').trim()).filter(Boolean))];
    }

    function saveSelectedIds(ids) {
        storage.writeJson(CROSS_CHANNEL_IDS_STORAGE_KEY, [...new Set(ids.map((id) => String(id || '').trim()).filter(Boolean))]);
    }

    async function refresh(force = false) {
        if (!force && channels.size > 0 && Date.now() - fetchedAt < staleAfterMs) return channels;
        if (request) return request;
        request = fetch('/api/channels', { credentials: 'include' })
            .then((response) => response.ok ? response.json() : null)
            .then((payload) => {
                const next = new Map();
                for (const channel of Array.isArray(payload?.channels) ? payload.channels : []) {
                    const id = String(channel?.id ?? '').trim();
                    const slug = String(channel?.slug ?? '').trim();
                    const name = String(channel?.name ?? slug).trim();
                    if (id && slug && name) next.set(id, { id, slug, name });
                }
                if (next.size > 0) channels = next;
                fetchedAt = Date.now();
                return channels;
            })
            .catch(() => channels)
            .finally(() => { request = null; });
        return request;
    }

    return Object.freeze({
        refresh,
        get: (id) => channels.get(String(id || '').trim()) || null,
        getAll: () => [...channels.values()].sort((left, right) => left.name.localeCompare(right.name, 'fr')),
        isEnabled: () => storage.readBoolean(CROSS_CHANNEL_ENABLED_STORAGE_KEY, false),
        setEnabled(enabled) {
            storage.writeBoolean(CROSS_CHANNEL_ENABLED_STORAGE_KEY, enabled);
        },
        isChannelSelected(channelId) {
            const selectedIds = loadSelectedIds();
            return selectedIds === null || selectedIds.includes(String(channelId || '').trim());
        },
        setChannelSelected(channelId, enabled) {
            const id = String(channelId || '').trim();
            if (!id) return;
            const selectedIds = new Set(loadSelectedIds() ?? channels.keys());
            if (enabled) selectedIds.add(id);
            else selectedIds.delete(id);
            saveSelectedIds([...selectedIds]);
        },
        selectAll() {
            saveSelectedIds([...channels.keys()]);
        },
        isCurrent(channel, conversationId) {
            const activeConversationId = String(new URLSearchParams(location.search).get('conv') || '').trim();
            if (activeConversationId && activeConversationId === String(conversationId || '').trim()) return true;
            return Boolean(channel?.slug && location.pathname === `/communication/channels/${channel.slug}`);
        }
    });
}
