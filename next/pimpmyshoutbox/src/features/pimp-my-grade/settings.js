const CONTROL_STYLE = 'border:1px solid rgba(255,255,255,.16);border-radius:7px;background:#18181b;color:#fff;padding:6px 8px;';

function makeButton(label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.style.cssText = 'border:1px solid rgba(255,255,255,.14);border-radius:7px;background:#3f3f46;color:#fff;padding:6px 9px;cursor:pointer;';
    return button;
}

function saveColor(runtime, gradeId, value) {
    const colors = runtime.context.grades.getColors();
    colors[gradeId] = value;
    runtime.context.grades.saveColors(colors);
    runtime.refresh();
}

function saveEffect(runtime, gradeId, value) {
    const effects = runtime.context.grades.getEffects();
    effects[gradeId] = value;
    runtime.context.grades.saveEffects(effects);
    runtime.refresh();
}

export function renderPimpMyGradeSettings(container, { context, refresh: refreshSettings }) {
    if (!context) {
        container.textContent = 'Active la feature pour modifier l’apparence des grades.';
        return;
    }

    const featureRuntime = context.pimpMyGrade || {
        context,
        refresh() {
            for (const messageElement of context.platform.getMessages()) {
                const sender = messageElement.querySelector('[class*="msgSender"]');
                if (!(sender instanceof HTMLElement)) continue;
                const grade = context.grades.findNativeGrade(sender);
                const targets = [sender, ...messageElement.querySelectorAll('[class*="msgMeta"] [class*="msgTitle"]')];
                for (const target of targets) context.grades.applyElement(target, grade);
            }
        }
    };

    const introduction = document.createElement('p');
    introduction.style.cssText = 'margin:0 0 12px;color:#a1a1aa;font-size:12px;line-height:1.45;';
    introduction.textContent = 'Choisissez une couleur et un effet pour chaque grade.';
    container.append(introduction);

    const colors = context.grades.getColors();
    const effects = context.grades.getEffects();
    const rows = document.createElement('div');
    rows.style.cssText = 'display:grid;gap:8px;';
    for (const grade of context.grades.definitions) {
        const row = document.createElement('div');
        row.style.cssText = 'display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px 10px;padding:8px 0;border-top:1px solid rgba(255,255,255,.07);';

        const label = document.createElement('label');
        label.textContent = grade.label;
        label.style.cssText = 'font-size:13px;font-weight:650;';

        const colorControls = document.createElement('div');
        colorControls.style.cssText = 'display:flex;align-items:center;gap:8px;';
        const colorValue = document.createElement('span');
        colorValue.textContent = colors[grade.id].toUpperCase();
        colorValue.style.cssText = 'font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;color:#a1a1aa;';
        const color = document.createElement('input');
        color.type = 'color';
        color.value = colors[grade.id];
        color.title = `Couleur ${grade.label}`;
        color.setAttribute('aria-label', `Couleur ${grade.label}`);
        color.style.cssText = 'width:38px;height:30px;padding:2px;border:1px solid rgba(255,255,255,.16);border-radius:7px;background:#18181b;cursor:pointer;';
        color.addEventListener('input', () => {
            colorValue.textContent = color.value.toUpperCase();
        });
        color.addEventListener('change', () => saveColor(featureRuntime, grade.id, color.value));
        colorControls.append(colorValue, color);

        const effect = document.createElement('select');
        effect.style.cssText = `${CONTROL_STYLE}grid-column:1 / -1;width:100%;font-size:12px;`;
        effect.setAttribute('aria-label', `Effet ${grade.label}`);
        for (const definition of context.grades.effects) {
            const option = document.createElement('option');
            option.value = definition.id;
            option.textContent = definition.label;
            option.selected = effects[grade.id] === definition.id;
            effect.append(option);
        }
        effect.addEventListener('change', () => saveEffect(featureRuntime, grade.id, effect.value));
        row.append(label, colorControls, effect);
        rows.append(row);
    }
    container.append(rows);

    const reset = makeButton('Réinitialiser les grades');
    reset.style.marginTop = '12px';
    reset.addEventListener('click', () => {
        context.grades.saveColors(context.grades.getDefaultColors());
        context.grades.saveEffects(context.grades.getDefaultEffects());
        featureRuntime.refresh();
        context.ui.toast.show('Couleurs et effets réinitialisés.');
        refreshSettings();
    });
    container.append(reset);
}
