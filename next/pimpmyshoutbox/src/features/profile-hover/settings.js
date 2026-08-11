export function renderProfileHoverSettings(container) {
    const text = document.createElement('div');
    text.style.cssText = 'font-size:12px;line-height:1.5;color:#a1a1aa;';
    text.textContent = 'Survolez un pseudo ou son avatar dans la shoutbox pour afficher les informations publiques de son profil.';
    container.append(text);
}
