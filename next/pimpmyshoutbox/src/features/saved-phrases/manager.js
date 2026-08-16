/**
 * Gère l'interface et le cycle de vie du gestionnaire de « Saved Phrases ».
 *
 * @module src/features/saved-phrases/manager
 */
const OVERLAY_ID = 'tm-t4-next-saved-phrases-manager-overlay';
const PAGE_ID = 'tm-t4-next-saved-phrases-manager';
const STYLE_ID = 'tm-t4-next-saved-phrases-manager-style';

function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
        #${OVERLAY_ID}{position:fixed;inset:0;z-index:1000100;background:rgba(0,0,0,.62);backdrop-filter:blur(4px)}
        #${PAGE_ID}{position:fixed;inset:clamp(12px,5vh,52px) clamp(12px,7vw,110px);z-index:1000101;display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(255,255,255,.13);border-radius:16px;background:#18181b;color:#f4f4f5;box-shadow:0 28px 90px rgba(0,0,0,.58);font:13px/1.45 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        #${PAGE_ID} *{box-sizing:border-box} #${PAGE_ID} button,#${PAGE_ID} input,#${PAGE_ID} textarea{font:inherit}
        #${PAGE_ID} .tm-t4-sp-header{display:flex;align-items:center;gap:12px;padding:13px 17px;border-bottom:1px solid rgba(255,255,255,.09)}
        #${PAGE_ID} .tm-t4-sp-title{flex:1;font-size:17px;font-weight:760} #${PAGE_ID} .tm-t4-sp-summary{margin-top:2px;color:#a1a1aa;font-size:12px}
        #${PAGE_ID} .tm-t4-sp-close{width:33px;height:33px;border:0;border-radius:8px;background:#27272a;color:#fff;cursor:pointer;font-size:20px;line-height:1}
        #${PAGE_ID} .tm-t4-sp-layout{display:grid;grid-template-columns:minmax(270px,.85fr) minmax(0,1.4fr);min-height:0;flex:1}
        #${PAGE_ID} .tm-t4-sp-editor{overflow:auto;padding:16px;border-right:1px solid rgba(255,255,255,.09);background:#151518}
        #${PAGE_ID} .tm-t4-sp-list{display:flex;min-height:0;flex-direction:column;padding:16px}
        #${PAGE_ID} .tm-t4-sp-field{width:100%;border:1px solid rgba(255,255,255,.15);border-radius:9px;background:#101014;color:#fff;padding:9px 10px;outline:none}
        #${PAGE_ID} textarea.tm-t4-sp-field{min-height:156px;resize:vertical;line-height:1.45}
        #${PAGE_ID} .tm-t4-sp-label{display:block;margin:13px 0 6px;color:#d4d4d8;font-size:12px;font-weight:650}
        #${PAGE_ID} .tm-t4-sp-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}
        #${PAGE_ID} .tm-t4-sp-button{border:0;border-radius:8px;background:#3f3f46;color:#fff;padding:8px 10px;cursor:pointer;font-weight:700;font-size:12px}
        #${PAGE_ID} .tm-t4-sp-button[data-variant="primary"]{background:#2563eb} #${PAGE_ID} .tm-t4-sp-button[data-variant="danger"]{background:#7f1d1d}
        #${PAGE_ID} .tm-t4-sp-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:11px}
        #${PAGE_ID} .tm-t4-sp-search{flex:1;min-width:150px}
        #${PAGE_ID} .tm-t4-sp-rows{display:grid;gap:8px;min-height:0;overflow:auto;padding-right:3px}
        #${PAGE_ID} .tm-t4-sp-row{padding:10px;border:1px solid rgba(255,255,255,.09);border-radius:10px;background:rgba(255,255,255,.025)}
        #${PAGE_ID} .tm-t4-sp-row-text{white-space:pre-wrap;line-height:1.45} #${PAGE_ID} .tm-t4-sp-keywords{margin-top:6px;color:#c4b5fd;font-size:11px}
        #${PAGE_ID} .tm-t4-sp-row-actions{display:flex;justify-content:flex-end;gap:6px;margin-top:9px}
        #${PAGE_ID} .tm-t4-sp-feedback{min-height:19px;margin-top:10px;color:#a1a1aa;font-size:12px}
        #${PAGE_ID} .tm-t4-sp-empty{padding:26px 10px;color:#a1a1aa;text-align:center}
        @media(max-width:760px){#${PAGE_ID}{inset:8px}#${PAGE_ID} .tm-t4-sp-layout{grid-template-columns:1fr;overflow:auto}#${PAGE_ID} .tm-t4-sp-editor{border-right:0;border-bottom:1px solid rgba(255,255,255,.09);overflow:visible}#${PAGE_ID} .tm-t4-sp-list{min-height:360px}}
    `;
    document.head.append(style);
}

function button(label, variant = '') {
    const element = document.createElement('button');
    element.type = 'button'; element.className = 'tm-t4-sp-button';
    if (variant) element.dataset.variant = variant;
    element.textContent = label;
    return element;
}

/**
 * Crée l'API publique « createSavedPhrasesManager ».
 *
 * @function createSavedPhrasesManager
 */
export function createSavedPhrasesManager({ store, getReplaceInput, setReplaceInput, download, onChange, toast }) {
    let selectedIndex = null;
    let lastFocused = null;

    function close() {
        document.getElementById(PAGE_ID)?.remove();
        document.getElementById(OVERLAY_ID)?.remove();
        if (lastFocused instanceof HTMLElement && document.contains(lastFocused)) lastFocused.focus();
        lastFocused = null;
    }

    function open() {
        if (!document.body) return;
        if (document.getElementById(PAGE_ID)) return;
        ensureStyle();
        lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const overlay = document.createElement('div'); overlay.id = OVERLAY_ID;
        const page = document.createElement('section'); page.id = PAGE_ID; page.setAttribute('role', 'dialog'); page.setAttribute('aria-modal', 'true'); page.setAttribute('aria-label', 'Gestion des réponses rapides');
        overlay.addEventListener('click', close);
        page.addEventListener('keydown', (event) => { if (event.key === 'Escape') { event.preventDefault(); close(); } });

        const header = document.createElement('header'); header.className = 'tm-t4-sp-header';
        const heading = document.createElement('div'); heading.style.flex = '1';
        const title = document.createElement('div'); title.className = 'tm-t4-sp-title'; title.textContent = 'Réponses rapides';
        const summary = document.createElement('div'); summary.className = 'tm-t4-sp-summary'; heading.append(title, summary);
        const exportButton = button('Exporter JSON'); exportButton.style.background = '#0f766e';
        const importButton = button('Importer JSON'); importButton.style.background = '#7c3aed';
        const importFile = document.createElement('input'); importFile.type = 'file'; importFile.accept = 'application/json,.json'; importFile.hidden = true;
        const closeButton = document.createElement('button'); closeButton.type = 'button'; closeButton.className = 'tm-t4-sp-close'; closeButton.textContent = '×'; closeButton.title = 'Fermer'; closeButton.addEventListener('click', close);
        header.append(heading, exportButton, importButton, importFile, closeButton);

        const layout = document.createElement('div'); layout.className = 'tm-t4-sp-layout';
        const editor = document.createElement('section'); editor.className = 'tm-t4-sp-editor';
        const editorTitle = document.createElement('strong'); editorTitle.textContent = 'Nouvelle réponse';
        const textLabel = document.createElement('label'); textLabel.className = 'tm-t4-sp-label'; textLabel.textContent = 'Texte de la réponse';
        const text = document.createElement('textarea'); text.className = 'tm-t4-sp-field'; text.maxLength = store.maxLength; text.placeholder = 'Exemple : Salut, il me faut le lien exact du torrent pour vérifier.';
        const length = document.createElement('div'); length.style.cssText = 'margin-top:4px;text-align:right;color:#a1a1aa;font-size:11px;';
        const keywordLabel = document.createElement('label'); keywordLabel.className = 'tm-t4-sp-label'; keywordLabel.textContent = 'Mots-clés';
        const keywords = document.createElement('input'); keywords.type = 'text'; keywords.className = 'tm-t4-sp-field'; keywords.placeholder = 'ratio, reseed, merci, lien';
        const explanation = document.createElement('div'); explanation.textContent = 'Optionnel : les mots-clés améliorent les suggestions quand vous répondez à un message.'; explanation.style.cssText = 'margin-top:6px;color:#a1a1aa;font-size:11px;line-height:1.45;';
        const replaceLabel = document.createElement('label'); replaceLabel.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:14px;color:#e4e4e7;font-size:12px;cursor:pointer;';
        const replace = document.createElement('input'); replace.type = 'checkbox'; replace.checked = getReplaceInput(); replace.style.accentColor = '#8b5cf6'; replace.addEventListener('change', () => setReplaceInput(replace.checked)); replaceLabel.append(replace, document.createTextNode('Remplacer le texte déjà présent à l’insertion'));
        const editorActions = document.createElement('div'); editorActions.className = 'tm-t4-sp-actions';
        const reset = button('Nouvelle réponse'); const save = button('Enregistrer', 'primary'); editorActions.append(reset, save);
        const feedback = document.createElement('div'); feedback.className = 'tm-t4-sp-feedback';
        editor.append(editorTitle, textLabel, text, length, keywordLabel, keywords, explanation, replaceLabel, editorActions, feedback);

        const listing = document.createElement('section'); listing.className = 'tm-t4-sp-list';
        const tools = document.createElement('div'); tools.className = 'tm-t4-sp-tools';
        const search = document.createElement('input'); search.type = 'search'; search.className = 'tm-t4-sp-field tm-t4-sp-search'; search.placeholder = 'Rechercher une phrase ou un mot-clé';
        const count = document.createElement('span'); count.style.cssText = 'color:#a1a1aa;font-size:12px;white-space:nowrap;'; tools.append(search, count);
        const rows = document.createElement('div'); rows.className = 'tm-t4-sp-rows'; listing.append(tools, rows);
        layout.append(editor, listing); page.append(header, layout); document.body.append(overlay, page);

        const showResult = (result) => { feedback.textContent = result.message; feedback.style.color = result.ok ? '#86efac' : '#fca5a5'; if (result.ok) toast?.(result.message); };
        const syncEditor = () => {
            length.textContent = `${text.value.length}/${store.maxLength}`;
            editorTitle.textContent = selectedIndex === null ? 'Nouvelle réponse' : 'Modifier la réponse';
            save.textContent = selectedIndex === null ? 'Enregistrer' : 'Enregistrer les modifications';
        };
        const clearEditor = () => { selectedIndex = null; text.value = ''; keywords.value = ''; feedback.textContent = ''; syncEditor(); text.focus(); };
        const select = (index) => {
            const phrase = store.list()[index]; if (!phrase) return;
            selectedIndex = index; text.value = phrase.text; keywords.value = phrase.keywords.join(', '); feedback.textContent = ''; syncEditor(); text.focus(); text.setSelectionRange(text.value.length, text.value.length);
        };
        const renderRows = () => {
            const query = search.value.trim().toLocaleLowerCase('fr'); const phrases = store.list();
            summary.textContent = `${phrases.length} réponse${phrases.length > 1 ? 's' : ''} enregistrée${phrases.length > 1 ? 's' : ''}`;
            const visible = phrases.map((phrase, index) => ({ phrase, index })).filter(({ phrase }) => !query || `${phrase.text} ${phrase.keywords.join(' ')}`.toLocaleLowerCase('fr').includes(query));
            count.textContent = `${visible.length} affichée${visible.length > 1 ? 's' : ''}`;
            rows.replaceChildren();
            if (!visible.length) { const empty = document.createElement('div'); empty.className = 'tm-t4-sp-empty'; empty.textContent = phrases.length ? 'Aucune réponse ne correspond à votre recherche.' : 'Aucune réponse rapide enregistrée.'; rows.append(empty); return; }
            for (const { phrase, index } of visible) {
                const row = document.createElement('article'); row.className = 'tm-t4-sp-row';
                const content = document.createElement('div'); content.className = 'tm-t4-sp-row-text'; content.textContent = phrase.text;
                const keywordText = document.createElement('div'); keywordText.className = 'tm-t4-sp-keywords'; keywordText.textContent = phrase.keywords.length ? phrase.keywords.join(', ') : 'Aucun mot-clé';
                const actions = document.createElement('div'); actions.className = 'tm-t4-sp-row-actions';
                const edit = button('Modifier'); const remove = button('Supprimer', 'danger');
                edit.addEventListener('click', () => select(index));
                remove.addEventListener('click', () => { if (!window.confirm('Supprimer cette réponse rapide ?')) return; const result = store.remove(index); showResult(result); if (result.ok) { onChange(); clearEditor(); renderRows(); } });
                actions.append(edit, remove); row.append(content, keywordText, actions); rows.append(row);
            }
        };
        const submit = () => {
            const result = selectedIndex === null ? store.add(text.value, keywords.value) : store.update(selectedIndex, text.value, keywords.value);
            showResult(result); if (!result.ok) return;
            onChange(); clearEditor(); renderRows();
        };
        text.addEventListener('input', syncEditor); text.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); submit(); } });
        save.addEventListener('click', submit); reset.addEventListener('click', clearEditor); search.addEventListener('input', renderRows);
        exportButton.addEventListener('click', () => showResult(download()));
        importButton.addEventListener('click', () => importFile.click());
        importFile.addEventListener('change', async () => {
            const file = importFile.files?.[0]; if (!file) return;
            try { const result = store.importPayload(JSON.parse(await file.text())); showResult(result); if (result.ok) { onChange(); clearEditor(); renderRows(); } } catch { showResult({ ok: false, message: 'Import impossible : fichier JSON invalide.' }); }
            importFile.value = '';
        });
        syncEditor(); renderRows(); window.requestAnimationFrame(() => text.focus());
    }

    return Object.freeze({ open, close, isOpen: () => document.getElementById(PAGE_ID) instanceof HTMLElement, destroy: close });
}
