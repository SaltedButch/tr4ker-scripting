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

    const summary = document.createElement('div');
    const count = runtime.list().length;
    summary.textContent = `${count} réponse${count > 1 ? 's' : ''} enregistrée${count > 1 ? 's' : ''}.`;
    summary.style.cssText = 'margin:11px 0;color:#c4b5fd;font-size:12px;';
    const openManager = document.createElement('button');
    openManager.type = 'button'; openManager.textContent = 'Ouvrir le gestionnaire des réponses rapides';
    openManager.style.cssText = 'border:0;border-radius:8px;background:#2563eb;color:#fff;padding:8px 10px;cursor:pointer;font-size:12px;font-weight:700;';
    openManager.addEventListener('click', () => runtime.openManager());
    container.append(description, replaceRow, summary, openManager);
}
