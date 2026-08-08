function createButton(label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.style.cssText = 'border:1px solid rgba(255,255,255,.14);border-radius:7px;background:#3f3f46;color:#fff;padding:6px 9px;cursor:pointer;';
    return button;
}

export function renderBlacklistSettings(container, runtime, { refresh }) {
    if (!runtime) {
        container.textContent = 'Active la feature pour gérer les utilisateurs masqués.';
        return;
    }

    const panelToggle = document.createElement('label');
    panelToggle.style.cssText = 'display:flex;align-items:center;gap:8px;margin:13px 0;cursor:pointer;';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = runtime.isStatsVisible();
    checkbox.addEventListener('change', () => runtime.setStatsVisible(checkbox.checked));
    panelToggle.append(checkbox, document.createTextNode('Afficher la boîte de statistiques'));
    container.append(panelToggle);

    const displayModeRow = document.createElement('label');
    displayModeRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin:10px 0;';
    displayModeRow.append(document.createTextNode('Affichage :'));
    const displayMode = document.createElement('select');
    displayMode.style.cssText = 'border:1px solid rgba(255,255,255,.16);border-radius:7px;background:#18181b;color:#fff;padding:6px 8px;';
    for (const [value, label] of [
        ['expanded', 'Développé'],
        ['compact', 'Réduit'],
        ['mini', 'Pastille']
    ]) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        option.selected = runtime.getDisplayMode() === value;
        displayMode.append(option);
    }
    displayMode.addEventListener('change', () => runtime.setDisplayMode(displayMode.value));
    displayModeRow.append(displayMode);
    container.append(displayModeRow);

    const form = document.createElement('form');
    form.style.cssText = 'display:flex;gap:7px;margin:10px 0;';
    const input = document.createElement('input');
    input.id = 'tm-t4-next-blacklist-user-input';
    input.type = 'text';
    input.placeholder = 'Pseudo à masquer';
    input.style.cssText = 'min-width:0;flex:1;border:1px solid rgba(255,255,255,.16);border-radius:7px;background:#18181b;color:#fff;padding:7px 8px;';
    input.setAttribute('aria-label', 'Pseudo à ajouter ou retirer de la blacklist');
    const addButton = createButton('Ajouter / retirer');
    addButton.type = 'button';
    form.append(input, addButton);
    const toggleUser = (event) => {
        event.preventDefault();
        const username = input.value;
        const result = runtime.toggle(username);
        runtime.toast(result.message, !result.ok);
        refresh();
        window.requestAnimationFrame(() => {
            const refreshedInput = document.getElementById('tm-t4-next-blacklist-user-input');
            if (!(refreshedInput instanceof HTMLInputElement)) return;
            refreshedInput.value = username;
            refreshedInput.focus();
            refreshedInput.select();
        });
    };
    form.addEventListener('submit', toggleUser);
    addButton.addEventListener('click', toggleUser);
    container.append(form);

    const users = runtime.list();
    if (users.length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = 'color:#a1a1aa;font-size:12px;';
        empty.textContent = 'Aucun utilisateur masqué. Utilise aussi Alt/⌘ + clic sur un pseudo dans le chat.';
        container.append(empty);
        return;
    }

    const list = document.createElement('div');
    list.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;';
    for (const username of users) {
        const userButton = createButton(username);
        userButton.title = `Charger ${username} dans le champ`;
        userButton.style.cssText = 'border:1px solid rgba(59,130,246,.25);border-radius:999px;background:rgba(59,130,246,.10);color:#93c5fd;padding:5px 9px;cursor:pointer;font-size:12px;';
        userButton.addEventListener('click', () => {
            input.value = username;
            input.focus();
            input.select();
            runtime.toast(`Pseudo chargé : ${username}`);
        });
        list.append(userButton);
    }
    container.append(list);
}
