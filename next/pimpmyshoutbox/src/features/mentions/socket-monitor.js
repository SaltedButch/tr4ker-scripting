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

/**
 * The socket is the source of truth for a mention. It intentionally does not
 * inspect a rendered message: a DOM node is only used later to paint a message
 * which the socket has already identified by id.
 */
export function createMentionSocketMonitor({ getSettings, text, onMention, logger = console }) {
    const seenMessageIds = new Set();
    let socket = null;
    let reconnectTimer = null;
    let reconnectDelay = 1000;
    let stopped = false;

    function remember(messageId) {
        if (!messageId || seenMessageIds.has(messageId)) return false;
        seenMessageIds.add(messageId);
        if (seenMessageIds.size > 500) seenMessageIds.delete(seenMessageIds.values().next().value);
        return true;
    }

    function matches(message, settings) {
        const watchedUsername = text.normalizeComparableText(settings.username).replace(/^@+/, '');
        if (!watchedUsername) return { matched: false };
        const mentionRegex = new RegExp(`(^|[^\\p{L}\\p{N}_])@${escapeRegExp(watchedUsername)}(?=$|[^\\p{L}\\p{N}_])`, 'u');
        const directMentionMatched = mentionRegex.test(text.normalizeComparableText(message?.body));
        const replyContext = getReplyContext(message);
        const replyMentionMatched = settings.includeReplyContext
            && text.normalizeComparableText(replyContext.author).replace(/^@+/, '') === watchedUsername;
        return {
            matched: directMentionMatched || replyMentionMatched,
            reason: directMentionMatched && replyMentionMatched ? 'mention+reply' : (replyMentionMatched ? 'reply' : 'mention'),
            replyContext
        };
    }

    function closeSocket() {
        const currentSocket = socket;
        socket = null;
        if (currentSocket && (currentSocket.readyState === WebSocket.OPEN || currentSocket.readyState === WebSocket.CONNECTING)) {
            currentSocket.close();
        }
    }

    function scheduleReconnect() {
        if (stopped || reconnectTimer) return;
        reconnectTimer = window.setTimeout(() => {
            reconnectTimer = null;
            connect();
        }, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
    }

    function handleMessage(payload) {
        if (payload?.type !== 'msg.received') return;
        const settings = getSettings();
        if (!settings.username) return;
        const messageId = String(payload.id || buildFallbackMessageId(payload)).trim();
        const sender = String(payload.sender || '').trim();
        if (!messageId || text.normalizeName(sender) === text.normalizeName(settings.username)) return;
        const match = matches(payload, settings);
        if (!match.matched || !remember(messageId)) return;
        onMention({
            id: messageId,
            conversationId: String(payload.conv_id || '').trim(),
            sender,
            body: String(payload.body || ''),
            receivedAt: String(payload.at || ''),
            reason: match.reason,
            replyContextText: [
                match.replyContext.author ? `@${match.replyContext.author.replace(/^@+/, '')}` : '',
                match.replyContext.body
            ].filter(Boolean).join(' : ')
        });
    }

    function connect() {
        if (stopped || !getSettings().username || socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) return;
        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        try {
            socket = new WebSocket(`${protocol}//${location.host}/api/ws`);
        } catch (error) {
            logger.warn?.('[Mentions] WebSocket connection failed.', error);
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
                handleMessage(payload);
            } catch (error) {
                logger.warn?.('[Mentions] Invalid WebSocket event ignored.', error);
            }
        });
        currentSocket.addEventListener('close', () => {
            if (socket !== currentSocket) return;
            socket = null;
            scheduleReconnect();
        });
        currentSocket.addEventListener('error', () => {
            // The close event owns reconnection to avoid parallel retries.
        });
    }

    return Object.freeze({
        sync() {
            if (getSettings().username) {
                connect();
                return;
            }
            if (reconnectTimer) window.clearTimeout(reconnectTimer);
            reconnectTimer = null;
            closeSocket();
        },
        stop() {
            stopped = true;
            if (reconnectTimer) window.clearTimeout(reconnectTimer);
            reconnectTimer = null;
            closeSocket();
        }
    });
}
