/**
 * Construit le panneau de réglages de la feature « Highlight Users ».
 *
 * @module src/features/highlight-users/settings
 */
function rgba(color, alpha) {
    const hex = String(color || '#f59e0b').replace('#', '');
    const values = [0, 2, 4].map((position) => Number.parseInt(hex.slice(position, position + 2), 16));
    return `rgba(${values[0]}, ${values[1]}, ${values[2]}, ${Math.min(1, Math.max(0, alpha))})`;
}

function action(label, background) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
    button.style.cssText = `border:0;border-radius:8px;background:${background};color:#fff;padding:8px 10px;cursor:pointer;font-weight:650;`;
    return button;
}

/**
 * Rend l'interface produite par « renderHighlightSettings ».
 *
 * @function renderHighlightSettings
 */
export function renderHighlightSettings(container, { context, refresh }) {
    const runtime = context?.highlightUsers;
    if (!runtime) { container.textContent = 'Active la feature pour mettre des utilisateurs en avant.'; return; }

    const form = document.createElement('div'); form.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;';
    const username = document.createElement('input'); username.type = 'text'; username.placeholder = 'Pseudo'; username.style.cssText = 'flex:1 1 150px;min-width:0;border:1px solid rgba(255,255,255,.16);border-radius:8px;background:#18181b;color:#fff;padding:8px 10px;';
    const color = document.createElement('input'); color.type = 'color'; color.value = '#f59e0b'; color.title = 'Couleur'; color.setAttribute('aria-label', 'Couleur de mise en avant'); color.style.cssText = 'width:46px;height:38px;padding:3px;border:1px solid rgba(255,255,255,.16);border-radius:8px;background:#18181b;cursor:pointer;';
    const save = action('Ajouter / MAJ', '#d97706');
    const remove = action('Retirer', '#3f3f46');
    form.append(username, color, save, remove);

    const opacityRow = document.createElement('label'); opacityRow.style.cssText = 'display:flex;flex-direction:column;gap:6px;margin-top:12px;';
    const opacityHeader = document.createElement('span'); opacityHeader.style.cssText = 'display:flex;justify-content:space-between;gap:12px;font-size:12px;color:#c4c4c8;';
    const opacityLabel = document.createElement('span'); opacityLabel.textContent = 'Opacité';
    const opacityValue = document.createElement('span'); opacityValue.textContent = '14%'; opacityHeader.append(opacityLabel, opacityValue);
    const opacity = document.createElement('input'); opacity.type = 'range'; opacity.min = '0'; opacity.max = '100'; opacity.step = '1'; opacity.value = '14'; opacity.style.cssText = 'width:100%;accent-color:#f59e0b;cursor:pointer;'; opacityRow.append(opacityHeader, opacity);

    const preview = document.createElement('div'); preview.style.cssText = 'margin-top:11px;padding:10px 12px;border-radius:12px;transition:background .12s,border-color .12s,box-shadow .12s;';
    const previewHeader = document.createElement('div'); previewHeader.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:4px;font-size:11px;color:#d4d4d8;';
    const previewName = document.createElement('strong'); previewName.textContent = 'Pseudo'; previewName.style.color = '#fff';
    const previewMeta = document.createElement('span'); previewHeader.append(previewName, previewMeta);
    const previewText = document.createElement('div'); previewText.style.cssText = 'font-size:12px;color:#f4f4f5;line-height:1.45;'; preview.append(previewHeader, previewText);
    const updatePreview = () => {
        const alpha = Number(opacity.value) / 100;
        const name = context.text.normalizeName(username.value) || 'pseudo';
        const accent = rgba(color.value, Math.min(1, alpha * 5.15));
        preview.style.background = rgba(color.value, alpha); preview.style.border = `1px solid ${accent}`; preview.style.boxShadow = `inset 3px 0 0 ${rgba(color.value, Math.min(1, alpha * 7))}`;
        opacityValue.textContent = `${opacity.value}%`; previewMeta.textContent = `Mise en avant : ${name}`; previewText.textContent = `Exemple de message de ${name} mis en avant.`;
    };
    username.addEventListener('input', updatePreview); color.addEventListener('input', updatePreview); opacity.addEventListener('input', updatePreview); updatePreview();

    const feedback = document.createElement('div'); feedback.style.cssText = 'min-height:18px;margin-top:9px;font-size:12px;color:#a1a1aa;';
    const listTitle = document.createElement('div'); listTitle.textContent = 'Utilisateurs mis en avant'; listTitle.style.cssText = 'margin-top:10px;font-size:12px;color:#a1a1aa;';
    const list = document.createElement('div'); list.style.cssText = 'display:flex;flex-wrap:wrap;gap:7px;margin-top:8px;';
    const renderList = () => {
        list.replaceChildren();
        const users = runtime.list();
        if (!users.length) { list.textContent = 'Aucun utilisateur pour le moment.'; list.style.color = '#a1a1aa'; list.style.fontSize = '12px'; return; }
        list.style.color = ''; list.style.fontSize = '';
        for (const user of users) {
            const chip = document.createElement('button'); chip.type = 'button'; chip.textContent = user.username; chip.title = 'Charger cette mise en avant'; chip.style.cssText = `border:1px solid ${rgba(user.color, .5)};border-radius:999px;background:${rgba(user.color, user.opacityPercent / 100)};color:${user.color};padding:6px 9px;cursor:pointer;font-size:12px;`;
            chip.addEventListener('click', () => { username.value = user.username; color.value = user.color; opacity.value = String(user.opacityPercent); updatePreview(); username.focus(); username.select(); feedback.textContent = `Mise en avant chargée : ${user.username}`; feedback.style.color = '#93c5fd'; }); list.append(chip);
        }
    };
    const submit = () => { const result = runtime.upsert(username.value, color.value, opacity.value); feedback.textContent = result.message; feedback.style.color = result.ok ? '#93c5fd' : '#fca5a5'; if (result.ok) { renderList(); refresh(); } };
    save.addEventListener('click', submit); username.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); submit(); } });
    remove.addEventListener('click', () => { const result = runtime.remove(username.value); feedback.textContent = result.message; feedback.style.color = result.ok ? '#93c5fd' : '#fca5a5'; if (result.ok) { renderList(); refresh(); } });
    container.append(form, opacityRow, preview, feedback, listTitle, list);
    renderList();
}
