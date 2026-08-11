function makeLabel(text) {
    const label = document.createElement('label');
    label.style.cssText = 'display:flex;align-items:center;gap:8px;margin:10px 0;color:#d4d4d8;cursor:pointer;';
    const input = document.createElement('input');
    input.type = 'checkbox';
    label.append(input, document.createTextNode(text));
    return { label, input };
}

function makeInput(type, value, { min, max, step, placeholder, width } = {}) {
    const input = document.createElement('input');
    input.type = type;
    input.value = String(value);
    if (min !== undefined) input.min = String(min);
    if (max !== undefined) input.max = String(max);
    if (step !== undefined) input.step = String(step);
    if (placeholder) input.placeholder = placeholder;
    input.style.cssText = `min-width:0;${width ? `width:${width};` : 'flex:1;'}border:1px solid rgba(255,255,255,.16);border-radius:7px;background:#18181b;color:#fff;padding:7px 8px;`;
    return input;
}

function makeRow(labelText, control) {
    const label = document.createElement('label');
    label.style.cssText = 'display:flex;align-items:center;gap:8px;margin:10px 0;color:#d4d4d8;';
    const text = document.createElement('span');
    text.textContent = labelText;
    text.style.cssText = 'min-width:86px;font-size:12px;';
    label.append(text, control);
    return label;
}

function toRgba(hexColor, alpha) {
    const hex = /^#[0-9a-f]{6}$/i.test(String(hexColor || '')) ? String(hexColor).slice(1) : '22c55e';
    const red = Number.parseInt(hex.slice(0, 2), 16);
    const green = Number.parseInt(hex.slice(2, 4), 16);
    const blue = Number.parseInt(hex.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${Math.max(0, Math.min(1, alpha))})`;
}

export function renderMentionSettings(container, runtime) {
    if (!runtime) {
        container.textContent = 'Active la feature pour régler les mentions.';
        return;
    }
    const settings = runtime.getSettings();
    const save = (patch) => runtime.update(patch);

    const username = makeInput('text', settings.username, { placeholder: 'Mon pseudo' });
    username.addEventListener('change', () => save({ username: username.value }));
    container.append(makeRow('Pseudo surveillé', username));

    const visualRow = document.createElement('div');
    visualRow.style.cssText = 'display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin:10px 0;';
    const color = makeInput('color', settings.color, { width: '48px' });
    color.style.padding = '3px';
    color.style.height = '37px';
    color.addEventListener('change', () => save({ color: color.value }));
    const opacity = makeInput('number', settings.opacityPercent, { min: 0, max: 100, step: 1, width: '74px' });
    opacity.addEventListener('change', () => save({ opacityPercent: opacity.value }));
    const blink = makeInput('number', settings.blinkSeconds, { min: 0, max: 30, step: .5, width: '74px' });
    blink.addEventListener('change', () => save({ blinkSeconds: blink.value }));
    visualRow.append(color, document.createTextNode('Couleur'), opacity, document.createTextNode('% d\'opacité'), blink, document.createTextNode('s de clignotement'));
    container.append(visualRow);

    const preview = document.createElement('div');
    preview.style.cssText = 'margin:11px 0;padding:10px 12px;border-radius:10px;transition:background .12s,border-color .12s,box-shadow .12s;';
    const previewHeader = document.createElement('div');
    previewHeader.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:4px;font-size:11px;color:#d4d4d8;';
    const previewUsername = document.createElement('strong');
    previewUsername.style.color = '#fff';
    const previewMeta = document.createElement('span');
    previewHeader.append(previewUsername, previewMeta);
    const previewText = document.createElement('div');
    previewText.textContent = 'Exemple de message contenant une mention.';
    previewText.style.cssText = 'font-size:12px;line-height:1.45;color:#f4f4f5;';
    preview.append(previewHeader, previewText);
    const updatePreview = () => {
        const previewColor = /^#[0-9a-f]{6}$/i.test(color.value) ? color.value : settings.color;
        const previewOpacity = Math.min(100, Math.max(0, Number(opacity.value) || 0)) / 100;
        const previewName = username.value.trim() || 'moi';
        const previewBlink = Math.min(30, Math.max(0, Number(blink.value) || 0));
        const accent = toRgba(previewColor, Math.min(1, previewOpacity * 4.55));
        preview.style.background = toRgba(previewColor, previewOpacity);
        preview.style.border = `1px solid ${accent}`;
        preview.style.boxShadow = `inset 3px 0 0 ${accent}`;
        previewUsername.textContent = 'Pseudo';
        previewMeta.textContent = `Mention @${previewName}${previewBlink > 0 ? ` · clignotement ${previewBlink}s` : ''}`;
    };
    username.addEventListener('input', updatePreview);
    color.addEventListener('input', updatePreview);
    opacity.addEventListener('input', updatePreview);
    blink.addEventListener('input', updatePreview);
    updatePreview();
    container.append(preview);

    const keep = makeLabel('Garder la couleur après le clignotement');
    keep.input.checked = settings.keepHighlightAfterBlink;
    keep.input.addEventListener('change', () => save({ keepHighlightAfterBlink: keep.input.checked }));
    container.append(keep.label);
    const reply = makeLabel('Considérer aussi les réponses citées vers @moi');
    reply.input.checked = settings.includeReplyContext;
    reply.input.addEventListener('change', () => save({ includeReplyContext: reply.input.checked }));
    container.append(reply.label);

    const separator = document.createElement('div');
    separator.style.cssText = 'border-top:1px solid rgba(255,255,255,.10);margin:14px 0 10px;';
    container.append(separator);
    const crossTitle = document.createElement('div');
    crossTitle.textContent = 'Mentions dans les autres canaux';
    crossTitle.style.cssText = 'font-weight:700;font-size:12px;color:#e4e4e7;';
    container.append(crossTitle);
    const cross = makeLabel('Surveiller aussi les canaux non ouverts');
    cross.input.checked = runtime.getCrossChannelEnabled();
    container.append(cross.label);
    const channelTools = document.createElement('div');
    channelTools.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;margin:7px 0;';
    const channelInfo = document.createElement('span');
    channelInfo.style.cssText = 'font-size:11px;color:#a1a1aa;line-height:1.4;';
    channelInfo.textContent = 'Choisis les canaux dont les mentions doivent être suivies.';
    const selectAll = document.createElement('button');
    selectAll.type = 'button'; selectAll.textContent = 'Tout sélectionner';
    selectAll.style.cssText = 'border:0;border-radius:7px;background:#27272a;color:#e4e4e7;padding:6px 8px;cursor:pointer;font-size:11px;font-weight:700;';
    channelTools.append(channelInfo, selectAll);
    const channelList = document.createElement('div');
    channelList.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:6px;margin-top:7px;';
    const renderChannels = async () => {
        channelList.replaceChildren();
        if (!runtime.getCrossChannelEnabled()) {
            channelTools.style.display = 'none';
            channelList.style.display = 'none';
            return;
        }
        channelTools.style.display = 'flex';
        channelList.style.display = 'grid';
        channelList.textContent = 'Chargement des canaux…';
        channelList.style.fontSize = '11px';
        channelList.style.color = '#a1a1aa';
        const channels = await runtime.getChannels();
        if (!runtime.getCrossChannelEnabled()) return;
        channelList.replaceChildren();
        channelList.style.color = '';
        if (channels.length === 0) {
            channelList.textContent = 'Aucun canal disponible pour le moment.';
            return;
        }
        for (const channel of channels) {
            const label = document.createElement('label');
            label.style.cssText = 'display:flex;align-items:center;gap:7px;padding:7px 8px;border:1px solid rgba(255,255,255,.07);border-radius:8px;background:rgba(255,255,255,.025);cursor:pointer;font-size:11px;color:#d4d4d8;';
            const input = document.createElement('input');
            input.type = 'checkbox'; input.checked = runtime.isChannelSelected(channel.id); input.style.accentColor = '#22c55e';
            input.addEventListener('change', () => runtime.setChannelSelected(channel.id, input.checked));
            const name = document.createElement('span'); name.textContent = `#${channel.name}`;
            label.append(input, name);
            channelList.append(label);
        }
    };
    cross.input.addEventListener('change', () => {
        runtime.setCrossChannelEnabled(cross.input.checked);
        renderChannels();
    });
    selectAll.addEventListener('click', () => {
        runtime.selectAllChannels();
        renderChannels();
        runtime.toast('Tous les canaux sont maintenant surveillés.');
    });
    container.append(channelTools, channelList);
    void renderChannels();

    const inboxToggle = makeLabel('Afficher la boîte de réception des mentions');
    inboxToggle.input.checked = runtime.isInboxEnabled();
    inboxToggle.input.addEventListener('change', () => runtime.setInboxEnabled(inboxToggle.input.checked));
    container.append(inboxToggle.label);
    const inboxButton = document.createElement('button');
    inboxButton.type = 'button';
    inboxButton.textContent = `Mentions à relire (${runtime.getInboxUnreadCount()})`;
    inboxButton.style.cssText = 'border:0;border-radius:7px;background:#1d4ed8;color:#fff;padding:7px 10px;cursor:pointer;font-weight:700;font-size:12px;';
    inboxButton.addEventListener('click', () => runtime.openInbox());
    container.append(inboxButton);

    const soundSeparator = document.createElement('div');
    soundSeparator.style.cssText = 'border-top:1px solid rgba(255,255,255,.10);margin:14px 0 10px;';
    container.append(soundSeparator);
    const soundTitle = document.createElement('div');
    soundTitle.textContent = 'Son de notification';
    soundTitle.style.cssText = 'font-weight:700;font-size:12px;color:#e4e4e7;';
    container.append(soundTitle);

    const sound = makeLabel('Jouer un son lors d’une nouvelle mention');
    sound.input.checked = settings.soundScope === 'chat';
    sound.input.addEventListener('change', () => save({ soundScope: sound.input.checked ? 'chat' : 'off' }));
    container.append(sound.label);

    const soundOptions = document.createElement('div');
    soundOptions.style.cssText = 'display:grid;gap:8px;padding-left:3px;';
    const style = document.createElement('select');
    style.style.cssText = 'border:1px solid rgba(255,255,255,.16);border-radius:7px;background:#18181b;color:#fff;padding:7px 8px;';
    for (const [value, label] of [['ping', 'Ping'], ['soft', 'Doux'], ['bell', 'Cloche'], ['double', 'Double'], ['chime', 'Carillon'], ['pop', 'Pop'], ['custom', 'Personnalisé (Pixabay)']]) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        option.selected = settings.soundStyle === value;
        style.append(option);
    }
    style.addEventListener('change', () => save({ soundStyle: style.value }));
    soundOptions.append(makeRow('Son', style));
    const cooldown = makeInput('number', settings.soundCooldownSeconds, { min: 0, max: 300, step: .5, width: '82px' });
    cooldown.addEventListener('change', () => save({ soundCooldownSeconds: cooldown.value }));
    soundOptions.append(makeRow('Délai mini (s)', cooldown));
    const volume = document.createElement('input');
    volume.type = 'range';
    volume.min = '0';
    volume.max = '100';
    volume.step = '1';
    volume.value = String(settings.soundVolumePercent);
    volume.style.cssText = 'flex:1;accent-color:#22c55e;cursor:pointer;';
    const volumeValue = document.createElement('strong');
    volumeValue.textContent = `${settings.soundVolumePercent}%`;
    volumeValue.style.cssText = 'min-width:38px;text-align:right;font-size:12px;color:#e4e4e7;';
    const volumeControl = document.createElement('div');
    volumeControl.style.cssText = 'display:flex;align-items:center;gap:8px;flex:1;';
    volumeControl.append(volume, volumeValue);
    volume.addEventListener('input', () => {
        volumeValue.textContent = `${volume.value}%`;
    });
    volume.addEventListener('change', () => save({ soundVolumePercent: volume.value }));
    soundOptions.append(makeRow('Volume', volumeControl));
    const customUrl = makeInput('url', settings.soundCustomUrl, { placeholder: 'https://cdn.pixabay.com/audio/…' });
    customUrl.addEventListener('change', () => save({ soundCustomUrl: customUrl.value }));
    const customRow = makeRow('URL Pixabay', customUrl);
    soundOptions.append(customRow);
    const test = document.createElement('button');
    test.type = 'button';
    test.textContent = 'Tester le son';
    test.style.cssText = 'justify-self:start;border:0;border-radius:7px;background:#2563eb;color:#fff;padding:7px 10px;cursor:pointer;font-weight:700;';
    test.addEventListener('click', async () => {
        const played = await runtime.playTest();
        runtime.toast(played ? 'Son de test joué.' : 'Impossible de jouer le son. Réessaie après avoir interagi avec la page.', !played);
    });
    soundOptions.append(test);
    const explanation = document.createElement('div');
    explanation.style.cssText = 'font-size:11px;line-height:1.45;color:#a1a1aa;';
    explanation.textContent = 'Les mentions des canaux sélectionnés peuvent déclencher une alerte sonore et être ajoutées à la boîte de réception.';
    soundOptions.append(explanation);
    container.append(soundOptions);
}
