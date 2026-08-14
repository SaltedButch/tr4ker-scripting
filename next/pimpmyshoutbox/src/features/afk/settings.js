/**
 * Construit les réglages du suivi AFK.
 *
 * @module src/features/afk/settings
 */
function makeLabel(text) {
    const label = document.createElement('label');
    label.style.cssText = 'display:flex;align-items:center;gap:8px;margin:10px 0;color:#d4d4d8;cursor:pointer;';
    const input = document.createElement('input');
    input.type = 'checkbox';
    label.append(input, document.createTextNode(text));
    return { label, input };
}

/**
 * Rend l'interface de configuration du suivi AFK.
 *
 * @param {HTMLElement} container
 * @param {object|null} runtime
 * @returns {void}
 */
export function renderAfkSettings(container, runtime) {
    if (!runtime) {
        container.textContent = 'Active la feature pour configurer le suivi AFK.';
        return;
    }

    const state = runtime.getState();
    const username = runtime.getUsername();
    const title = document.createElement('div');
    title.textContent = 'Suivi des mentions pendant l’absence';
    title.style.cssText = 'font-size:13px;font-weight:700;color:#e4e4e7;margin-bottom:8px;';
    container.append(title);

    const toggle = makeLabel('Activer le suivi AFK');
    toggle.input.checked = state.enabled;
    toggle.input.addEventListener('change', async () => {
        toggle.input.disabled = true;
        await runtime.setEnabled(toggle.input.checked);
        toggle.input.disabled = false;
        renderAfkSettings(container, runtime);
    });
    container.append(toggle.label);

    const status = document.createElement('div');
    status.textContent = state.enabled
        ? `Suivi actif${state.primaryConversationName ? ` · ${state.primaryConversationName}` : ''}`
        : 'Suivi inactif';
    status.style.cssText = `font-size:11px;line-height:1.45;color:${state.enabled ? '#86efac' : '#a1a1aa'};`;
    container.append(status);

    const explanation = document.createElement('div');
    explanation.textContent = username
        ? 'Les nouvelles mentions et réponses sont enregistrées sans rescanner le DOM. La réponse automatique se configure dans le panneau ouvert lors de l’activation.'
        : 'Configure d’abord ton pseudo dans la section Mentions pour recevoir les événements.';
    explanation.style.cssText = 'margin-top:8px;font-size:11px;line-height:1.45;color:#a1a1aa;';
    container.append(explanation);

    if (!state.enabled && runtime.getUnreadCount() > 0) {
        const historyInfo = document.createElement('div');
        historyInfo.textContent = 'Le mode est désactivé, mais l’historique reste consultable pour relire et répondre aux mentions reçues.';
        historyInfo.style.cssText = 'margin-top:8px;font-size:11px;line-height:1.45;color:#93c5fd;';
        container.append(historyInfo);
    }

    const openButton = document.createElement('button');
    openButton.type = 'button';
    openButton.textContent = `Ouvrir l’historique (${runtime.getUnreadCount()})`;
    openButton.style.cssText = 'margin-top:10px;border:0;border-radius:8px;background:#1d4ed8;color:#fff;padding:8px 10px;cursor:pointer;font-size:11px;font-weight:700;';
    openButton.addEventListener('click', () => runtime.openPanel());
    container.append(openButton);

    const channelsTitle = document.createElement('div');
    channelsTitle.textContent = 'Canaux supplémentaires à surveiller';
    channelsTitle.style.cssText = 'margin-top:15px;font-size:12px;font-weight:700;color:#e4e4e7;';
    container.append(channelsTitle);

    const channelInfo = document.createElement('div');
    channelInfo.textContent = 'Le canal ouvert au moment de l’activation est toujours suivi. Sélectionne ici les autres canaux à conserver pendant ton absence.';
    channelInfo.style.cssText = 'margin-top:6px;font-size:11px;line-height:1.45;color:#a1a1aa;';
    container.append(channelInfo);

    const channelActions = document.createElement('div');
    channelActions.style.cssText = 'display:flex;justify-content:flex-end;margin-top:7px;';
    const selectAll = document.createElement('button');
    selectAll.type = 'button';
    selectAll.textContent = 'Tout sélectionner';
    selectAll.style.cssText = 'border:0;border-radius:7px;background:#27272a;color:#e4e4e7;padding:6px 8px;cursor:pointer;font-size:11px;font-weight:700;';
    selectAll.addEventListener('click', async () => {
        await runtime.getChannels();
        runtime.selectAllChannels();
        renderAfkSettings(container, runtime);
    });
    channelActions.append(selectAll);
    container.append(channelActions);

    const channelList = document.createElement('div');
    channelList.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:6px;margin-top:7px;';
    channelList.textContent = 'Chargement des canaux…';
    container.append(channelList);

    void runtime.getChannels().then((channels) => {
        channelList.replaceChildren();
        if (channels.length === 0) {
            channelList.textContent = 'Aucun canal disponible pour le moment.';
            return;
        }
        for (const channel of channels) {
            const label = document.createElement('label');
            label.style.cssText = 'display:flex;align-items:center;gap:7px;padding:7px 8px;border:1px solid rgba(255,255,255,.07);border-radius:8px;background:rgba(255,255,255,.025);cursor:pointer;font-size:11px;color:#d4d4d8;';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = runtime.isChannelSelected(channel.id);
            input.style.accentColor = '#60a5fa';
            input.addEventListener('change', () => runtime.setChannelSelected(channel.id, input.checked));
            label.append(input, document.createTextNode(`#${channel.name}`));
            channelList.append(label);
        }
    });
}
