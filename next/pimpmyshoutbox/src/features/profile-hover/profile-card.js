/**
 * Construit la carte de profil de « Profile Hover ».
 *
 * @module src/features/profile-hover/profile-card
 */
const CARD_ID = 'tm-t4-next-profile-hover-card';

function bytes(value) {
    const amount = Math.max(0, Number(value) || 0);
    if (amount < 1024) return `${Math.round(amount)} o`;
    const units = ['Ko', 'Mo', 'Go', 'To'];
    let size = amount / 1024;
    let index = 0;
    while (size >= 1024 && index < units.length - 1) { size /= 1024; index += 1; }
    return `${size.toLocaleString('fr-FR', { maximumFractionDigits: size >= 10 ? 0 : 1 })} ${units[index]}`;
}

function ratio(value) {
    if (value === Infinity) return '∞';
    return Number.isFinite(value) ? value.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) : '—';
}

function joinedAt(value) {
    const numeric = Number(value);
    const date = Number.isFinite(numeric) && numeric > 0
        ? new Date(numeric < 100000000000 ? numeric * 1000 : numeric)
        : new Date(value);
    return Number.isNaN(date.getTime()) ? 'Non renseignée' : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(date);
}

function safeUrl(value) {
    try {
        const url = new URL(String(value || ''), location.href);
        return /^https?:$/.test(url.protocol) ? url.href : '';
    } catch { return ''; }
}

function normalizeProfile(payload, fallbackUsername) {
    const data = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
    const raw = data?.user && typeof data.user === 'object' ? data.user : data;
    if (!raw || typeof raw !== 'object') return null;
    const uploaded = Math.max(0, Number(raw.uploaded ?? raw.upload) || 0);
    const bonusUpload = Math.max(0, Number(raw.bonus_upload ?? raw.bonusUpload) || 0);
    const downloaded = Math.max(0, Number(raw.downloaded ?? raw.download) || 0);
    const providedRatio = Number(raw.ratio);
    return {
        username: String(raw.username || raw.name || fallbackUsername || '').trim() || fallbackUsername,
        role: String(raw.role || raw.rank || '').trim(),
        roleColor: String(raw.role_color || raw.roleColor || '').trim(),
        joinedAt: raw.joined_at ?? raw.joinedAt ?? raw.created_at ?? raw.createdAt,
        avatarUrl: safeUrl(raw.avatar_url || raw.avatarUrl || raw.avatar),
        bannerUrl: safeUrl(raw.banner_url || raw.bannerUrl || raw.banner),
        isPrivate: raw.profile_private === true || raw.is_private === true || raw.profile_visibility === 'private' || raw.visibility === 'private',
        hideRatio: raw.hide_ratio === true,
        uploaded,
        bonusUpload,
        downloaded,
        ratio: Number.isFinite(providedRatio) ? providedRatio : (downloaded ? (uploaded + bonusUpload) / downloaded : (uploaded + bonusUpload ? Infinity : null))
    };
}

/**
 * Crée l'API publique « createProfileHoverCard ».
 *
 * @function createProfileHoverCard
 */
export function createProfileHoverCard({ text, grades }) {
    const cache = new Map();
    const pending = new Map();
    let card = null;
    let activeTarget = null;
    let hideTimer = null;
    let renderVersion = 0;

    function ensureCard() {
        if (card?.isConnected) return card;
        if (!document.body) return null;
        card = document.createElement('aside');
        card.id = CARD_ID;
        card.setAttribute('role', 'status');
        card.setAttribute('aria-live', 'polite');
        card.style.cssText = 'position:fixed;z-index:1000005;display:none;width:min(284px,calc(100vw - 16px));box-sizing:border-box;padding:11px 12px;border:1px solid rgba(125,211,252,.24);border-radius:12px;overflow:hidden;background:rgba(18,18,22,.98);box-shadow:0 16px 38px rgba(0,0,0,.42),0 1px 0 rgba(255,255,255,.05) inset;backdrop-filter:blur(10px);pointer-events:none;font-family:Inter,Arial,sans-serif;';
        document.body.append(card);
        return card;
    }

    function position(target) {
        if (!card) return;
        const rect = target.getBoundingClientRect();
        const margin = 8;
        const bounds = card.getBoundingClientRect();
        const width = Math.min(bounds.width || 284, window.innerWidth - margin * 2);
        const height = Math.min(bounds.height || 150, window.innerHeight - margin * 2);
        const left = Math.max(margin, Math.min(window.innerWidth - width - margin, rect.left));
        const below = rect.bottom + margin;
        const top = below <= window.innerHeight - height - margin ? below : Math.max(margin, rect.top - height - margin);
        card.style.left = `${Math.round(left)}px`;
        card.style.top = `${Math.round(top)}px`;
    }

    function clearCard() {
        window.clearTimeout(hideTimer);
        hideTimer = null;
        activeTarget = null;
        if (card) card.style.display = 'none';
    }

    function scheduleHide() {
        window.clearTimeout(hideTimer);
        hideTimer = window.setTimeout(clearCard, 130);
    }

    function appendMessage(username, message) {
        renderVersion += 1;
        card.replaceChildren();
        const name = document.createElement('div');
        name.textContent = username;
        name.style.cssText = 'font-size:13px;font-weight:750;color:#f4f4f5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        const detail = document.createElement('div');
        detail.textContent = message;
        detail.style.cssText = 'margin-top:8px;font-size:12px;line-height:1.45;color:#a1a1aa;';
        card.append(name, detail);
    }

    function renderProfile(profile) {
        const version = ++renderVersion;
        card.replaceChildren();
        if (profile.bannerUrl) {
            const banner = document.createElement('div');
            banner.style.cssText = 'display:none;position:relative;height:48px;margin:-11px -12px 10px;background-color:#18181b;overflow:hidden;';
            card.append(banner);
            const image = new Image();
            image.onload = () => {
                if (renderVersion !== version || !banner.isConnected || !activeTarget) return;
                image.alt = '';
                image.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';
                const overlay = document.createElement('div');
                overlay.style.cssText = 'position:absolute;inset:0;background:linear-gradient(180deg,rgba(9,9,11,.08),rgba(18,18,22,.88));';
                banner.append(image, overlay);
                banner.style.display = 'block';
                position(activeTarget);
            };
            image.onerror = () => banner.remove();
            image.src = profile.bannerUrl;
        }
        const identity = document.createElement('div');
        identity.style.cssText = 'display:flex;align-items:center;gap:8px;min-width:0;';
        const avatar = document.createElement('div');
        avatar.style.cssText = 'position:relative;width:28px;height:28px;flex:0 0 28px;border-radius:9px;overflow:hidden;display:grid;place-items:center;background:linear-gradient(135deg,#0e7490,#2563eb);color:#eff6ff;font-size:12px;font-weight:800;';
        avatar.textContent = profile.username.slice(0, 1).toUpperCase() || '?';
        if (profile.avatarUrl) {
            const image = document.createElement('img');
            image.src = profile.avatarUrl; image.alt = ''; image.referrerPolicy = 'no-referrer';
            image.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#18181b;';
            image.addEventListener('error', () => image.remove(), { once: true });
            avatar.append(image);
        }
        const details = document.createElement('div'); details.style.cssText = 'min-width:0;flex:1;';
        const name = document.createElement('div'); name.textContent = profile.username; name.style.cssText = 'font-size:13px;font-weight:750;color:#f4f4f5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        details.append(name);
        const role = grades.createBadge(profile.role, profile.roleColor);
        if (role) details.append(role);
        const joined = document.createElement('div'); joined.textContent = `Membre depuis le ${joinedAt(profile.joinedAt)}`; joined.style.cssText = 'margin-top:4px;font-size:10px;color:#a1a1aa;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        details.append(joined); identity.append(avatar, details); card.append(identity);
        const stats = document.createElement('div'); stats.style.cssText = 'display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:11px;padding-top:10px;border-top:1px solid rgba(255,255,255,.08);';
        const hidden = profile.hideRatio;
        for (const [label, value, color] of [
            ['Ratio', hidden ? 'Masqué' : ratio(profile.ratio), '#f4f4f5'],
            ['Upload', hidden ? 'Masqué' : bytes(profile.uploaded + profile.bonusUpload), '#86efac'],
            ['Download', hidden ? 'Masqué' : bytes(profile.downloaded), '#fca5a5']
        ]) {
            const stat = document.createElement('div');
            stat.innerHTML = `<div style="font-size:9px;text-transform:uppercase;letter-spacing:.05em;color:#71717a;">${text.escapeHtml(label)}</div><div style="margin-top:2px;font-size:12px;font-weight:750;color:${hidden ? '#a1a1aa' : color};white-space:nowrap;">${text.escapeHtml(value)}</div>`;
            stats.append(stat);
        }
        card.append(stats);
    }

    async function fetchProfile(username) {
        const key = text.normalizeName(username);
        if (cache.has(key)) return cache.get(key);
        if (pending.has(key)) return pending.get(key);
        const request = fetch(`/api/users/${encodeURIComponent(username)}`, { credentials: 'same-origin' })
            .then(async (response) => {
                if (!response.ok) {
                    const error = new Error('profile-unavailable');
                    error.private = response.status === 401 || response.status === 403;
                    throw error;
                }
                const profile = normalizeProfile(await response.json(), username);
                if (!profile) throw new Error('profile-unavailable');
                cache.set(key, profile);
                return profile;
            })
            .finally(() => pending.delete(key));
        pending.set(key, request);
        return request;
    }

    function show(target, rawUsername) {
        const username = String(rawUsername || target?.textContent || '').trim();
        if (!(target instanceof HTMLElement) || !username) return;
        window.clearTimeout(hideTimer);
        activeTarget = target;
        const nextCard = ensureCard();
        if (!nextCard) return;
        appendMessage(username, 'Chargement du profil…');
        nextCard.style.display = 'block';
        position(target);
        fetchProfile(username).then((profile) => {
            if (activeTarget !== target || !nextCard.isConnected) return;
            if (profile.isPrivate) appendMessage(profile.username, 'Ce profil ne partage pas ses statistiques.');
            else renderProfile(profile);
            position(target);
        }).catch((error) => {
            if (activeTarget !== target || !nextCard.isConnected) return;
            appendMessage(username, error?.private ? 'Ce profil ne partage pas ses statistiques.' : 'Profil indisponible.');
            position(target);
        });
    }

    return Object.freeze({ show, scheduleHide, hide: clearCard, destroy() { clearCard(); card?.remove(); card = null; } });
}
