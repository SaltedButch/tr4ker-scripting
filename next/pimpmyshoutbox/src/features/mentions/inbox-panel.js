/**
 * Rend le panneau de boîte de réception de « Mentions ».
 *
 * @module src/features/mentions/inbox-panel
 */
const BUBBLE_ID = 'tm-t4-next-mention-inbox-bubble';
const PANEL_ID = 'tm-t4-next-mention-inbox-panel';

function formatDate(value) {
    const timestamp = Date.parse(String(value || '')) || Number(value) || 0;
    return timestamp > 0
        ? new Date(timestamp).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
        : '';
}

function truncate(value, length = 220) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

function button(label, handler, { color = '#3f3f46', danger = false } = {}) {
    const element = document.createElement('button');
    element.type = 'button';
    element.textContent = label;
    element.style.cssText = `border:0;border-radius:7px;background:${color};color:${danger ? '#fca5a5' : '#fff'};padding:7px 9px;cursor:pointer;font-size:11px;`;
    element.addEventListener('click', handler);
    return element;
}

/**
 * Crée l'API publique « createMentionInboxPanel ».
 *
 * @function createMentionInboxPanel
 */
export function createMentionInboxPanel({ inbox, toast }) {
    let open = false;
    let readFilter = 'unread';
    let channelFilter = '';
    let senderFilter = '';
    let query = '';

    function close() {
        open = false;
        document.getElementById(PANEL_ID)?.remove();
        renderBubble();
    }

    function visibleRecords(records) {
        const normalizedQuery = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        return records.filter((record) => {
            if (readFilter === 'unread' && (record.isRead || record.isArchived)) return false;
            if (readFilter === 'read' && (!record.isRead || record.isArchived)) return false;
            if (readFilter === 'archived' && !record.isArchived) return false;
            if (channelFilter && record.channelId !== channelFilter) return false;
            if (senderFilter && record.sender !== senderFilter) return false;
            if (!normalizedQuery) return true;
            return [record.channelName, record.sender, record.body, record.replyContextText, record.at]
                .join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(normalizedQuery);
        });
    }

    function addSelect(container, value, options, onChange) {
        const select = document.createElement('select');
        select.style.cssText = 'min-width:0;background:#18181b;color:#fff;border:1px solid #3f3f46;border-radius:8px;padding:7px;';
        for (const [optionValue, label] of options) {
            const option = document.createElement('option');
            option.value = optionValue; option.textContent = label; option.selected = value === optionValue;
            select.append(option);
        }
        select.addEventListener('change', () => { onChange(select.value); renderPanel(); });
        container.append(select);
    }

    function renderPanel() {
        const existing = document.getElementById(PANEL_ID);
        if (!open || !inbox.isEnabled()) {
            existing?.remove();
            return;
        }
        const panel = existing instanceof HTMLElement ? existing : document.createElement('aside');
        panel.id = PANEL_ID;
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'Boîte de réception des mentions');
        panel.style.cssText = 'position:fixed;right:18px;top:72px;z-index:1000004;width:min(480px,calc(100vw - 24px));max-height:calc(100vh - 94px);overflow:auto;box-sizing:border-box;padding:14px;border-radius:14px;background:rgba(24,24,27,.98);border:1px solid rgba(255,255,255,.14);box-shadow:0 18px 46px rgba(0,0,0,.48);color:#e4e4e7;font-family:Inter,Arial,sans-serif;';
        const allRecords = inbox.list();
        const records = visibleRecords(allRecords);
        const channels = [...new Map(allRecords.filter((record) => record.channelId).map((record) => [record.channelId, record.channelName])).entries()]
            .sort(([, left], [, right]) => left.localeCompare(right, 'fr'));
        const senders = [...new Set(allRecords.map((record) => record.sender))].sort((left, right) => left.localeCompare(right, 'fr'));
        panel.replaceChildren();

        const header = document.createElement('div');
        header.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px;';
        const title = document.createElement('div');
        title.innerHTML = `<strong style="font-size:15px;">Mentions à relire</strong><div style="font-size:11px;color:#a1a1aa;margin-top:3px;">${inbox.unreadCount()} non lue${inbox.unreadCount() > 1 ? 's' : ''}</div>`;
        const closeButton = button('×', close);
        closeButton.title = 'Fermer'; closeButton.style.width = '28px'; closeButton.style.height = '28px'; closeButton.style.padding = '0'; closeButton.style.fontSize = '18px';
        header.append(title, closeButton);
        panel.append(header);

        const filters = document.createElement('div');
        filters.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;';
        addSelect(filters, readFilter, [['unread', 'Non lues'], ['all', 'Toutes'], ['read', 'Lues'], ['archived', 'Archivées']], (value) => { readFilter = value; });
        addSelect(filters, channelFilter, [['', 'Tous les canaux'], ...channels], (value) => { channelFilter = value; });
        addSelect(filters, senderFilter, [['', 'Tous les expéditeurs'], ...senders.map((sender) => [sender, sender])], (value) => { senderFilter = value; });
        const search = document.createElement('input');
        search.value = query; search.placeholder = 'Rechercher…';
        search.style.cssText = 'min-width:0;background:#18181b;color:#fff;border:1px solid #3f3f46;border-radius:8px;padding:7px;';
        search.addEventListener('input', () => { query = search.value; renderPanel(); });
        filters.append(search);
        panel.append(filters);

        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex;gap:7px;flex-wrap:wrap;margin:10px 0 12px;';
        actions.append(
            button('Tout marquer lu', () => { inbox.markAllRead(); renderPanel(); }, { color: '#2563eb' }),
            button('Effacer affichées', () => {
                const removed = inbox.remove(records.map((record) => record.id));
                renderPanel();
                if (removed > 0) toast(`${removed} mention${removed > 1 ? 's' : ''} effacée${removed > 1 ? 's' : ''}.`);
            }, { danger: true })
        );
        panel.append(actions);

        if (records.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = 'Aucune mention pour ce filtre.';
            empty.style.cssText = 'font-size:12px;color:#a1a1aa;padding:8px 2px;';
            panel.append(empty);
        }
        for (const record of records) {
            const item = document.createElement('article');
            const subdued = record.isRead || record.isArchived;
            item.style.cssText = `padding:10px;margin-top:8px;border-radius:10px;background:${record.isArchived ? 'rgba(113,113,122,.1)' : (record.isRead ? 'rgba(255,255,255,.04)' : 'rgba(37,99,235,.14)')};border:1px solid ${subdued ? 'rgba(255,255,255,.08)' : 'rgba(59,130,246,.3)'};`;
            const meta = document.createElement('div');
            meta.style.cssText = 'display:flex;justify-content:space-between;gap:8px;font-size:11px;color:#bfdbfe;';
            const sender = document.createElement('strong'); sender.textContent = record.sender;
            const place = document.createElement('span'); place.textContent = `${record.channelName} · ${formatDate(record.at || record.capturedAt)}`;
            meta.append(sender, place);
            const body = document.createElement('div'); body.textContent = truncate(record.body);
            body.style.cssText = 'margin-top:7px;font-size:12px;line-height:1.45;white-space:pre-wrap;word-break:break-word;';
            item.append(meta);
            if ((record.reason === 'reply' || record.reason === 'mention+reply') && record.replyContextText) {
                const reply = document.createElement('div'); reply.textContent = `↩ En réponse à : ${truncate(record.replyContextText, 160)}`;
                reply.style.cssText = 'margin-top:7px;padding:6px 8px;border-left:2px solid rgba(96,165,250,.72);background:rgba(59,130,246,.08);color:#bfdbfe;font-size:11px;line-height:1.4;';
                item.append(reply);
            }
            item.append(body);
            const actionsRow = document.createElement('div'); actionsRow.style.cssText = 'display:flex;justify-content:flex-end;gap:7px;flex-wrap:wrap;margin-top:9px;';
            const openLink = document.createElement('a');
            openLink.textContent = 'Ouvrir'; openLink.href = `/communication?${new URLSearchParams({ conv: record.channelId, msg: record.messageId }).toString()}`;
            openLink.style.cssText = 'padding:6px 8px;border-radius:7px;background:#1e3a8a;color:#bfdbfe;font-size:11px;text-decoration:none;';
            openLink.addEventListener('click', () => inbox.setRecordState(record.id, { isRead: true }));
            actionsRow.append(openLink);
            actionsRow.append(button(record.isRead ? 'Non lu' : 'Lu', () => { inbox.setRecordState(record.id, { isRead: !record.isRead }); renderPanel(); }));
            actionsRow.append(button(record.isArchived ? 'Désarchiver' : 'Archiver', () => { inbox.setRecordState(record.id, { isArchived: !record.isArchived }); renderPanel(); }));
            item.append(actionsRow);
            panel.append(item);
        }
        if (!existing) document.body?.append(panel);
    }

    function renderBubble() {
        const existing = document.getElementById(BUBBLE_ID);
        if (!inbox.isEnabled()) {
            existing?.remove(); open = false; document.getElementById(PANEL_ID)?.remove(); return;
        }
        const bubble = existing instanceof HTMLButtonElement ? existing : document.createElement('button');
        if (!existing) {
            bubble.id = BUBBLE_ID; bubble.type = 'button';
            bubble.style.cssText = 'position:fixed;top:calc(50% + 54px);right:0;z-index:99980;width:42px;height:42px;border:1px solid rgba(255,255,255,.16);border-right:0;border-radius:14px 0 0 14px;box-shadow:0 8px 24px rgba(0,0,0,.4);color:#f4f5f5;font:17px/1 system-ui,sans-serif;cursor:pointer;transition:width 140ms ease,background 140ms ease;';
            bubble.addEventListener('mouseenter', () => { bubble.style.width = '50px'; });
            bubble.addEventListener('mouseleave', () => { bubble.style.width = '42px'; });
            bubble.addEventListener('click', () => { open = !open; renderPanel(); renderBubble(); });
            document.body?.append(bubble);
        }
        const unread = inbox.unreadCount();
        bubble.textContent = `✉${unread > 0 ? ` ${unread > 99 ? '99+' : unread}` : ''}`;
        bubble.title = open ? 'Fermer les mentions à relire' : `Ouvrir les mentions à relire${unread ? ` (${unread})` : ''}`;
        bubble.setAttribute('aria-label', bubble.title);
        bubble.style.background = unread > 0 ? 'rgba(29,78,216,.98)' : 'rgba(24,24,27,.96)';
    }

    return Object.freeze({
        open() { open = true; renderPanel(); renderBubble(); },
        sync() { renderBubble(); renderPanel(); },
        destroy() { document.getElementById(BUBBLE_ID)?.remove(); document.getElementById(PANEL_ID)?.remove(); }
    });
}
