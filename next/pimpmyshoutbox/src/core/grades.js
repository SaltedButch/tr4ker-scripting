/**
 * Expose les définitions de grades et applique leur présentation visuelle.
 *
 * @module src/core/grades
 */
import { normalizeName } from './text.js';

const COLORS_STORAGE_KEY = 'tm_t4_grade_pseudonym_colors';
const EFFECTS_STORAGE_KEY = 'tm_t4_grade_pseudonym_effects';
const STYLE_ID = 'tm-t4-next-grade-effects';

export const GRADE_DEFINITIONS = Object.freeze([
    { id: 'membre', label: 'Membre', apiRoleLabels: { user: 'Membre', membre: 'Membre' }, nativeColors: ['#f472b6'], defaultColor: '#f472b6' },
    { id: 'helper', label: 'Helper', apiRoleLabels: { helper: 'Helper' }, nativeColors: ['#ffffff'], defaultColor: '#ffffff' },
    { id: 'uploader-en-herbe', label: 'Uploader en herbe', apiRoleLabels: { uploader_herbe: 'Uploader en herbe' }, nativeColors: ['#7dd3fc'], defaultColor: '#7dd3fc' },
    { id: 'uploader', label: 'Uploader', apiRoleLabels: { uploader: 'Uploader' }, nativeColors: ['#2563eb'], defaultColor: '#2563eb' },
    { id: 'team', label: 'Team', apiRoleLabels: { team: 'Team' }, nativeColors: ['#f87171'], defaultColor: '#f87171' },
    { id: 'contributeur', label: 'Contributeur', apiRoleLabels: { contributeur: 'Contributeur' }, nativeColors: ['#f4f4f5'], defaultColor: '#f4f4f5' },
    { id: 'staff', label: 'Staff', apiRoleLabels: { staff: 'Staff', moderator: 'Modérateur', admin: 'Administrateur' }, nativeColors: ['#16a34a'], defaultColor: '#16a34a' }
]);

export const GRADE_EFFECT_DEFINITIONS = Object.freeze([
    { id: 'none', label: 'Aucun effet' }, { id: 'pulse-slow', label: 'Pulse lent' }, { id: 'pulse-fast', label: 'Pulse rapide' },
    { id: 'neon', label: 'Néon' }, { id: 'gradient', label: 'Dégradé glissant' }, { id: 'breathing-glow', label: 'Lueur respirante' },
    { id: 'shine', label: 'Reflet qui passe' }, { id: 'rainbow', label: 'Arc-en-ciel sobre' }, { id: 'glitch', label: 'Glitch rare' },
    { id: 'typewriter', label: 'Machine à écrire' }, { id: 'underline', label: 'Soulignement animé' }, { id: 'sparkle', label: 'Scintillement' },
    { id: 'wave', label: 'Ondulation légère' }, { id: 'chrome', label: 'Reflet chromé' }, { id: 'arrival', label: 'Impulsion à l’arrivée' }
]);

function normalizeColor(value, fallback = '') {
    const color = String(value || '').trim();
    if (/^#[0-9a-f]{3}$/i.test(color)) return `#${color.slice(1).split('').map((char) => char + char).join('').toLowerCase()}`;
    return /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : fallback;
}

function cssColorToHex(value) {
    const direct = normalizeColor(value);
    if (direct) return direct;
    const match = String(value || '').match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i);
    if (!match) return '';
    return `#${match.slice(1, 4).map((channel) => Math.max(0, Math.min(255, Number(channel))).toString(16).padStart(2, '0')).join('')}`;
}

function rgba(hexColor, alpha) {
    const hex = normalizeColor(hexColor, '#7dd3fc').slice(1);
    return `rgba(${Number.parseInt(hex.slice(0, 2), 16)},${Number.parseInt(hex.slice(2, 4), 16)},${Number.parseInt(hex.slice(4, 6), 16)},${alpha})`;
}

function ensureEffectsStyle() {
    if (!document.head) return;
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      @keyframes tm-t4-grade-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.64;transform:scale(1.018)}}
      @keyframes tm-t4-grade-gradient{0%{background-position:0% 50%}100%{background-position:200% 50%}}
      @keyframes tm-t4-grade-glow{0%,100%{text-shadow:0 0 2px var(--tm-t4-grade-color);filter:brightness(1)}50%{text-shadow:0 0 6px var(--tm-t4-grade-color),0 0 16px var(--tm-t4-grade-color);filter:brightness(1.22)}}
      @keyframes tm-t4-grade-rainbow{0%{filter:hue-rotate(0deg) saturate(1.05)}100%{filter:hue-rotate(360deg) saturate(1.18)}}
      @keyframes tm-t4-grade-glitch{0%,92%,100%{transform:translate(0);text-shadow:none}93%{transform:translate(-1px,0);text-shadow:1px 0 #22d3ee,-1px 0 #f43f5e}95%{transform:translate(1px,0);text-shadow:-1px 0 #22d3ee,1px 0 #f43f5e}97%{transform:translate(0);text-shadow:none}}
      @keyframes tm-t4-grade-typewriter{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
      @keyframes tm-t4-grade-underline{0%,22%{transform:scaleX(0)}58%,100%{transform:scaleX(1)}}
      @keyframes tm-t4-grade-sparkle{0%,100%{text-shadow:0 0 0 transparent;filter:brightness(1)}50%{text-shadow:-4px -3px 0 rgba(255,255,255,.82),4px 2px 0 rgba(255,255,255,.72),0 0 8px var(--tm-t4-grade-color);filter:brightness(1.18)}}
      @keyframes tm-t4-grade-wave{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
      @keyframes tm-t4-grade-arrival{0%{opacity:.35;transform:scale(.82)}58%{opacity:1;transform:scale(1.09)}100%{opacity:1;transform:scale(1)}}
      [data-tm-t4-grade-effect="pulse-slow"],[data-tm-t4-grade-effect="pulse-fast"],[data-tm-t4-grade-effect="glitch"],[data-tm-t4-grade-effect="typewriter"],[data-tm-t4-grade-effect="wave"],[data-tm-t4-grade-effect="arrival"]{display:inline-block;transform-origin:center}
      [data-tm-t4-grade-effect="pulse-slow"],[data-tm-t4-grade-effect="pulse-fast"]{animation-name:tm-t4-grade-pulse;animation-timing-function:ease-in-out;animation-iteration-count:infinite}[data-tm-t4-grade-effect="pulse-slow"]{animation-duration:3.2s}[data-tm-t4-grade-effect="pulse-fast"]{animation-duration:1.45s}
      [data-tm-t4-grade-effect="neon"]{text-shadow:0 0 4px var(--tm-t4-grade-color),0 0 10px var(--tm-t4-grade-color)}
      [data-tm-t4-grade-effect="gradient"],[data-tm-t4-grade-effect="shine"],[data-tm-t4-grade-effect="chrome"]{-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:tm-t4-grade-gradient 3.2s linear infinite}
      [data-tm-t4-grade-effect="gradient"]{background:linear-gradient(105deg,var(--tm-t4-grade-color) 0%,#fff 42%,var(--tm-t4-grade-color) 72%,#fff 100%)!important;background-size:220% 100%!important}
      [data-tm-t4-grade-effect="breathing-glow"]{animation:tm-t4-grade-glow 3.4s ease-in-out infinite}
      [data-tm-t4-grade-effect="shine"]{background:linear-gradient(105deg,var(--tm-t4-grade-color) 0%,var(--tm-t4-grade-color) 35%,#fff 50%,var(--tm-t4-grade-color) 65%,var(--tm-t4-grade-color) 100%)!important;background-size:260% 100%!important;animation-duration:4.8s}
      [data-tm-t4-grade-effect="rainbow"]{animation:tm-t4-grade-rainbow 8s linear infinite}[data-tm-t4-grade-effect="glitch"]{animation:tm-t4-grade-glitch 7.5s steps(2,end) infinite}[data-tm-t4-grade-effect="typewriter"]{animation:tm-t4-grade-typewriter 850ms steps(18,end) both}
      [data-tm-t4-grade-effect="underline"]{position:relative;display:inline-block}[data-tm-t4-grade-effect="underline"]::after{content:'';position:absolute;left:0;right:0;bottom:-3px;height:2px;border-radius:999px;background:var(--tm-t4-grade-color);box-shadow:0 0 5px var(--tm-t4-grade-color);transform:scaleX(0);transform-origin:left center;animation:tm-t4-grade-underline 3.8s ease-out infinite}
      [data-tm-t4-grade-effect="sparkle"]{animation:tm-t4-grade-sparkle 2.8s ease-in-out infinite}[data-tm-t4-grade-effect="wave"]{animation:tm-t4-grade-wave 1.8s ease-in-out infinite}
      [data-tm-t4-grade-effect="chrome"]{background:linear-gradient(115deg,#9ca3af 0%,#fff 26%,var(--tm-t4-grade-color) 46%,#fff 67%,#9ca3af 100%)!important;background-size:220% 100%!important;animation-duration:5.4s}[data-tm-t4-grade-effect="arrival"]{animation:tm-t4-grade-arrival 620ms cubic-bezier(.16,1,.3,1) both}
      @media (prefers-reduced-motion:reduce){[data-tm-t4-grade-effect]{animation:none!important}[data-tm-t4-grade-effect="underline"]::after{animation:none;transform:scaleX(1)}}
    `;
    document.head.append(style);
}

/**
 * Crée l'API publique « createGradeService ».
 *
 * @function createGradeService
 */
export function createGradeService({ storage }) {
    const getDefinition = (id) => GRADE_DEFINITIONS.find((grade) => grade.id === String(id || '').trim()) || null;
    const getDefinitionForApiRole = (role) => GRADE_DEFINITIONS.find((grade) => Object.hasOwn(grade.apiRoleLabels, normalizeName(role))) || null;
    const getDefaultColors = () => Object.fromEntries(GRADE_DEFINITIONS.map((grade) => [grade.id, grade.defaultColor]));
    const getDefaultEffects = () => Object.fromEntries(GRADE_DEFINITIONS.map((grade) => [grade.id, 'none']));
    const getColors = () => {
        const saved = storage.readJson(COLORS_STORAGE_KEY, {});
        return Object.fromEntries(GRADE_DEFINITIONS.map((grade) => [grade.id, normalizeColor(saved?.[grade.id], grade.defaultColor)]));
    };
    const getEffects = () => {
        const saved = storage.readJson(EFFECTS_STORAGE_KEY, {});
        return Object.fromEntries(GRADE_DEFINITIONS.map((grade) => [grade.id, GRADE_EFFECT_DEFINITIONS.some((effect) => effect.id === saved?.[grade.id]) ? saved[grade.id] : 'none']));
    };
    const saveColors = (colors) => storage.writeJson(COLORS_STORAGE_KEY, Object.fromEntries(GRADE_DEFINITIONS.map((grade) => [grade.id, normalizeColor(colors?.[grade.id], grade.defaultColor)])));
    const saveEffects = (effects) => storage.writeJson(EFFECTS_STORAGE_KEY, Object.fromEntries(GRADE_DEFINITIONS.map((grade) => [grade.id, GRADE_EFFECT_DEFINITIONS.some((effect) => effect.id === effects?.[grade.id]) ? effects[grade.id] : 'none'])));

    function getPresentation(role, fallbackColor = '#7dd3fc') {
        const definition = getDefinitionForApiRole(role);
        if (!definition) {
            const label = String(role || '').trim();
            return label ? { id: '', label, color: normalizeColor(fallbackColor, '#7dd3fc'), effectId: 'none' } : null;
        }
        const roleKey = normalizeName(role);
        return { id: definition.id, label: definition.apiRoleLabels[roleKey] || definition.label, color: getColors()[definition.id], effectId: getEffects()[definition.id] };
    }

    function createBadge(role, fallbackColor) {
        const presentation = getPresentation(role, fallbackColor);
        if (!presentation) return null;
        if (presentation.effectId !== 'none') ensureEffectsStyle();
        const badge = document.createElement('span');
        badge.textContent = presentation.label;
        badge.dataset.tmT4Grade = presentation.id || 'unknown';
        if (presentation.effectId !== 'none') badge.dataset.tmT4GradeEffect = presentation.effectId;
        badge.style.cssText = `display:inline-block;margin-top:3px;font-size:10px;font-weight:700;color:${presentation.color};--tm-t4-grade-color:${presentation.color};background:${rgba(presentation.color, .14)};border:1px solid ${rgba(presentation.color, .28)};border-radius:999px;padding:3px 6px;`;
        return badge;
    }

    function getNativeColor(element) {
        if (!(element instanceof HTMLElement)) return '';
        const cached = normalizeColor(element.dataset.tmT4GradeNativeColor);
        if (cached) return cached;
        const inlineColor = element.style.getPropertyValue('color');
        element.dataset.tmT4GradeNativeInlineColor = inlineColor;
        element.dataset.tmT4GradeNativeInlinePriority = element.style.getPropertyPriority('color');
        const nativeColor = cssColorToHex(inlineColor || window.getComputedStyle(element).color);
        if (nativeColor) element.dataset.tmT4GradeNativeColor = nativeColor;
        return nativeColor;
    }

    function findNativeGrade(element) {
        const color = getNativeColor(element);
        return GRADE_DEFINITIONS.find((grade) => grade.nativeColors.includes(color)) || null;
    }

    function restoreElement(element) {
        if (!(element instanceof HTMLElement) || element.dataset.tmT4GradeApplied !== '1') return;
        const color = element.dataset.tmT4GradeNativeInlineColor || '';
        if (color) element.style.setProperty('color', color, element.dataset.tmT4GradeNativeInlinePriority || '');
        else element.style.removeProperty('color');
        element.style.removeProperty('--tm-t4-grade-color');
        delete element.dataset.tmT4GradeApplied;
        delete element.dataset.tmT4GradeEffect;
    }

    function applyElement(element, grade) {
        if (!(element instanceof HTMLElement)) return;
        if (!grade) { restoreElement(element); return; }
        getNativeColor(element);
        const color = getColors()[grade.id];
        const effectId = getEffects()[grade.id];
        element.style.setProperty('color', color, 'important');
        element.style.setProperty('--tm-t4-grade-color', color);
        element.dataset.tmT4GradeApplied = '1';
        if (effectId === 'none') delete element.dataset.tmT4GradeEffect;
        else { ensureEffectsStyle(); element.dataset.tmT4GradeEffect = effectId; }
    }

    return Object.freeze({
        definitions: GRADE_DEFINITIONS, effects: GRADE_EFFECT_DEFINITIONS,
        getDefinition, getDefinitionForApiRole, getDefaultColors, getDefaultEffects, getColors, getEffects, saveColors, saveEffects,
        getPresentation, createBadge, findNativeGrade, applyElement, restoreElement
    });
}
