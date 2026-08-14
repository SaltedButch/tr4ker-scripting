/**
 * Partage la connexion WebSocket et normalise les événements de mention.
 *
 * @module src/features/mentions/event-hub
 */
import { normalizeName } from '../../core/text.js';

function escapeRegExp(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getReplyContext(message) {
    const parent = message?.parent;
    if (!parent || typeof parent !== 'object') return { author: '', body: '' };
    return {
        author: String(parent.sender || parent.author || parent.username || parent.user?.username || '').trim(),
        body: String(parent.body || parent.content || parent.text || '').trim()
    };
}

function buildFallbackMessageId(message) {
    return [message?.conv_id, message?.at, message?.sender, message?.body]
        .map((value) => String(value || '').trim())
        .join(':');
}

function normalizeComparable(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function getMentionMatch(message, settings) {
    const watchedUsername = normalizeComparable(settings?.username).replace(/^@+/, '');
    if (!watchedUsername) return null;

    const mentionRegex = new RegExp(`(^|[^\\p{L}\\p{N}_])@${escapeRegExp(watchedUsername)}(?=$|[^\\p{L}\\p{N}_])`, 'u');
    const body = normalizeComparable(message?.body);
    const directMentionMatched = mentionRegex.test(body);
    const replyContext = getReplyContext(message);
    const replyMentionMatched = settings?.includeReplyContext === true
        && normalizeComparable(replyContext.author).replace(/^@+/, '') === watchedUsername;

    if (!directMentionMatched && !replyMentionMatched) return null;
    return {
        reason: directMentionMatched && replyMentionMatched ? 'mention+reply' : (replyMentionMatched ? 'reply' : 'mention'),
        replyContext
    };
}

function normalizeEvent(message, match) {
    const id = String(message?.id || buildFallbackMessageId(message)).trim();
    const sender = String(message?.sender || '').trim();
    if (!id || !sender || !String(message?.body || '').trim()) return null;

    return Object.freeze({
        id,
        conversationId: String(message?.conv_id || '').trim(),
        sender,
        senderNormalized: normalizeName(sender),
        body: String(message?.body || ''),
        receivedAt: String(message?.at || '').trim(),
        reason: match.reason,
        replyContextText: [
            match.replyContext.author ? `@${match.replyContext.author.replace(/^@+/, '')}` : '',
            match.replyContext.body
        ].filter(Boolean).join(' : ')
    });
}

const subscribers = new Set();
const seenMessageIds = new Set();
let socket = null;
let reconnectTimer = null;
let reconnectDelay = 1000;
let stopped = false;

function rememberMessageId(messageId) {
    if (!messageId || seenMessageIds.has(messageId)) return false;
    seenMessageIds.add(messageId);
    if (seenMessageIds.size > 1000) seenMessageIds.delete(seenMessageIds.values().next().value);
    return true;
}

function hasWatchedUsername() {
    return [...subscribers].some((subscriber) => String(subscriber.getSettings?.().username || '').trim());
}

function closeSocket() {
    const currentSocket = socket;
    socket = null;
    if (currentSocket && (currentSocket.readyState === WebSocket.OPEN || currentSocket.readyState === WebSocket.CONNECTING)) {
        currentSocket.close();
    }
}

function scheduleReconnect() {
    if (stopped || reconnectTimer || !hasWatchedUsername()) return;
    reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        connect();
    }, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, 30000);
}

function dispatch(message) {
    const deliveries = [];
    for (const subscriber of subscribers) {
        const settings = subscriber.getSettings?.() || {};
        if (normalizeName(message?.sender) === normalizeName(settings.username)) continue;
        const match = getMentionMatch(message, settings);
        if (!match) continue;
        const event = normalizeEvent(message, match);
        if (event) deliveries.push({ subscriber, event });
    }

    if (deliveries.length === 0) return;
    const eventId = deliveries[0].event.id;
    if (!rememberMessageId(eventId)) return;

    for (const { subscriber, event } of deliveries) {
        try {
            subscriber.onMention(event);
        } catch (error) {
            subscriber.logger?.error?.('[Mentions] Event subscriber failed.', error);
        }
    }
}

function connect() {
    if (stopped || !hasWatchedUsername() || socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) return;
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';

    try {
        socket = new WebSocket(`${protocol}//${location.host}/api/ws`);
    } catch (error) {
        console.warn('[Mentions] WebSocket connection failed.', error);
        scheduleReconnect();
        return;
    }

    const currentSocket = socket;
    currentSocket.addEventListener('open', () => {
        if (socket === currentSocket) reconnectDelay = 1000;
    });
    currentSocket.addEventListener('message', (event) => {
        try {
            const payload = JSON.parse(event.data);
            if (payload?.type === 'ping') {
                currentSocket.send(JSON.stringify({ type: 'pong' }));
                return;
            }
            if (payload?.type === 'msg.received') dispatch(payload);
        } catch (error) {
            console.warn('[Mentions] Invalid WebSocket event ignored.', error);
        }
    });
    currentSocket.addEventListener('close', () => {
        if (socket !== currentSocket) return;
        socket = null;
        scheduleReconnect();
    });
    currentSocket.addEventListener('error', () => {
        // La fermeture gère la reconnexion afin d'éviter les retries parallèles.
    });
}

function sync() {
    if (hasWatchedUsername()) {
        connect();
        return;
    }
    if (reconnectTimer) window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
    closeSocket();
}

/**
 * Abonne une feature au WebSocket partagé des mentions.
 *
 * @param {{ getSettings?: function, onMention: function, logger?: Console }} subscriber
 * @returns {{ sync: function, release: function }}
 */
export function acquireMentionEventHub(subscriber) {
    if (!subscriber || typeof subscriber.onMention !== 'function') {
        throw new Error('A mention event subscriber must provide onMention(event).');
    }

    stopped = false;
    subscribers.add(subscriber);
    sync();

    return Object.freeze({
        sync,
        release() {
            subscribers.delete(subscriber);
            if (subscribers.size === 0) {
                if (reconnectTimer) window.clearTimeout(reconnectTimer);
                reconnectTimer = null;
                closeSocket();
            } else {
                sync();
            }
        }
    });
}
