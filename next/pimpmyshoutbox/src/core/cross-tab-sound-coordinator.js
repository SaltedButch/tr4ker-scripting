const CLAIM_SETTLEMENT_DELAY_MS = 90;
const MAX_CLAIMS = 80;
const CLAIM_MAX_AGE_MS = 2 * 60 * 60 * 1000;

function createTabId() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getSessionTabId(storageKey) {
    try {
        const existing = String(sessionStorage.getItem(storageKey) || '').trim();
        if (existing) return existing;
        const tabId = createTabId();
        sessionStorage.setItem(storageKey, tabId);
        return tabId;
    } catch {
        // A tab id still helps when sessionStorage is disabled. The shared
        // localStorage reservation below remains mandatory before any sound.
        return createTabId();
    }
}

function normalizeState(value, now) {
    const claims = value && typeof value === 'object' && !Array.isArray(value) && value.claims
        && typeof value.claims === 'object' && !Array.isArray(value.claims)
        ? value.claims
        : {};
    const validClaims = Object.entries(claims)
        .filter(([eventKey, claim]) => (
            typeof eventKey === 'string'
            && claim && typeof claim === 'object'
            && typeof claim.tabId === 'string'
            && Number.isFinite(Number(claim.claimedAt))
            && now - Number(claim.claimedAt) < CLAIM_MAX_AGE_MS
        ))
        .sort(([, left], [, right]) => Number(left.claimedAt) - Number(right.claimedAt))
        .slice(-MAX_CLAIMS);

    const lastNotifiedAt = Math.max(0, Number(value?.lastNotifiedAt) || 0);
    return {
        claims: Object.fromEntries(validClaims),
        lastNotifiedAt
    };
}

function wait(delayMs) {
    return new Promise((resolve) => window.setTimeout(resolve, delayMs));
}

/**
 * Coordinates sounds that are triggered by a shared event (for example a chat
 * message) across every Tr4ker tab of the same browser profile.
 *
 * Web Locks gives an atomic reservation on supported browsers. The fallback is
 * intentionally cooperative: it writes, waits for competing tabs to settle,
 * then only the final owner may play. If localStorage cannot confirm ownership,
 * it returns false: missing one alert is preferable to playing it N times.
 */
export function createCrossTabSoundCoordinator({
    storage,
    namespace = 'tm-t4-next:sound',
    logger = console
}) {
    const stateKey = `${namespace}:state`;
    const tabId = getSessionTabId(`${namespace}:tab-id`);

    function readState(now) {
        return normalizeState(storage.readJson(stateKey, null), now);
    }

    function writeState(state) {
        return storage.writeJson(stateKey, state);
    }

    function reserveInState(eventKey, cooldownSeconds, now) {
        const state = readState(now);
        if (state.claims[eventKey]) return { allowed: false, reason: 'duplicate' };

        const cooldownMs = Math.max(0, Number(cooldownSeconds) || 0) * 1000;
        if (cooldownMs > 0 && now - state.lastNotifiedAt < cooldownMs) {
            return { allowed: false, reason: 'cooldown' };
        }

        state.claims[eventKey] = { tabId, claimedAt: now };
        state.lastNotifiedAt = now;
        return writeState(state)
            ? { allowed: true, reason: 'reserved' }
            : { allowed: false, reason: 'storage-unavailable' };
    }

    async function reserveWithWebLock(eventKey, cooldownSeconds, now) {
        let result = { allowed: false, reason: 'lock-unavailable' };
        await navigator.locks.request(`${namespace}:reservation`, { mode: 'exclusive' }, () => {
            result = reserveInState(eventKey, cooldownSeconds, now);
        });
        return result;
    }

    async function reserveWithSettlement(eventKey, cooldownSeconds, now) {
        const state = readState(now);
        if (state.claims[eventKey]) return { allowed: false, reason: 'duplicate' };

        const cooldownMs = Math.max(0, Number(cooldownSeconds) || 0) * 1000;
        if (cooldownMs > 0 && now - state.lastNotifiedAt < cooldownMs) {
            return { allowed: false, reason: 'cooldown' };
        }

        state.claims[eventKey] = { tabId, claimedAt: now };
        state.lastNotifiedAt = now;
        if (!writeState(state)) return { allowed: false, reason: 'storage-unavailable' };

        await wait(CLAIM_SETTLEMENT_DELAY_MS);
        const confirmed = readState(Date.now());
        const claim = confirmed.claims[eventKey];
        return claim?.tabId === tabId
            ? { allowed: true, reason: 'reserved' }
            : { allowed: false, reason: 'claimed-by-another-tab' };
    }

    return Object.freeze({
        tabId,
        async reserve(eventKey, { cooldownSeconds = 0 } = {}) {
            const normalizedEventKey = String(eventKey || '').trim();
            if (!normalizedEventKey) return { allowed: false, reason: 'invalid-event' };

            const now = Date.now();
            if (navigator.locks?.request) {
                try {
                    return await reserveWithWebLock(normalizedEventKey, cooldownSeconds, now);
                } catch (error) {
                    logger.warn?.('[PimpMyShoutbox Next] Web Locks unavailable; using sound claim settlement.', error);
                }
            }
            return reserveWithSettlement(normalizedEventKey, cooldownSeconds, now);
        }
    });
}
