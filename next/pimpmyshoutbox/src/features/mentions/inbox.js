export const MENTION_INBOX_STORAGE_KEY = 'tm_t4_mention_inbox_v1';
export const MENTION_INBOX_ENABLED_STORAGE_KEY = 'tm_t4_mention_inbox_enabled';

function normalizeRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const messageId = String(value.messageId || value.id || '').trim();
    const sender = String(value.sender || '').trim().slice(0, 160);
    const body = String(value.body || '').trim().slice(0, 4000);
    if (!messageId || !sender || !body) return null;
    return {
        id: String(value.id || messageId).trim(),
        messageId,
        channelId: String(value.channelId || '').trim(),
        channelName: String(value.channelName || 'Conversation inconnue').trim().slice(0, 160),
        sender,
        body,
        replyContextText: String(value.replyContextText || '').trim().slice(0, 4000),
        at: String(value.at || '').trim(),
        capturedAt: Math.max(0, Number(value.capturedAt) || Date.now()),
        reason: value.reason === 'reply' ? 'reply' : (value.reason === 'mention+reply' ? 'mention+reply' : 'mention'),
        isRead: value.isRead === true || Math.max(0, Number(value.readAt) || 0) > 0,
        readAt: Math.max(0, Number(value.readAt) || 0),
        isArchived: value.isArchived === true || Math.max(0, Number(value.archivedAt) || 0) > 0,
        archivedAt: Math.max(0, Number(value.archivedAt) || 0)
    };
}

export function createMentionInbox({ storage, onUpdate = () => {} }) {
    let records = [];

    function reload() {
        const value = storage.readJson(MENTION_INBOX_STORAGE_KEY, []);
        records = (Array.isArray(value) ? value : []).map(normalizeRecord).filter(Boolean).slice(0, 300);
        onUpdate();
    }

    reload();

    function save() {
        records = records.slice().sort((left, right) => Number(left.isArchived) - Number(right.isArchived) || Number(left.isRead) - Number(right.isRead) || right.capturedAt - left.capturedAt).slice(0, 300);
        storage.writeJson(MENTION_INBOX_STORAGE_KEY, records);
        onUpdate();
    }

    return Object.freeze({
        isEnabled: () => storage.readBoolean(MENTION_INBOX_ENABLED_STORAGE_KEY, false),
        setEnabled(enabled) {
            storage.writeBoolean(MENTION_INBOX_ENABLED_STORAGE_KEY, enabled);
            onUpdate();
        },
        list: () => records.map((record) => ({ ...record })),
        reload,
        unreadCount: () => records.filter((record) => !record.isRead && !record.isArchived).length,
        add(value) {
            const record = normalizeRecord(value);
            if (!record) return null;
            const index = records.findIndex((entry) => entry.messageId === record.messageId);
            if (index >= 0) records[index] = {
                ...records[index], ...record,
                isRead: records[index].isRead,
                readAt: records[index].readAt,
                isArchived: records[index].isArchived,
                archivedAt: records[index].archivedAt
            };
            else records.unshift(record);
            save();
            return record;
        },
        markRead(recordId) {
            const index = records.findIndex((record) => record.id === String(recordId || '').trim());
            if (index < 0) return;
            records[index] = { ...records[index], isRead: true, readAt: Date.now() };
            save();
        },
        setRecordState(recordId, changes = {}) {
            const index = records.findIndex((record) => record.id === String(recordId || '').trim());
            if (index < 0) return;
            const current = records[index];
            const now = Date.now();
            records[index] = {
                ...current,
                isRead: changes.isRead === undefined ? current.isRead : changes.isRead === true,
                readAt: changes.isRead === undefined ? current.readAt : (changes.isRead ? now : 0),
                isArchived: changes.isArchived === undefined ? current.isArchived : changes.isArchived === true,
                archivedAt: changes.isArchived === undefined ? current.archivedAt : (changes.isArchived ? now : 0)
            };
            save();
        },
        markAllRead() {
            const now = Date.now();
            records = records.map((record) => (record.isRead || record.isArchived) ? record : { ...record, isRead: true, readAt: now });
            save();
        },
        remove(recordIds) {
            const ids = new Set((Array.isArray(recordIds) ? recordIds : [recordIds])
                .map((id) => String(id || '').trim())
                .filter(Boolean));
            if (ids.size === 0) return 0;
            const previousLength = records.length;
            records = records.filter((record) => !ids.has(record.id));
            const removed = previousLength - records.length;
            if (removed > 0) save();
            return removed;
        },
        clear() {
            records = [];
            save();
        }
    });
}
