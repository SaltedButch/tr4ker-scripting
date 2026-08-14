/**
 * Implémente la feature « Chat Image Zoom » et son cycle de vie.
 *
 * @module src/features/chat-image-zoom/feature
 */
import { defineFeature } from '../../core/feature-registry.js';
import { renderChatImageZoomSettings } from './settings.js';

const PREVIEW_ID = 'tm-t4-chat-image-preview';
const OVERLAY_ID = 'tm-t4-image-viewer-overlay';
const MODAL_ID = 'tm-t4-image-viewer-modal';
const STYLE_ID = 'tm-t4-chat-image-zoom-style';

const CSS = `
#${PREVIEW_ID}{position:fixed;z-index:1000003;display:none;pointer-events:auto;cursor:zoom-in;padding:8px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(24,24,27,.96);box-shadow:0 18px 38px rgba(0,0,0,.42);backdrop-filter:blur(8px)}#${PREVIEW_ID} img{display:block;max-width:min(520px,calc(100vw - 40px));max-height:min(70vh,560px);border-radius:10px;object-fit:contain}#${OVERLAY_ID}{position:fixed;inset:0;z-index:1000004;display:flex;align-items:center;justify-content:center;padding:12px;background:rgba(0,0,0,.7);backdrop-filter:blur(4px)}#${MODAL_ID}{position:relative;z-index:1000005;display:flex;width:min(1400px,calc(100vw - 24px));max-width:calc(100vw - 24px);max-height:calc(100vh - 24px);flex-direction:column;gap:12px;padding:16px;border:1px solid rgba(255,255,255,.08);border-radius:18px;background:rgba(24,24,27,.98);box-shadow:0 24px 60px rgba(0,0,0,.5);color:#fff;font-family:Inter,Arial,sans-serif}#${MODAL_ID} [data-tm-image-zoom-header]{display:flex;align-items:center;justify-content:space-between;gap:12px}#${MODAL_ID} [data-tm-image-zoom-title]{font-size:16px;font-weight:700}#${MODAL_ID} [data-tm-image-zoom-subtitle]{margin-top:4px;color:#a1a1aa;font-size:12px}#${MODAL_ID} [data-tm-image-zoom-actions]{display:flex;align-items:center;gap:8px}#${MODAL_ID} [data-tm-image-zoom-original],#${MODAL_ID} [data-tm-image-zoom-close]{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:10px;color:#fff;cursor:pointer;font-size:12px;font-weight:600;text-decoration:none}#${MODAL_ID} [data-tm-image-zoom-original]{padding:10px 12px;background:#2563eb}#${MODAL_ID} [data-tm-image-zoom-close]{width:36px;height:36px;background:#27272a;font-size:20px;line-height:1}#${MODAL_ID} [data-tm-image-zoom-surface]{display:flex;min-height:min(72vh,720px);max-height:calc(100vh - 130px);align-items:center;justify-content:center;overflow:auto;padding:10px;border:1px solid rgba(255,255,255,.06);border-radius:16px;background:rgba(255,255,255,.03)}#${MODAL_ID} [data-tm-image-zoom-surface] img{display:block;width:auto;height:auto;max-width:100%;max-height:calc(100vh - 180px);border-radius:12px;object-fit:contain;box-shadow:0 18px 40px rgba(0,0,0,.35)}#${MODAL_ID} [data-tm-image-zoom-status]{color:#a1a1aa;font-size:12px;text-align:center}@media(max-width:540px){#${MODAL_ID}{padding:12px;border-radius:14px}#${MODAL_ID} [data-tm-image-zoom-original]{padding:9px}#${MODAL_ID} [data-tm-image-zoom-subtitle]{display:none}}
`;

function clamp(value, minimum, maximum) { return Math.min(maximum, Math.max(minimum, value)); }

function isChatImage(context, target) {
    const image = target instanceof Element ? target.closest('img') : null;
    if (!(image instanceof HTMLImageElement)) return null;
    if (image.closest(`#${PREVIEW_ID},#${OVERLAY_ID},#${MODAL_ID}`)) return null;
    const message = context.platform.findMessageElement(image);
    if (!(message instanceof HTMLElement) || !message.contains(image)) return null;
    const bubble = message.querySelector('[class*="msgBubble"]');
    if (!(bubble instanceof HTMLElement) || !bubble.contains(image)) return null;
    if (!image.currentSrc && !image.src) return null;
    if ((image.naturalWidth && image.naturalWidth <= 32) || (image.naturalHeight && image.naturalHeight <= 32)) return null;
    return image;
}

/**
 * Déclare la feature et son cycle de vie.
 *
 * @function feature
 */
export default defineFeature({
    id: 'chat-image-zoom',
    label: 'Zoom des images',
    defaultEnabled: true,
    pages: ['chat'],
    settings: { area: 'shoutbox', category: 'media', order: 50, render: renderChatImageZoomSettings },
    hints: [{ id: 'usage', title: 'Utilisation', text: 'Survolez une image pour l’aperçu, puis cliquez pour l’ouvrir en grand format.', kind: 'tip', order: 10 }],
    setup(context) {
        let hoveredImage = null;
        let viewerOpen = false;

        function getPreview() {
            let preview = document.getElementById(PREVIEW_ID);
            if (preview instanceof HTMLElement) return preview;
            if (!document.body) return null;
            preview = document.createElement('div');
            preview.id = PREVIEW_ID;
            const image = document.createElement('img');
            image.alt = '';
            preview.append(image);
            context.on(preview, 'click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const source = preview.getAttribute('data-tm-image-zoom-source');
                if (source) openViewer(source);
            });
            document.body.append(preview);
            context.addCleanup(() => preview.remove());
            return preview;
        }

        function hidePreview() {
            hoveredImage = null;
            const preview = document.getElementById(PREVIEW_ID);
            if (!(preview instanceof HTMLElement)) return;
            preview.style.display = 'none';
            preview.style.left = '-9999px';
            preview.style.top = '-9999px';
            preview.removeAttribute('data-tm-image-zoom-source');
            const image = preview.querySelector('img');
            if (image instanceof HTMLImageElement) {
                image.onload = null;
                image.onerror = null;
                image.removeAttribute('src');
            }
        }

        function positionPreview(clientX, clientY) {
            const preview = document.getElementById(PREVIEW_ID);
            if (!(preview instanceof HTMLElement) || preview.style.display === 'none') return;
            const rect = preview.getBoundingClientRect();
            preview.style.left = `${clamp(clientX + 18, 12, Math.max(12, window.innerWidth - rect.width - 12))}px`;
            preview.style.top = `${clamp(clientY + 18, 12, Math.max(12, window.innerHeight - rect.height - 12))}px`;
        }

        function showPreview(image, clientX, clientY) {
            const source = image.currentSrc || image.src;
            if (!source) return;
            const preview = getPreview();
            const previewImage = preview?.querySelector('img');
            if (!(preview instanceof HTMLElement) || !(previewImage instanceof HTMLImageElement)) return;
            hoveredImage = image;
            if (preview.getAttribute('data-tm-image-zoom-source') === source && previewImage.currentSrc) {
                preview.style.display = 'block';
                positionPreview(clientX, clientY);
                return;
            }
            preview.style.display = 'none';
            preview.style.left = '-9999px';
            preview.style.top = '-9999px';
            preview.setAttribute('data-tm-image-zoom-source', source);
            previewImage.onload = () => {
                if (preview.getAttribute('data-tm-image-zoom-source') !== source) return;
                preview.style.display = 'block';
                positionPreview(clientX, clientY);
            };
            previewImage.onerror = () => {
                if (preview.getAttribute('data-tm-image-zoom-source') === source) hidePreview();
            };
            previewImage.src = source;
        }

        function closeViewer() {
            document.getElementById(MODAL_ID)?.remove();
            document.getElementById(OVERLAY_ID)?.remove();
            viewerOpen = false;
        }

        function openViewer(source) {
            if (!source || !document.body) return;
            closeViewer();
            hidePreview();
            viewerOpen = true;
            const overlay = document.createElement('div');
            overlay.id = OVERLAY_ID;
            const modal = document.createElement('div');
            modal.id = MODAL_ID;
            const header = document.createElement('div');
            header.setAttribute('data-tm-image-zoom-header', '1');
            const heading = document.createElement('div');
            const title = document.createElement('div');
            title.setAttribute('data-tm-image-zoom-title', '1');
            title.textContent = 'Aperçu image grand format';
            const subtitle = document.createElement('div');
            subtitle.setAttribute('data-tm-image-zoom-subtitle', '1');
            subtitle.textContent = 'Échap ou clic hors de la fenêtre pour fermer.';
            heading.append(title, subtitle);
            const actions = document.createElement('div');
            actions.setAttribute('data-tm-image-zoom-actions', '1');
            const original = document.createElement('a');
            original.setAttribute('data-tm-image-zoom-original', '1');
            original.textContent = 'Ouvrir l’original';
            original.href = source;
            original.target = '_blank';
            original.rel = 'noreferrer noopener';
            const close = document.createElement('button');
            close.type = 'button';
            close.setAttribute('data-tm-image-zoom-close', '1');
            close.textContent = '×';
            close.title = 'Fermer';
            context.on(close, 'click', closeViewer);
            actions.append(original, close);
            header.append(heading, actions);
            const surface = document.createElement('div');
            surface.setAttribute('data-tm-image-zoom-surface', '1');
            const image = document.createElement('img');
            image.alt = '';
            surface.append(image);
            const status = document.createElement('div');
            status.setAttribute('data-tm-image-zoom-status', '1');
            status.textContent = 'Chargement de l’image…';
            image.onload = () => { original.href = image.currentSrc || image.src || source; status.textContent = `${image.naturalWidth || '?'} x ${image.naturalHeight || '?'} px`; };
            image.onerror = () => { status.textContent = 'Impossible de charger l’image.'; };
            image.src = source;
            modal.append(header, surface, status);
            overlay.append(modal);
            context.on(overlay, 'click', (event) => { if (event.target === overlay) closeViewer(); });
            document.body.append(overlay);
        }

        context.ensureStyle(STYLE_ID, CSS);
        context.on(document, 'mousemove', (event) => {
            if (viewerOpen) { if (hoveredImage) hidePreview(); return; }
            if (event.target instanceof Element && event.target.closest(`#${PREVIEW_ID}`)) return;
            const image = isChatImage(context, event.target);
            if (!image) { if (hoveredImage) hidePreview(); return; }
            if (hoveredImage !== image) showPreview(image, event.clientX, event.clientY);
            else positionPreview(event.clientX, event.clientY);
        }, true);
        context.on(document, 'scroll', () => { if (hoveredImage) hidePreview(); }, true);
        context.on(document, 'click', (event) => {
            if (viewerOpen) return;
            const image = isChatImage(context, event.target);
            if (!image) return;
            const source = image.currentSrc || image.src;
            if (!source) return;
            event.preventDefault();
            event.stopPropagation();
            openViewer(source);
        }, true);
        context.on(document, 'keydown', (event) => { if (viewerOpen && event.key === 'Escape') { event.preventDefault(); closeViewer(); } }, true);
        return () => { closeViewer(); hidePreview(); };
    }
});
