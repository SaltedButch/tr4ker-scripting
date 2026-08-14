/**
 * Persiste l'historique des mentions reçues pendant le mode AFK.
 *
 * @module src/features/afk/records
 */
export const AFK_RECORDS_STORAGE_KEY = 'tm_t4_afk_records_v4';
const MAX_RECORDS = 500;

function normalizeRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const messageId = String(value.messageId || value.id || '').trim();
    const sender = String(value.sender || '').trim();
    const body = String(value.body || '').trim();
    if (!messageId || !sender || !body) return null;

    return {
        id: String(value.id || messageId).trim(),
        messageId,
        conversationId: String(value.conversationId || value.channelId || '').trim(),
        conversationName: String(value.conversationName || value.channelName || 'Conversation inconnue').trim().slice(0, 160),
        sender,
        body: body.slice(0, 4000),
        replyContextText: String(value.replyContextText || '').trim().slice(0, 4000),
        reason: value.reason === 'reply' ? 'reply' : (value.reason === 'mention+reply' ? 'mention+reply' : 'mention'),
        receivedAt: String(value.receivedAt || value.at || '').trim(),
        capturedAt: Math.max(0, Number(value.capturedAt) || Date.now()),
        source: value.source === 'cross-channel' ? 'cross-channel' : 'current-channel',
        isRead: value.isRead === true,
        readAt: Math.max(0, Number(value.readAt) || 0)
    };
}

function sortRecords(records) {
    return records.slice().sort((left, right) => (
        Number(left.isRead) - Number(right.isRead)
        || right.capturedAt - left.capturedAt
    )).slice(0, MAX_RECORDS);
}

/**
 * Crée l'API de l'historique AFK.
 *
 * @param {{ storage: ReturnType<import('../../core/storage.js').createStorage>, onUpdate?: function }} options
 * @returns {object}
 */
export function createAfkRecords({ storage, onUpdate = () => {} }) {
    let records = [];

    function reload() {
        const stored = storage.readJson(AFK_RECORDS_STORAGE_KEY, []);
        records = sortRecords((Array.isArray(stored) ? stored : []).map(normalizeRecord).filter(Boolean));
        onUpdate();
    }

    function save() {
        records = sortRecords(records);
        storage.writeJson(AFK_RECORDS_STORAGE_KEY, records);
        onUpdate();
    }

    reload();

    return Object.freeze({
        list: () => records.map((record) => ({ ...record })),
        reload,
        unreadCount: () => records.filter((record) => !record.isRead).length,
        add(value) {
            const record = normalizeRecord(value);
            if (!record) return null;
            const index = records.findIndex((entry) => entry.messageId === record.messageId);
            if (index >= 0) {
                records[index] = {
                    ...records[index],
                    ...record,
                    isRead: records[index].isRead,
                    readAt: records[index].readAt
                };
            } else {
                records.unshift(record);
            }
            save();
            return record;
        },
        setRead(recordId, isRead) {
            const id = String(recordId || '').trim();
            const index = records.findIndex((record) => record.id === id);
            if (index < 0) return false;
            records[index] = {
                ...records[index],
                isRead: isRead === true,
                readAt: isRead === true ? Date.now() : 0
            };
            save();
            return true;
        },
        markAllRead() {
            const now = Date.now();
            records = records.map((record) => record.isRead ? record : { ...record, isRead: true, readAt: now });
            save();
        },
        remove(recordIds) {
            const ids = new Set((Array.isArray(recordIds) ? recordIds : [recordIds])
                .map((id) => String(id || '').trim())
                .filter(Boolean));
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
