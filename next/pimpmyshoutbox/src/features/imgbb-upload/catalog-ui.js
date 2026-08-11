import { insertImageMarkup } from '../../core/media-menu.js';

function button(label, color = '#3f3f46') {
    const element = document.createElement('button'); element.type = 'button'; element.textContent = label;
    element.style.cssText = `border:0;border-radius:7px;background:${color};color:#fff;padding:6px 8px;cursor:pointer;font-size:11px;font-weight:650;`;
    return element;
}

async function copyText(value) {
    try { await navigator.clipboard.writeText(value); return true; } catch {
        try { const input = document.createElement('textarea'); input.value = value; input.style.cssText = 'position:fixed;left:-9999px;top:0;'; document.body.append(input); input.select(); const copied = document.execCommand('copy'); input.remove(); return copied; } catch { return false; }
    }
}

function metadata(record) {
    const parts = [record.source === 'imgbb' ? 'ImgBB' : 'Lien direct'];
    if (record.width && record.height) parts.push(`${record.width}×${record.height}`);
    if (record.size) parts.push(`${(record.size / 1024 / 1024).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`);
    parts.push(record.expiresAt ? `expire le ${new Date(record.expiresAt).toLocaleDateString('fr-FR')}` : 'permanent');
    return parts.join(' · ');
}

export function renderImageCatalog(container, runtime, { limit = Infinity, compact = false, onChange = () => {} } = {}) {
    const render = () => {
        container.replaceChildren();
        const records = runtime.catalog.list().slice(0, limit);
        if (!records.length) { const empty = document.createElement('div'); empty.textContent = 'Aucune image enregistrée pour le moment.'; empty.style.cssText = 'padding:5px 0;font-size:12px;color:#a1a1aa;'; container.append(empty); return; }
        for (const record of records) {
            const item = document.createElement('div'); item.style.cssText = `display:grid;grid-template-columns:${compact ? '52px minmax(0,1fr)' : '64px minmax(0,1fr)'};gap:9px;align-items:start;padding:8px;border-radius:10px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.06);`;
            const image = document.createElement('img'); image.src = record.thumbUrl || record.url; image.alt = record.title; image.loading = 'lazy'; image.referrerPolicy = 'no-referrer'; image.style.cssText = `width:${compact ? 52 : 64}px;height:${compact ? 52 : 64}px;object-fit:cover;border-radius:8px;background:#09090b;`; image.addEventListener('error', () => { runtime.catalog.remove(record.id); render(); onChange('Image invalide retirée du catalogue.'); }, { once: true });
            const body = document.createElement('div'); body.style.minWidth = '0';
            const title = document.createElement('div'); title.textContent = record.title; title.title = record.title || record.url; title.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:700;color:#f4f4f5;';
            const meta = document.createElement('div'); meta.textContent = metadata(record); meta.style.cssText = 'margin-top:3px;font-size:10px;color:#a1a1aa;line-height:1.35;';
            const actions = document.createElement('div'); actions.style.cssText = 'display:flex;gap:5px;flex-wrap:wrap;margin-top:7px;';
            const insert = button('Insérer', '#0f766e'); insert.addEventListener('click', () => { const result = insertImageMarkup(runtime.context.input.get(), record.url, runtime.context.input, 'Image insérée.'); onChange(result.message, !result.ok); });
            const copy = button('Copier', '#2563eb'); copy.addEventListener('click', async () => { const copied = await copyText(record.url); onChange(copied ? 'Lien image copié.' : 'Copie impossible.', !copied); });
            const remove = button(record.deleteUrl ? 'Supprimer' : 'Retirer'); remove.style.color = '#fca5a5'; remove.addEventListener('click', async () => { if (record.deleteUrl && !window.confirm(`Supprimer « ${record.title} » sur ImgBB ?`)) return; remove.disabled = true; const result = await runtime.catalog.deleteRecord(record); onChange(result.message, !result.ok); render(); });
            actions.append(insert, copy, remove); body.append(title, meta, actions); item.append(image, body); container.append(item);
        }
    };
    render();
    return render;
}
