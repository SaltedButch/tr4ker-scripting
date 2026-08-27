/**
 * Construit le panneau de réglages de la feature « Klipy Gifs ».
 *
 * @module src/features/klipy-gifs/settings
 */
export function renderKlipySettings(container) {
    const text = document.createElement('div');
    text.style.cssText = 'font-size:12px;line-height:1.5;color:#a1a1aa;';
    text.textContent = 'Ajoute un bouton GIF dans la barre de saisie pour rechercher et insérer des animations. Un identifiant aléatoire propre à cette installation est envoyé à la gateway uniquement pour appliquer la limitation de requêtes. Le Worker ne conserve ni adresse IP, ni recherche, ni autre donnée personnelle.';
    container.append(text);
}
