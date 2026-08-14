/**
 * Affiche l'historique des mentions reçues pendant l'absence.
 *
 * @module src/features/afk/panel
 */
const BUBBLE_ID = 'tm-t4-next-afk-bubble';
const PANEL_ID = 'tm-t4-next-afk-panel';

function formatDate(value) {
    const timestamp = Date.parse(String(value || '')) || Number(value) || 0;
    return timestamp > 0
        ? new Date(timestamp).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
        : '';
}

function truncate(value, length = 260) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

function makeButton(label, onClick, color = '#3f3f46') {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.style.cssText = `border:0;border-radius:8px;background:${color};color:#fff;padding:7px 9px;cursor:pointer;font-size:11px;font-weight:600;`;
    button.addEventListener('click', onClick);
    return button;
}

/**
 * Crée le panneau de relecture AFK.
 *
 * @param {{ records: object, isCurrentRecord: function, reply: function, toast: function }} options
 * @returns {object}
 */
export function createAfkPanel({ records, isCurrentRecord, reply, toast }) {
    let open = false;
    let filter = 'unread';
    let query = '';

    function close() {
        open = false;
        document.getElementById(PANEL_ID)?.remove();
        renderBubble();
    }

    function getVisibleRecords() {
        const normalizedQuery = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        return records.list().filter((record) => {
            if (filter === 'unread' && record.isRead) return false;
            if (filter === 'read' && !record.isRead) return false;
            if (!normalizedQuery) return true;
            return [record.conversationName, record.sender, record.body, record.replyContextText]
                .join(' ')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .includes(normalizedQuery);
        });
    }

    function renderPanel() {
        const existing = document.getElementById(PANEL_ID);
        if (!open) {
            existing?.remove();
            return;
        }

        const panel = existing instanceof HTMLElement ? existing : document.createElement('aside');
        panel.id = PANEL_ID;
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'Mentions reçues pendant l’absence');
        panel.style.cssText = 'position:fixed;right:18px;top:72px;z-index:1000004;width:min(520px,calc(100vw - 24px));max-height:calc(100vh - 94px);overflow:auto;box-sizing:border-box;padding:14px;border-radius:14px;background:rgba(24,24,27,.98);border:1px solid rgba(96,165,250,.32);box-shadow:0 18px 46px rgba(0,0,0,.48);color:#e4e4e7;font-family:Inter,Arial,sans-serif;';
        panel.replaceChildren();

        const allRecords = records.list();
        const visible = getVisibleRecords();
        const header = document.createElement('div');
        header.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px;';
        const title = document.createElement('div');
        const titleStrong = document.createElement('strong');
        titleStrong.textContent = 'Messages reçus pendant l’absence';
        titleStrong.style.fontSize = '15px';
        const subtitle = document.createElement('div');
        subtitle.textContent = `${records.unreadCount()} non lu${records.unreadCount() > 1 ? 's' : ''} · ${allRecords.length} enregistré${allRecords.length > 1 ? 's' : ''}`;
        subtitle.style.cssText = 'font-size:11px;color:#a1a1aa;margin-top:3px;';
        title.append(titleStrong, subtitle);
        const closeButton = makeButton('×', close);
        closeButton.title = 'Fermer';
        closeButton.style.cssText += 'width:28px;height:28px;padding:0;font-size:18px;';
        header.append(title, closeButton);
        panel.append(header);

        const filters = document.createElement('div');
        filters.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;';
        const select = document.createElement('select');
        select.style.cssText = 'min-width:0;background:#18181b;color:#fff;border:1px solid #3f3f46;border-radius:8px;padding:7px;';
        [['unread', 'Non lus'], ['all', 'Tous'], ['read', 'Lus']].forEach(([value, label]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            option.selected = filter === value;
            select.append(option);
        });
        select.addEventListener('change', () => { filter = select.value; renderPanel(); });
        const search = document.createElement('input');
        search.type = 'search';
        search.value = query;
        search.placeholder = 'Rechercher…';
        search.style.cssText = 'min-width:0;background:#18181b;color:#fff;border:1px solid #3f3f46;border-radius:8px;padding:7px;';
        search.addEventListener('input', () => { query = search.value; renderPanel(); });
        filters.append(select, search);
        panel.append(filters);

        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px;';
        actions.append(
            makeButton('Tout marquer lu', () => { records.markAllRead(); renderPanel(); }, '#2563eb'),
            makeButton('Effacer l’affichage', () => {
                const removed = records.remove(visible.map((record) => record.id));
                renderPanel();
                if (removed > 0) toast(`${removed} message${removed > 1 ? 's' : ''} supprimé${removed > 1 ? 's' : ''}.`);
            }, '#7f1d1d')
        );
        panel.append(actions);

        if (visible.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = 'Aucun message pour ce filtre.';
            empty.style.cssText = 'font-size:12px;color:#a1a1aa;padding:8px 2px;';
            panel.append(empty);
        }

        for (const record of visible) {
            const item = document.createElement('article');
            item.style.cssText = `padding:10px;margin-top:8px;border-radius:10px;background:${record.isRead ? 'rgba(255,255,255,.04)' : 'rgba(37,99,235,.14)'};border:1px solid ${record.isRead ? 'rgba(255,255,255,.08)' : 'rgba(59,130,246,.3)'};`;
            const meta = document.createElement('div');
            meta.style.cssText = 'display:flex;justify-content:space-between;gap:8px;font-size:11px;color:#bfdbfe;';
            const sender = document.createElement('strong');
            sender.textContent = record.sender;
            const place = document.createElement('span');
            place.textContent = `${record.conversationName} · ${formatDate(record.receivedAt || record.capturedAt)}`;
            meta.append(sender, place);
            item.append(meta);

            if (record.reason === 'reply' || record.reason === 'mention+reply') {
                const replyContext = document.createElement('div');
                replyContext.textContent = `↩ En réponse à : ${truncate(record.replyContextText, 180)}`;
                replyContext.style.cssText = 'margin-top:7px;padding:6px 8px;border-left:2px solid rgba(96,165,250,.72);background:rgba(59,130,246,.08);color:#bfdbfe;font-size:11px;line-height:1.4;';
                item.append(replyContext);
            }

            const body = document.createElement('div');
            body.textContent = truncate(record.body, 420);
            body.style.cssText = 'margin-top:7px;font-size:12px;line-height:1.45;white-space:pre-wrap;word-break:break-word;';
            item.append(body);

            const actionsRow = document.createElement('div');
            actionsRow.style.cssText = 'display:flex;justify-content:flex-end;gap:7px;flex-wrap:wrap;margin-top:9px;';
            if (isCurrentRecord(record)) {
                actionsRow.append(makeButton('Répondre', () => reply(record), '#0f766e'));
            }
            const openLink = document.createElement('a');
            openLink.textContent = 'Ouvrir';
            openLink.href = `/communication?${new URLSearchParams({ conv: record.conversationId, msg: record.messageId }).toString()}`;
            openLink.style.cssText = 'padding:6px 8px;border-radius:8px;background:#1e3a8a;color:#bfdbfe;font-size:11px;text-decoration:none;';
            openLink.addEventListener('click', () => records.setRead(record.id, true));
            actionsRow.append(openLink);
            actionsRow.append(makeButton(record.isRead ? 'Non lu' : 'Marquer lu', () => { records.setRead(record.id, !record.isRead); renderPanel(); }));
            item.append(actionsRow);
            panel.append(item);
        }

        if (!existing) document.body?.append(panel);
    }

    function renderBubble() {
        const existing = document.getElementById(BUBBLE_ID);
        if (records.list().length === 0 && !open) {
            existing?.remove();
            return;
        }
        const bubble = existing instanceof HTMLButtonElement ? existing : document.createElement('button');
        if (!existing) {
            bubble.id = BUBBLE_ID;
            bubble.type = 'button';
            bubble.style.cssText = 'position:fixed;top:calc(50% + 54px);right:0;z-index:99980;width:42px;height:42px;border:1px solid rgba(255,255,255,.16);border-right:0;border-radius:14px 0 0 14px;box-shadow:0 8px 24px rgba(0,0,0,.4);color:#f4f5f5;font:17px/1 system-ui,sans-serif;cursor:pointer;';
            bubble.addEventListener('click', () => { open = !open; renderPanel(); renderBubble(); });
            document.body?.append(bubble);
        }
        const unread = records.unreadCount();
        bubble.textContent = `◌${unread > 0 ? ` ${unread > 99 ? '99+' : unread}` : ''}`;
        bubble.title = open ? 'Fermer les messages reçus pendant l’absence' : `Messages reçus pendant l’absence${unread ? ` (${unread})` : ''}`;
        bubble.setAttribute('aria-label', bubble.title);
        bubble.style.background = unread > 0 ? 'rgba(29,78,216,.98)' : 'rgba(24,24,27,.96)';
    }

    return Object.freeze({
        open() { open = true; renderPanel(); renderBubble(); },
        sync() { renderBubble(); renderPanel(); },
        destroy() { document.getElementById(BUBBLE_ID)?.remove(); document.getElementById(PANEL_ID)?.remove(); }
    });
}
