function checkbox(label, checked) {
    const row = document.createElement('label');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:10px;color:#e4e4e7;cursor:pointer;font-size:12px;';
    const input = document.createElement('input'); input.type = 'checkbox'; input.checked = checked; input.style.accentColor = '#38bdf8';
    row.append(input, document.createTextNode(label));
    return { row, input };
}

export function renderChatToolbarLayoutSettings(container, { context }) {
    const runtime = context?.chatToolbarLayout;
    if (!runtime) { container.textContent = 'Active la feature pour régler la barre d’outils.'; return; }
    const description = document.createElement('div');
    description.style.cssText = 'font-size:12px;line-height:1.5;color:#a1a1aa;';
    description.textContent = 'Par défaut, la barre d’outils reste au-dessus du champ de message.';
    const inline = checkbox('Placer les boutons sur la même ligne que l’input', runtime.getInline());
    const alignRight = checkbox('Aligner les boutons à droite', runtime.getAlignedRight());
    const help = document.createElement('div'); help.style.cssText = 'margin-top:8px;font-size:11px;line-height:1.45;color:#a1a1aa;'; help.textContent = 'L’alignement à droite s’applique aussi lorsque la barre est au-dessus du champ.';
    inline.input.addEventListener('change', () => runtime.setInline(inline.input.checked));
    alignRight.input.addEventListener('change', () => runtime.setAlignedRight(alignRight.input.checked));
    container.append(description, inline.row, alignRight.row, help);
}
