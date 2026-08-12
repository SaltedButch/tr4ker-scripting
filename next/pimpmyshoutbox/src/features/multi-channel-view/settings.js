export function renderMultiChannelViewSettings(container, { context }) {
    const runtime = context?.multiChannelView;
    if (!runtime) { container.textContent = 'Active la feature pour ajouter des canaux à la mosaïque.'; return; }
    const description = document.createElement('div');
    description.style.cssText = 'font-size:12px;line-height:1.5;color:#a1a1aa;';
    description.textContent = 'Fonctionnalité alpha : un bouton + apparaît sur les canaux rejoints. Il ouvre une mosaïque de deux à quatre canaux, avec une disposition adaptée automatiquement. Certaines interactions du chat ne sont pas encore disponibles.';
    const count = document.createElement('div'); count.style.cssText = 'margin:10px 0;color:#c4b5fd;font-size:12px;';
    const refresh = () => { const opened = runtime.count(); count.textContent = opened ? `${opened} canal${opened > 1 ? 'aux' : ''} ouvert${opened > 1 ? 's' : ''} dans la mosaïque.` : 'Aucun canal ouvert dans la mosaïque.'; };
    const close = document.createElement('button'); close.type = 'button'; close.textContent = 'Fermer la mosaïque'; close.style.cssText = 'border:0;border-radius:8px;background:#3f3f46;color:#fff;padding:8px 10px;cursor:pointer;font-size:12px;font-weight:700;';
    close.addEventListener('click', () => { runtime.closeAll(); refresh(); });
    container.append(description, count, close); refresh();
}
