/**
 * Construit le panneau de réglages de la feature « Channel Unread Badges ».
 *
 * @module src/features/channel-unread-badges/settings
 */
function button(label) {
    const element = document.createElement('button'); element.type = 'button'; element.textContent = label;
    element.style.cssText = 'border:0;border-radius:7px;background:#27272a;color:#e4e4e7;padding:6px 8px;cursor:pointer;font-size:11px;font-weight:700;';
    return element;
}

/**
 * Rend l'interface produite par « renderChannelUnreadBadgesSettings ».
 *
 * @function renderChannelUnreadBadgesSettings
 */
export function renderChannelUnreadBadgesSettings(container, { context }) {
    const runtime = context?.channelUnreadBadges;
    if (!runtime) { container.textContent = 'Active la feature pour choisir les canaux concernés.'; return; }
    const description = document.createElement('div'); description.style.cssText = 'font-size:12px;line-height:1.5;color:#a1a1aa;'; description.textContent = 'Masque uniquement les bulles de nouveaux messages des canaux sélectionnés.';
    const tools = document.createElement('div'); tools.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;margin:10px 0 7px;';
    const info = document.createElement('span'); info.style.cssText = 'font-size:11px;color:#a1a1aa;'; info.textContent = 'Canaux concernés';
    const all = button('Tout sélectionner'); tools.append(info, all);
    const list = document.createElement('div'); list.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px;';
    const render = async () => {
        list.replaceChildren(); list.textContent = 'Chargement des canaux…'; list.style.cssText += 'font-size:11px;color:#a1a1aa;';
        const channels = await runtime.getChannels();
        list.replaceChildren(); list.style.color = '';
        if (!channels.length) { list.textContent = 'Aucun canal disponible pour le moment.'; return; }
        for (const channel of channels) {
            const label = document.createElement('label'); label.style.cssText = 'display:flex;align-items:center;gap:7px;padding:7px 8px;border:1px solid rgba(255,255,255,.07);border-radius:8px;background:rgba(255,255,255,.025);cursor:pointer;font-size:11px;color:#d4d4d8;';
            const input = document.createElement('input'); input.type = 'checkbox'; input.checked = runtime.isChannelSelected(channel.id); input.style.accentColor = '#22c55e'; input.addEventListener('change', () => runtime.setChannelSelected(channel.id, input.checked));
            const name = document.createElement('span'); name.textContent = `#${channel.name}`; label.append(input, name); list.append(label);
        }
    };
    all.addEventListener('click', () => { runtime.selectAllChannels(); void render(); runtime.toast('Tous les canaux sont sélectionnés.'); });
    container.append(description, tools, list); void render();
}
