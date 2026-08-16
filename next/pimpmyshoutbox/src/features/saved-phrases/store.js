/**
 * Gère les données persistées et les favoris de la feature « Saved Phrases ».
 *
 * @module src/features/saved-phrases/store
 */
const EXPORT_VERSION = 1;

export const STORAGE_KEYS = Object.freeze({
    phrases: 'tm_t4_saved_phrases',
    enabled: 'tm_t4_saved_phrases_enabled',
    replaceInput: 'tm_t4_saved_phrases_replace_input'
});

function textValue(value) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
}

function comparable(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('fr')
        .replace(/[^\p{L}\p{N}@#]+/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokens(value) {
    return new Set(comparable(value).split(' ').filter((token) => token.length >= 3));
}

/**
 * Normalise les données reçues par « normalizeKeywords ».
 *
 * @function normalizeKeywords
 */
export function normalizeKeywords(value) {
    const source = Array.isArray(value)
        ? value.flatMap((entry) => textValue(entry).split(/[,;\n]+/))
        : textValue(value).split(/[,;\n]+/);
    const seen = new Set();
    const result = [];
    for (const entry of source) {
        const keyword = entry.trim();
        const key = comparable(keyword);
        if (!keyword || !key || seen.has(key)) continue;
        seen.add(key);
        result.push(keyword);
    }
    return result;
}

/**
 * Normalise les données reçues par « normalizePhrase ».
 *
 * @function normalizePhrase
 */
export function normalizePhrase(record, { maxLength = 4000 } = {}) {
    const value = record && typeof record === 'object' && !Array.isArray(record)
        ? record.text ?? record.phrase ?? record.content ?? record.value ?? record.label
        : record;
    const text = textValue(value).replace(/\r\n?/g, '\n').trim().slice(0, maxLength);
    if (!text) return null;
    const keywords = record && typeof record === 'object' && !Array.isArray(record) ? record.keywords : [];
    return { text, keywords: normalizeKeywords(keywords) };
}

function clone(phrase) {
    return { text: phrase.text, keywords: [...phrase.keywords] };
}

function matchScore(phrase, inputText, replyText) {
    const inputComparable = comparable(inputText);
    const replyComparable = comparable(replyText);
    const inputTokens = tokens(inputText);
    const replyTokens = tokens(replyText);
    const phraseTokens = tokens(phrase.text);
    let score = 0;
    const matchedKeywords = [];

    for (const keyword of phrase.keywords) {
        const normalized = comparable(keyword);
        if (!normalized) continue;
        const keywordTokens = tokens(keyword);
        let matched = false;
        if (replyComparable.includes(normalized) || [...keywordTokens].every((token) => replyTokens.has(token))) {
            score += normalized.includes(' ') ? 18 : 14;
            matched = true;
        } else if (inputComparable.includes(normalized) || [...keywordTokens].every((token) => inputTokens.has(token))) {
            score += normalized.includes(' ') ? 10 : 8;
            matched = true;
        }
        if (matched) matchedKeywords.push(keyword);
    }

    const phraseComparable = comparable(phrase.text);
    if (phraseComparable && replyComparable.includes(phraseComparable)) score += phraseComparable.includes(' ') ? 16 : 12;
    else if (phraseComparable && inputComparable.includes(phraseComparable)) score += phraseComparable.includes(' ') ? 10 : 7;

    for (const token of phraseTokens) {
        if (replyTokens.has(token)) score += 2;
        if (inputTokens.has(token)) score += 1;
    }
    return { score, matchedKeywords };
}

/**
 * Crée l'API publique « createSavedPhrasesStore ».
 *
 * @function createSavedPhrasesStore
 */
export function createSavedPhrasesStore({ storage, maxLength = 4000 }) {
    let phrases = [];

    function reload() {
        const parsed = storage.readJson(STORAGE_KEYS.phrases, []);
        const seen = new Set();
        phrases = (Array.isArray(parsed) ? parsed : [])
            .map((entry) => normalizePhrase(entry, { maxLength }))
            .filter((entry) => {
                if (!entry || seen.has(entry.text)) return false;
                seen.add(entry.text);
                return true;
            });
        return list();
    }

    function save() {
        storage.writeJson(STORAGE_KEYS.phrases, phrases.map(clone));
    }

    function list() {
        return phrases.map(clone);
    }

    function add(text, keywordValues) {
        const phrase = normalizePhrase({ text, keywords: keywordValues }, { maxLength });
        if (!phrase) return { ok: false, message: 'Phrase vide.' };
        const existing = phrases.find((entry) => entry.text === phrase.text);
        if (existing) {
            const merged = normalizeKeywords([...existing.keywords, ...phrase.keywords]);
            if (merged.length === existing.keywords.length) return { ok: false, message: 'Cette phrase existe déjà.' };
            existing.keywords = merged;
            save();
            return { ok: true, message: 'Mots-clés ajoutés à la phrase existante.' };
        }
        phrases.push(phrase);
        save();
        return { ok: true, message: phrase.keywords.length ? 'Phrase et mots-clés ajoutés.' : 'Phrase ajoutée.' };
    }

    function update(index, text, keywordValues) {
        if (!Number.isInteger(index) || index < 0 || index >= phrases.length) return { ok: false, message: 'Phrase introuvable.' };
        const phrase = normalizePhrase({ text, keywords: keywordValues }, { maxLength });
        if (!phrase) return { ok: false, message: 'Phrase vide.' };
        if (phrases.some((entry, entryIndex) => entryIndex !== index && entry.text === phrase.text)) {
            return { ok: false, message: 'Une autre phrase utilise déjà ce texte.' };
        }
        phrases[index] = phrase;
        save();
        return { ok: true, message: 'Phrase mise à jour.' };
    }

    function remove(index) {
        if (!Number.isInteger(index) || index < 0 || index >= phrases.length) return { ok: false, message: 'Phrase introuvable.' };
        phrases.splice(index, 1);
        save();
        return { ok: true, message: 'Phrase supprimée.' };
    }

    function rank({ inputText = '', replyText = '' } = {}) {
        const ranked = phrases.map((phrase, index) => {
            const { score, matchedKeywords } = matchScore(phrase, inputText, replyText);
            return {
                phrase: clone(phrase),
                index,
                score,
                matchedKeywords,
                matchPercent: score > 0 ? Math.min(100, Math.round((1 - Math.exp(-score / 14)) * 100)) : 0
            };
        });
        const hasContextualResult = ranked.some((entry) => entry.score > 0);
        return ranked.sort((left, right) => hasContextualResult
            ? right.score - left.score || left.index - right.index
            : left.index - right.index);
    }

    function exportPayload() {
        return { version: EXPORT_VERSION, exportedAt: new Date().toISOString(), source: 'PimpMyShoutbox Next', phrases: list() };
    }

    function importPayload(payload) {
        const records = Array.isArray(payload) ? payload : payload?.phrases ?? payload?.savedPhrases ?? payload?.items;
        if (!Array.isArray(records)) return { ok: false, message: 'Format JSON invalide pour les réponses rapides.' };
        let added = 0;
        let updated = 0;
        let ignored = 0;
        for (const record of records) {
            const phrase = normalizePhrase(record, { maxLength });
            if (!phrase) { ignored += 1; continue; }
            const existing = phrases.find((entry) => entry.text === phrase.text);
            if (!existing) { phrases.push(phrase); added += 1; continue; }
            const merged = normalizeKeywords([...existing.keywords, ...phrase.keywords]);
            if (merged.length === existing.keywords.length) { ignored += 1; continue; }
            existing.keywords = merged;
            updated += 1;
        }
        if (!added && !updated) return { ok: false, message: 'Import impossible : aucune nouvelle réponse exploitable.' };
        save();
        const parts = [];
        if (added) parts.push(`${added} ajoutée${added > 1 ? 's' : ''}`);
        if (updated) parts.push(`${updated} enrichie${updated > 1 ? 's' : ''}`);
        if (ignored) parts.push(`${ignored} ignorée${ignored > 1 ? 's' : ''}`);
        return { ok: true, message: `Import terminé : ${parts.join(', ')}.` };
    }

    reload();
    return Object.freeze({ reload, list, add, update, remove, rank, exportPayload, importPayload, maxLength });
}

/**
 * Télécharge le résultat produit par « downloadSavedPhrases ».
 *
 * @function downloadSavedPhrases
 */
export function downloadSavedPhrases(payload) {
    try {
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tr4ker-reponses-rapides-${new Date().toISOString().slice(0, 10)}.json`;
        link.style.display = 'none';
        document.body?.append(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);
        return { ok: true, message: 'Export JSON téléchargé.' };
    } catch {
        return { ok: false, message: 'Impossible de générer l’export JSON.' };
    }
}
