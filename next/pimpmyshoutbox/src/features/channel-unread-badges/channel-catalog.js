export const CHANNEL_IDS_STORAGE_KEY = 'tm_t4_hidden_channel_unread_badges_channels';

export function createChannelCatalog({ storage, staleAfterMs = 5 * 60 * 1000 }) {
    let channels = new Map();
    let fetchedAt = 0;
    let request = null;

    function selectedIds() {
        const value = storage.readJson(CHANNEL_IDS_STORAGE_KEY, null);
        return Array.isArray(value) ? [...new Set(value.map((id) => String(id || '').trim()).filter(Boolean))] : null;
    }
    function save(ids) { storage.writeJson(CHANNEL_IDS_STORAGE_KEY, [...new Set(ids.map((id) => String(id || '').trim()).filter(Boolean))]); }
    async function refresh(force = false) {
        if (!force && channels.size && Date.now() - fetchedAt < staleAfterMs) return channels;
        if (request) return request;
        request = fetch('/api/channels', { credentials: 'include' })
            .then((response) => response.ok ? response.json() : null)
            .then((payload) => {
                const next = new Map();
                for (const channel of Array.isArray(payload?.channels) ? payload.channels : []) {
                    const id = String(channel?.id ?? '').trim(); const slug = String(channel?.slug ?? '').trim(); const name = String(channel?.name ?? slug).trim();
                    if (id && slug && name) next.set(id, { id, slug, name });
                }
                if (next.size) channels = next;
                fetchedAt = Date.now(); return channels;
            })
            .catch(() => channels)
            .finally(() => { request = null; });
        return request;
    }
    return Object.freeze({
        refresh,
        getAll: () => [...channels.values()].sort((left, right) => left.name.localeCompare(right.name, 'fr')),
        isSelected(id) { const selected = selectedIds(); return selected === null || selected.includes(String(id || '').trim()); },
        setSelected(id, enabled) {
            const safeId = String(id || '').trim(); if (!safeId) return;
            const next = new Set(selectedIds() ?? channels.keys());
            if (enabled) next.add(safeId); else next.delete(safeId);
            save([...next]);
        },
        selectAll() { save([...channels.keys()]); }
    });
}
