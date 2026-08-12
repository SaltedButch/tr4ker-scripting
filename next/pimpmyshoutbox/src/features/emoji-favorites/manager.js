import { insertionText } from './store.js';
import { reactionLabel } from './reaction-store.js';

const OVERLAY_ID = 'tm-t4-next-emoji-favorites-manager-overlay';
const PAGE_ID = 'tm-t4-next-emoji-favorites-manager';
const STYLE_ID = 'tm-t4-next-emoji-favorites-manager-style';

function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style'); style.id = STYLE_ID;
    style.textContent = `
        #${OVERLAY_ID}{position:fixed;inset:0;z-index:1000120;background:rgba(0,0,0,.62);backdrop-filter:blur(4px)}
        #${PAGE_ID}{position:fixed;inset:clamp(12px,5vh,52px) clamp(12px,7vw,110px);z-index:1000121;display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(255,255,255,.13);border-radius:16px;background:#18181b;color:#f4f4f5;box-shadow:0 28px 90px rgba(0,0,0,.58);font:13px/1.45 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        #${PAGE_ID} *{box-sizing:border-box} #${PAGE_ID} button,#${PAGE_ID} input,#${PAGE_ID} select{font:inherit}
        #${PAGE_ID} .tm-t4-ef-header{display:flex;align-items:center;gap:12px;padding:13px 17px;border-bottom:1px solid rgba(255,255,255,.09)}
        #${PAGE_ID} .tm-t4-ef-title{flex:1;font-size:17px;font-weight:760} #${PAGE_ID} .tm-t4-ef-subtitle{margin-top:2px;color:#a1a1aa;font-size:12px}
        #${PAGE_ID} .tm-t4-ef-close{width:33px;height:33px;border:0;border-radius:8px;background:#27272a;color:#fff;cursor:pointer;font-size:20px;line-height:1}
        #${PAGE_ID} .tm-t4-ef-layout{display:grid;grid-template-columns:minmax(265px,.78fr) minmax(0,1.45fr);min-height:0;flex:1}
        #${PAGE_ID} .tm-t4-ef-sidebar{overflow:auto;padding:16px;border-right:1px solid rgba(255,255,255,.09);background:#151518}
        #${PAGE_ID} .tm-t4-ef-history{display:flex;min-height:0;flex-direction:column;padding:16px}
        #${PAGE_ID} .tm-t4-ef-label{display:block;margin:13px 0 6px;color:#d4d4d8;font-size:12px;font-weight:650}
        #${PAGE_ID} .tm-t4-ef-field{width:100%;border:1px solid rgba(255,255,255,.15);border-radius:9px;background:#101014;color:#fff;padding:8px 9px;outline:none}
        #${PAGE_ID} .tm-t4-ef-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}
        #${PAGE_ID} .tm-t4-ef-button{border:0;border-radius:8px;background:#3f3f46;color:#fff;padding:8px 10px;cursor:pointer;font-weight:700;font-size:12px}
        #${PAGE_ID} .tm-t4-ef-button[data-variant="primary"]{background:#2563eb} #${PAGE_ID} .tm-t4-ef-button[data-variant="danger"]{background:#7f1d1d}
        #${PAGE_ID} .tm-t4-ef-tabs{display:flex;gap:6px;margin-bottom:5px} #${PAGE_ID} .tm-t4-ef-tab{flex:1;border:1px solid rgba(255,255,255,.12);border-radius:8px;background:#27272a;color:#d4d4d8;padding:8px;cursor:pointer;font-weight:700;font-size:12px} #${PAGE_ID} .tm-t4-ef-tab[data-active="1"]{border-color:rgba(96,165,250,.68);background:rgba(30,58,138,.62);color:#dbeafe}
        #${PAGE_ID} .tm-t4-ef-favorites{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}
        #${PAGE_ID} .tm-t4-ef-favorite{display:flex;align-items:center;gap:3px;padding:4px;border:1px solid rgba(251,191,36,.25);border-radius:9px;background:rgba(113,63,18,.16)}
        #${PAGE_ID} .tm-t4-ef-emoji{display:grid;place-items:center;width:30px;height:30px;border-radius:6px;background:rgba(255,255,255,.05);font-size:18px;overflow:hidden}
        #${PAGE_ID} .tm-t4-ef-emoji img{width:24px;height:24px;object-fit:contain}
        #${PAGE_ID} .tm-t4-ef-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:11px}
        #${PAGE_ID} .tm-t4-ef-search{flex:1;min-width:150px}
        #${PAGE_ID} .tm-t4-ef-rows{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px;min-height:0;overflow:auto;padding-right:3px}
        #${PAGE_ID} .tm-t4-ef-row{display:flex;align-items:center;gap:9px;padding:9px;border:1px solid rgba(255,255,255,.09);border-radius:10px;background:rgba(255,255,255,.025)}
        #${PAGE_ID} .tm-t4-ef-row-main{min-width:0;flex:1} #${PAGE_ID} .tm-t4-ef-row-title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:650}
        #${PAGE_ID} .tm-t4-ef-row-meta{margin-top:3px;color:#a1a1aa;font-size:11px} #${PAGE_ID} .tm-t4-ef-count{color:#86efac;font-weight:750}
        #${PAGE_ID} .tm-t4-ef-empty{grid-column:1/-1;padding:28px 10px;color:#a1a1aa;text-align:center}
        @media(max-width:760px){#${PAGE_ID}{inset:8px}#${PAGE_ID} .tm-t4-ef-layout{grid-template-columns:1fr;overflow:auto}#${PAGE_ID} .tm-t4-ef-sidebar{border-right:0;border-bottom:1px solid rgba(255,255,255,.09);overflow:visible}#${PAGE_ID} .tm-t4-ef-history{min-height:360px}}
    `;
    document.head.append(style);
}

function button(label, variant = '') { const element = document.createElement('button'); element.type = 'button'; element.className = 'tm-t4-ef-button'; if (variant) element.dataset.variant = variant; element.textContent = label; return element; }

function emojiPreview(record, kind = 'emoji') {
    const label = kind === 'reaction' ? reactionLabel(record) : insertionText(record);
    const element = document.createElement('div'); element.className = 'tm-t4-ef-emoji'; element.title = label;
    if (record.src) { const image = document.createElement('img'); image.src = record.src; image.alt = label; element.append(image); }
    else element.textContent = label;
    return element;
}

export function createEmojiFavoritesManager({ runtime }) {
    let lastFocused = null;
    function close() {
        document.getElementById(PAGE_ID)?.remove(); document.getElementById(OVERLAY_ID)?.remove();
        if (lastFocused instanceof HTMLElement && document.contains(lastFocused)) lastFocused.focus();
        lastFocused = null;
    }
    function open() {
        if (!document.body || document.getElementById(PAGE_ID)) return;
        ensureStyle(); lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const overlay = document.createElement('div'); overlay.id = OVERLAY_ID; overlay.addEventListener('click', close);
        let kind = 'emoji';
        const adapter = () => kind === 'reaction' ? runtime.reactions : runtime;
        const kindLabel = () => kind === 'reaction' ? 'réactions' : 'emojis';
        const recordLabel = (record) => kind === 'reaction' ? reactionLabel(record) : insertionText(record);
        const page = document.createElement('section'); page.id = PAGE_ID; page.setAttribute('role', 'dialog'); page.setAttribute('aria-modal', 'true'); page.setAttribute('aria-label', 'Gestion des emojis et réactions favoris'); page.addEventListener('keydown', (event) => { if (event.key === 'Escape') { event.preventDefault(); close(); } });
        const header = document.createElement('header'); header.className = 'tm-t4-ef-header';
        const heading = document.createElement('div'); heading.style.flex = '1'; const title = document.createElement('div'); title.className = 'tm-t4-ef-title'; title.textContent = 'Emojis et réactions favoris'; const subtitle = document.createElement('div'); subtitle.className = 'tm-t4-ef-subtitle'; heading.append(title, subtitle);
        const closeButton = document.createElement('button'); closeButton.type = 'button'; closeButton.className = 'tm-t4-ef-close'; closeButton.textContent = '×'; closeButton.title = 'Fermer'; closeButton.addEventListener('click', close); header.append(heading, closeButton);
        const layout = document.createElement('div'); layout.className = 'tm-t4-ef-layout';
        const sidebar = document.createElement('section'); sidebar.className = 'tm-t4-ef-sidebar';
        const tabs = document.createElement('div'); tabs.className = 'tm-t4-ef-tabs'; const emojiTab = document.createElement('button'); emojiTab.type = 'button'; emojiTab.className = 'tm-t4-ef-tab'; emojiTab.textContent = 'Emojis'; const reactionTab = document.createElement('button'); reactionTab.type = 'button'; reactionTab.className = 'tm-t4-ef-tab'; reactionTab.textContent = 'Réactions'; tabs.append(emojiTab, reactionTab);
        const modeLabel = document.createElement('label'); modeLabel.className = 'tm-t4-ef-label'; modeLabel.textContent = 'Mode des favoris';
        const mode = document.createElement('select'); mode.className = 'tm-t4-ef-field'; for (const [value, label] of [['auto', 'Automatique — selon l’usage'], ['manual', 'Manuel — ma sélection']]) { const option = document.createElement('option'); option.value = value; option.textContent = label; option.selected = runtime.getMode() === value; mode.append(option); }
        const limitLabel = document.createElement('label'); limitLabel.className = 'tm-t4-ef-label';
        const limit = document.createElement('input'); limit.type = 'number'; limit.min = '0'; limit.max = '9'; limit.step = '1'; limit.className = 'tm-t4-ef-field';
        const favoriteTitle = document.createElement('div'); favoriteTitle.className = 'tm-t4-ef-label'; favoriteTitle.textContent = 'Favoris manuels';
        const favoriteHelp = document.createElement('div'); favoriteHelp.style.cssText = 'color:#a1a1aa;font-size:11px;line-height:1.45;';
        const addFromPicker = button('Choisir dans le picker emoji', 'primary');
        const favorites = document.createElement('div'); favorites.className = 'tm-t4-ef-favorites';
        const historyReset = button('Réinitialiser l’historique', 'danger');
        const feedback = document.createElement('div'); feedback.style.cssText = 'min-height:19px;margin-top:10px;color:#a1a1aa;font-size:12px;';
        sidebar.append(tabs, modeLabel, mode, limitLabel, limit, favoriteTitle, favoriteHelp, addFromPicker, favorites, historyReset, feedback);
        const history = document.createElement('section'); history.className = 'tm-t4-ef-history';
        const tools = document.createElement('div'); tools.className = 'tm-t4-ef-tools'; const search = document.createElement('input'); search.type = 'search'; search.className = 'tm-t4-ef-field tm-t4-ef-search'; search.placeholder = 'Rechercher dans l’historique'; const count = document.createElement('span'); count.style.cssText = 'color:#a1a1aa;font-size:12px;white-space:nowrap;'; tools.append(search, count);
        const rows = document.createElement('div'); rows.className = 'tm-t4-ef-rows'; history.append(tools, rows); layout.append(sidebar, history); page.append(header, layout); document.body.append(overlay, page);
        const show = (message, error = false) => { feedback.textContent = message; feedback.style.color = error ? '#fca5a5' : '#86efac'; };
        const render = () => {
            const current = adapter(); const manual = current.getManual(); const usage = current.getUsage().sort((left, right) => right.count - left.count || right.lastUsedAt - left.lastUsedAt);
            const singular = kind === 'reaction' ? 'réaction' : 'emoji';
            subtitle.textContent = `${manual.length} favori${manual.length > 1 ? 's' : ''} manuel${manual.length > 1 ? 's' : ''} · ${usage.length} ${singular}${usage.length > 1 ? 's' : ''} dans l’historique`;
            emojiTab.dataset.active = kind === 'emoji' ? '1' : '0'; reactionTab.dataset.active = kind === 'reaction' ? '1' : '0';
            limitLabel.textContent = kind === 'reaction' ? 'Nombre de réactions près de chaque message' : 'Nombre d’emojis dans la barre rapide';
            mode.value = runtime.getMode(); limit.value = String(current.getLimit());
            favoriteHelp.textContent = runtime.getMode() !== 'manual'
                ? `Passez en mode manuel pour choisir vous-même les ${kindLabel()}.`
                : kind === 'emoji'
                    ? 'Ouvrez le picker emoji, puis utilisez Maj+clic ou Alt/⌘+clic. Les favoris sont encadrés en jaune.'
                    : 'Ouvrez le menu Réagir d’un message, puis utilisez Maj+clic ou Alt/⌘+clic. Les favoris sont encadrés en jaune.';
            addFromPicker.style.display = runtime.getMode() === 'manual' && kind === 'emoji' ? '' : 'none'; favorites.replaceChildren();
            if (!manual.length) { const empty = document.createElement('div'); empty.style.cssText = 'width:100%;color:#a1a1aa;font-size:12px;'; empty.textContent = 'Aucun favori manuel.'; favorites.append(empty); }
            manual.forEach((favorite, index) => { const item = document.createElement('div'); item.className = 'tm-t4-ef-favorite'; const left = button('←'); left.disabled = index === 0; const right = button('→'); right.disabled = index === manual.length - 1; const remove = button('×', 'danger'); left.addEventListener('click', () => { current.moveManual(index, -1); render(); }); right.addEventListener('click', () => { current.moveManual(index, 1); render(); }); remove.addEventListener('click', () => { current.removeManual(index); render(); }); item.append(emojiPreview(favorite, kind), left, right, remove); favorites.append(item); });
            const query = search.value.trim().toLocaleLowerCase('fr'); const visible = usage.filter((record) => !query || `${record.title} ${record.alt} ${record.label || ''} ${recordLabel(record)}`.toLocaleLowerCase('fr').includes(query)); count.textContent = `${visible.length} affiché${visible.length > 1 ? 's' : ''}`; rows.replaceChildren();
            if (!visible.length) { const empty = document.createElement('div'); empty.className = 'tm-t4-ef-empty'; empty.textContent = usage.length ? `Aucun${kind === 'reaction' ? 'e' : ''} ${singular} ne correspond à votre recherche.` : `Utilisez des ${kindLabel()} depuis leur picker pour alimenter cet historique.`; rows.append(empty); }
            visible.forEach((record) => { const row = document.createElement('article'); row.className = 'tm-t4-ef-row'; const main = document.createElement('div'); main.className = 'tm-t4-ef-row-main'; const name = document.createElement('div'); name.className = 'tm-t4-ef-row-title'; name.textContent = recordLabel(record); const meta = document.createElement('div'); meta.className = 'tm-t4-ef-row-meta'; const before = document.createTextNode('Utilisé '); const number = document.createElement('span'); number.className = 'tm-t4-ef-count'; number.textContent = String(record.count); meta.append(before, number, document.createTextNode(' fois')); main.append(name, meta); row.append(emojiPreview(record, kind), main); rows.append(row); });
        };
        emojiTab.addEventListener('click', () => { kind = 'emoji'; render(); }); reactionTab.addEventListener('click', () => { kind = 'reaction'; render(); });
        mode.addEventListener('change', () => { runtime.setMode(mode.value); render(); }); limit.addEventListener('change', () => { adapter().setLimit(limit.value); render(); }); search.addEventListener('input', render);
        addFromPicker.addEventListener('click', () => { close(); runtime.openNativePicker(); });
        historyReset.addEventListener('click', () => { if (!window.confirm(`Réinitialiser l’historique et les compteurs des ${kindLabel()} utilisés ?`)) return; adapter().clearUsage(); show('Historique réinitialisé.'); render(); });
        render(); window.requestAnimationFrame(() => search.focus());
    }
    return Object.freeze({ open, close, destroy: close, isOpen: () => document.getElementById(PAGE_ID) instanceof HTMLElement });
}
