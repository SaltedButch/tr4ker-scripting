function button(label, color = '#3f3f46') {
    const element = document.createElement('button');
    element.type = 'button';
    element.textContent = label;
    element.style.cssText = `border:0;border-radius:8px;background:${color};color:#fff;padding:7px 10px;cursor:pointer;font-size:12px;font-weight:700;`;
    return element;
}

function field(type, placeholder = '') {
    const element = document.createElement(type === 'textarea' ? 'textarea' : 'input');
    if (element instanceof HTMLInputElement) element.type = type;
    element.placeholder = placeholder;
    element.style.cssText = 'width:100%;border:1px solid rgba(255,255,255,.14);border-radius:8px;background:#18181b;color:#fff;padding:8px 9px;font:12px/1.45 system-ui,sans-serif;resize:vertical;';
    return element;
}

function keywordsLabel(keywords) {
    return keywords.length ? keywords.join(', ') : 'Aucun mot-clé';
}

export function renderSavedPhrasesSettings(container, { context }) {
    const runtime = context?.savedPhrases;
    if (!runtime) { container.textContent = 'Active la feature pour gérer les réponses rapides.'; return; }

    const description = document.createElement('div');
    description.style.cssText = 'font-size:12px;line-height:1.5;color:#a1a1aa;';
    description.textContent = 'Enregistrez des phrases, associez-leur des mots-clés et retrouvez-les au-dessus du champ de discussion.';
    const replaceRow = document.createElement('label');
    replaceRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin:11px 0;color:#e4e4e7;font-size:12px;cursor:pointer;';
    const replace = document.createElement('input'); replace.type = 'checkbox'; replace.checked = runtime.getReplaceInput(); replace.style.accentColor = '#8b5cf6';
    replace.addEventListener('change', () => runtime.setReplaceInput(replace.checked));
    replaceRow.append(replace, document.createTextNode('Remplacer le texte déjà présent lors de l’insertion'));

    const separator = document.createElement('div'); separator.style.cssText = 'border-top:1px solid rgba(255,255,255,.10);margin:14px 0;';
    const title = document.createElement('strong'); title.textContent = 'Ajouter une réponse rapide'; title.style.fontSize = '12px';
    const text = field('textarea', 'Texte de la réponse'); text.rows = 4; text.maxLength = runtime.maxLength;
    const keywords = field('text', 'Mots-clés : ratio, reseed, merci…');
    const length = document.createElement('div'); length.style.cssText = 'margin-top:4px;text-align:right;font-size:11px;color:#a1a1aa;';
    const syncLength = () => { length.textContent = `${text.value.length}/${runtime.maxLength}`; };
    text.addEventListener('input', syncLength); syncLength();
    const add = button('Enregistrer', '#2563eb');
    const feedback = document.createElement('div'); feedback.style.cssText = 'min-height:18px;margin-top:8px;font-size:11px;color:#a1a1aa;';
    const list = document.createElement('div'); list.style.cssText = 'display:grid;gap:8px;margin-top:14px;';

    const showResult = (result) => { feedback.textContent = result.message; feedback.style.color = result.ok ? '#86efac' : '#fca5a5'; };
    const renderList = () => {
        list.replaceChildren();
        const phrases = runtime.list();
        if (!phrases.length) {
            const empty = document.createElement('div'); empty.textContent = 'Aucune réponse rapide enregistrée.'; empty.style.cssText = 'font-size:12px;color:#a1a1aa;'; list.append(empty); return;
        }
        phrases.forEach((phrase, index) => {
            const row = document.createElement('article'); row.style.cssText = 'padding:9px;border:1px solid rgba(255,255,255,.08);border-radius:9px;background:rgba(255,255,255,.025);';
            const phraseText = document.createElement('div'); phraseText.textContent = phrase.text; phraseText.style.cssText = 'white-space:pre-wrap;font-size:12px;line-height:1.45;color:#f4f4f5;';
            const phraseKeywords = document.createElement('div'); phraseKeywords.textContent = keywordsLabel(phrase.keywords); phraseKeywords.style.cssText = 'margin-top:5px;font-size:11px;color:#c4b5fd;';
            const actions = document.createElement('div'); actions.style.cssText = 'display:flex;justify-content:flex-end;gap:6px;margin-top:8px;';
            const edit = button('Modifier'); const remove = button('Supprimer', '#7f1d1d');
            edit.addEventListener('click', () => {
                row.replaceChildren();
                const editText = field('textarea'); editText.rows = 4; editText.maxLength = runtime.maxLength; editText.value = phrase.text;
                const editKeywords = field('text'); editKeywords.value = phrase.keywords.join(', '); editKeywords.style.marginTop = '7px';
                const save = button('Enregistrer', '#2563eb'); const cancel = button('Annuler');
                const editActions = document.createElement('div'); editActions.style.cssText = 'display:flex;justify-content:flex-end;gap:6px;margin-top:8px;'; editActions.append(cancel, save);
                cancel.addEventListener('click', renderList);
                save.addEventListener('click', () => { const result = runtime.update(index, editText.value, editKeywords.value); showResult(result); renderList(); });
                row.append(editText, editKeywords, editActions); editText.focus();
            });
            remove.addEventListener('click', () => {
                if (!window.confirm('Supprimer cette réponse rapide ?')) return;
                showResult(runtime.remove(index)); renderList();
            });
            actions.append(edit, remove); row.append(phraseText, phraseKeywords, actions); list.append(row);
        });
    };
    add.addEventListener('click', () => {
        const result = runtime.add(text.value, keywords.value); showResult(result);
        if (!result.ok) return;
        text.value = ''; keywords.value = ''; syncLength(); renderList(); text.focus();
    });
    text.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); add.click(); } });

    const tools = document.createElement('div'); tools.style.cssText = 'display:flex;gap:7px;flex-wrap:wrap;margin-top:14px;';
    const exportButton = button('Exporter JSON', '#0f766e'); const importButton = button('Importer JSON', '#7c3aed');
    const importFile = document.createElement('input'); importFile.type = 'file'; importFile.accept = 'application/json,.json'; importFile.style.display = 'none';
    exportButton.addEventListener('click', () => showResult(runtime.download()));
    importButton.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', async () => {
        const file = importFile.files?.[0]; if (!file) return;
        try { showResult(runtime.importPayload(JSON.parse(await file.text()))); renderList(); } catch { showResult({ ok: false, message: 'Import impossible : fichier JSON invalide.' }); }
        importFile.value = '';
    });
    tools.append(exportButton, importButton, importFile);
    container.append(description, replaceRow, separator, title, text, length, keywords, add, feedback, tools, list);
    renderList();
}
