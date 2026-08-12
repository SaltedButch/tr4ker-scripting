const MIN_PERCENT = 85;
const MAX_PERCENT = 170;
const DEFAULT_PERCENT = 100;

function button(label, background) {
    const element = document.createElement('button');
    element.type = 'button'; element.textContent = label;
    element.style.cssText = `border:0;border-radius:8px;background:${background};color:#fff;padding:8px 10px;cursor:pointer;font-weight:650;`;
    return element;
}

function percent(scale) {
    return Math.round(Number(scale) * 100);
}

export function renderChatFontSizeSettings(container, { context, refresh }) {
    const runtime = context?.chatFontSize;
    if (!runtime) { container.textContent = 'Active la feature pour modifier la taille de police du chat.'; return; }

    const description = document.createElement('div');
    description.style.cssText = 'font-size:12px;line-height:1.5;color:#a1a1aa;';
    description.textContent = 'Agrandit ou réduit les pseudos, les informations et le contenu des messages.';
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:11px;color:#c4c4c8;font-size:12px;';
    const label = document.createElement('span'); label.textContent = 'Taille de police';
    const value = document.createElement('strong'); value.style.color = '#f4f4f5'; row.append(label, value);
    const slider = document.createElement('input');
    slider.type = 'range'; slider.min = String(MIN_PERCENT); slider.max = String(MAX_PERCENT); slider.step = '5';
    slider.style.cssText = 'width:100%;margin-top:11px;accent-color:#38bdf8;cursor:pointer;';
    const actions = document.createElement('div'); actions.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:11px;';
    const decrease = button('A−', '#3f3f46'); const increase = button('A+', '#0f766e'); const save = button('Enregistrer', '#2563eb'); const reset = button('Réinitialiser', '#3f3f46');
    actions.append(decrease, increase, save, reset);
    const feedback = document.createElement('div'); feedback.style.cssText = 'min-height:18px;margin-top:8px;font-size:11px;color:#a1a1aa;';
    const sync = (nextScale = runtime.getScale()) => { slider.value = String(percent(nextScale)); value.textContent = `${slider.value}%`; };
    const preview = () => { value.textContent = `${slider.value}%`; runtime.preview(Number(slider.value) / 100); };
    slider.addEventListener('input', preview);
    decrease.addEventListener('click', () => { slider.value = String(Math.max(MIN_PERCENT, Number(slider.value) - 5)); preview(); });
    increase.addEventListener('click', () => { slider.value = String(Math.min(MAX_PERCENT, Number(slider.value) + 5)); preview(); });
    save.addEventListener('click', () => { runtime.save(Number(slider.value) / 100); sync(); feedback.textContent = `Taille de police enregistrée : ${slider.value}%.`; refresh(); });
    reset.addEventListener('click', () => { runtime.reset(); slider.value = String(DEFAULT_PERCENT); sync(); feedback.textContent = 'Taille de police réinitialisée.'; refresh(); });
    sync();
    container.append(description, row, slider, actions, feedback);
}
