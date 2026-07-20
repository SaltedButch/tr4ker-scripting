// ==UserScript==
// @name         torr9conf [legacy_deprecated]
// @namespace    https://github.com/SaltedButch/tr4ker-scripting
// @version      1.0.6
// @description  [legacy_deprecated] Ancien userscript Torr9 : cache les lignes +18 sur my-uploads et stats si want_porn = false
// @icon         https://torr9.net/favicon.ico?favicon.71918ed5.ico
// @match        https://torr9.net/*
// @grant        none
// @run-at       document-start
// @homepageURL  https://github.com/SaltedButch/tr4ker-scripting/blob/main/src/userscripts/torr9conf.user.js
// @supportURL   https://github.com/SaltedButch/tr4ker-scripting/issues
// @updateURL    https://raw.githubusercontent.com/SaltedButch/tr4ker-scripting/userscripts/torr9conf.meta.js
// @downloadURL  https://raw.githubusercontent.com/SaltedButch/tr4ker-scripting/userscripts/torr9conf.user.js
// ==/UserScript==
(function () {
    'use strict';

    let lastWantPorn;
    let toggleInProgress = false;
    const DEBUG_ENABLED = false;
    const DEBUG_PREFIX = '[torr9conf]';
    const lastDebugSnapshotByPage = new Map();
    let scheduledApplyFiltersTimer = null;
    let progressiveApplyFiltersToken = 0;
    let lastKnownUrl = window.location.href;

    /**
     * Lit et parse l'objet utilisateur stocké dans localStorage.user
     * Retourne null si la clé est absente ou invalide
     */
    function readUserObject() {
        try {
            const raw = localStorage.getItem('user');
            if (!raw) return null;
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    /**
     * Retourne la valeur booléenne de user.want_porn
     */
    function readWantPorn() {
        const user = readUserObject();
        return user?.want_porn;
    }

    /**
     * Retourne l'identifiant utilisateur depuis l'objet user
     */
    function readUserId() {
        const user = readUserObject();
        return user?.user_id || user?.id;
    }

    /**
     * Lit le token uniquement dans localStorage.token
     */
    function readAuthToken() {
        return localStorage.getItem('token');
    }

    /**
     * Ecrit un log de debug prefixe pour faciliter le suivi dans la console
     */
    function debugLog(...args) {
        if (!DEBUG_ENABLED) return;
        console.debug(DEBUG_PREFIX, ...args);
    }

    /**
     * Retourne un diagnostic des differentes etapes de selection des lignes
     */
    function getUploadRowsSelectorBreakdown() {
        if (isStatsPage()) {
            const statsCard = getStatsDetailCard();
            const rowsContainer = getStatsRowsContainer(statsCard);
            const rows = rowsContainer ? Array.from(rowsContainer.children) : [];
            const desktopRows = rows.filter((row) => row.querySelector('.hidden.md\\:grid.grid-cols-12'));
            const withCategory = desktopRows.filter((row) => !!getStatsRowCategory(row));

            return {
                statsCard: statsCard ? 1 : 0,
                rowsContainer: rowsContainer ? 1 : 0,
                candidateRows: rows.length,
                desktopRows: desktopRows.length,
                withCategory: withCategory.length
            };
        }

        const candidates = Array.from(document.querySelectorAll('div[class*="grid-cols-1"]'));
        const withGridColumns = candidates.filter((row) => String(row.className || '').includes('md:grid-cols-12'));
        const withTitle = withGridColumns.filter((row) => row.querySelector('p[title]'));
        const withActions = withTitle.filter((row) => {
            return Array.from(row.children).some((child) => {
                return String(child.className || '').includes('md:col-span-2')
                    && child.querySelector('button[title]');
            });
        });

        return {
            candidates: candidates.length,
            withGridColumns: withGridColumns.length,
            withTitle: withTitle.length,
            withActions: withActions.length
        };
    }

    /**
     * Retourne la page courante suivie par le script
     */
    function getUploadsPageKey() {
        if (isStatsPage()) return 'stats';
        if (isMyUploadsPage()) return 'my-uploads';
        return 'other';
    }

    /**
     * Bascule la valeur want_porn via l'API distante
     * puis resynchronise localStorage.user si nécessaire
     * et recharge la page après succès
     */
    async function toggleWantPornViaApi() {
        if (toggleInProgress) return;

        try {
            toggleInProgress = true;

            const userId = readUserId();
            const currentWantPorn = readWantPorn();
            const token = readAuthToken();

            if (!userId) return;
            if (typeof currentWantPorn !== 'boolean') return;
            if (!token) return;

            const nextWantPorn = !currentWantPorn;

            const response = await fetch(`https://api.torr9.net/api/v1/users/${userId}/want-porn`, {
                method: 'PATCH',
                headers: {
                    'Accept': '*/*',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'omit',
                body: JSON.stringify({
                    want_porn: nextWantPorn
                })
            });

            if (!response.ok) return;

            try {
                await response.json();
            } catch {
                // Certaines réponses peuvent être vides ou non JSON
            }

            const user = readUserObject();
            if (user) {
                user.want_porn = nextWantPorn;
                localStorage.setItem('user', JSON.stringify(user));
            }

            checkWantPorn();
            window.location.reload();
        } finally {
            toggleInProgress = false;
        }
    }

    /**
     * Détecte une catégorie adulte
     */
    function isAdultCategory(text) {
        if (!text) return false;
        const normalized = text.toLowerCase();
        return normalized.includes('+18') || normalized.includes('-18');
    }

    /**
     * Normalise une chaine pour les comparaisons textuelles
     */
    function normalizeText(value) {
        return String(value || '').trim().replace(/\s+/g, ' ');
    }

    /**
     * Met a jour le texte uniquement si necessaire
     */
    function setTextIfChanged(element, nextText) {
        if (!element) return;

        const normalizedNextText = String(nextText);
        if (element.textContent === normalizedNextText) return;
        element.textContent = normalizedNextText;
    }

    /**
     * Memorise le texte d'origine d'un element pour permettre sa restauration
     */
    function rememberOriginalText(element) {
        if (!element) return;
        if (element.dataset.tmTorr9confOriginalText !== undefined) return;
        element.dataset.tmTorr9confOriginalText = element.textContent || '';
    }

    /**
     * Restaure le texte d'origine d'un element si un snapshot existe
     */
    function restoreOriginalText(element) {
        if (!element) return;
        if (element.dataset.tmTorr9confOriginalText === undefined) return;
        setTextIfChanged(element, element.dataset.tmTorr9confOriginalText);
    }

    /**
     * Affiche explicitement une ligne du listing
     */
    function showUploadRow(row) {
        if (!row) return;
        row.style.removeProperty('display');
        delete row.dataset.tmTorr9confHidden;
    }

    /**
     * Masque explicitement une ligne du listing
     */
    function hideUploadRow(row) {
        if (!row) return;
        row.style.setProperty('display', 'none', 'important');
        row.dataset.tmTorr9confHidden = '1';
    }

    /**
     * Vérifie si la page courante est my-uploads
     */
    function isMyUploadsPage() {
        return window.location.pathname.includes('/my-uploads');
    }

    /**
     * Vérifie si la page courante est stats
     */
    function isStatsPage() {
        return window.location.pathname.includes('/stats');
    }

    /**
     * Le filtrage adulte est actif uniquement si want_porn === false
     */
    function shouldFilterAdult() {
        return readWantPorn() === false;
    }

    /**
     * Filtre les lignes +18 sur la page my-uploads
     */
    function filterMyUploads() {
        if (!isMyUploadsPage()) return;

        filterUploadsListing();
    }

    /**
     * Filtre les lignes +18 sur la page stats
     */
    function filterStats() {
        if (!isStatsPage()) return;

        filterUploadsListing();
    }

    /**
     * Applique le filtrage adulte au listing type my-uploads / stats
     */
    function filterUploadsListing() {
        const pageKey = getUploadsPageKey();
        const rows = getUploadRows();

        rows.forEach((row) => {
            showUploadRow(row);
        });

        const statsSummaryElements = collectStatsSummaryElements();
        rememberStatsSummaryElements(statsSummaryElements);

        if (!shouldFilterAdult()) {
            restoreStatsSummaryElements(statsSummaryElements);
            emitUploadDebugReport(pageKey, rows);
            return;
        }

        rows.forEach((row) => {
            if (isAdultCategory(getUploadRowCategory(row))) {
                hideUploadRow(row);
            }
        });

        updateStatsSummary(statsSummaryElements, rows.filter((row) => row.dataset.tmTorr9confHidden !== '1'));
        emitUploadDebugReport(pageKey, rows);
    }

    /**
     * Programme une nouvelle application des filtres une fois le DOM un peu stabilise
     */
    function scheduleApplyFilters(delay = 100) {
        if (scheduledApplyFiltersTimer !== null) {
            window.clearTimeout(scheduledApplyFiltersTimer);
        }

        scheduledApplyFiltersTimer = window.setTimeout(() => {
            scheduledApplyFiltersTimer = null;
            applyFilters();
        }, delay);
    }

    /**
     * Rejoue les filtres plusieurs fois apres une navigation ou un chargement progressif
     */
    function startProgressiveApplyFilters() {
        progressiveApplyFiltersToken += 1;
        const token = progressiveApplyFiltersToken;
        const delays = [0, 150, 400, 800, 1500, 3000, 5000, 8000];

        delays.forEach((delay) => {
            window.setTimeout(() => {
                if (token !== progressiveApplyFiltersToken) return;
                applyFilters();
            }, delay);
        });
    }

    /**
     * Retourne les lignes du listing type my-uploads / stats
     */
    function getUploadRows() {
        if (isStatsPage()) {
            return getStatsRows();
        }

        return getLegacyUploadRows();
    }

    /**
     * Retourne les lignes de l'ancien layout my-uploads
     */
    function getLegacyUploadRows() {
        return Array.from(document.querySelectorAll('div[class*="grid-cols-1"]'))
            .filter((row) => {
                if (!String(row.className || '').includes('md:grid-cols-12')) return false;
                if (!row.querySelector('p[title]')) return false;

                const actionsBlock = Array.from(row.children).find((child) => {
                    return String(child.className || '').includes('md:col-span-2')
                        && child.querySelector('button[title]');
                });

                return !!actionsBlock;
            });
    }

    /**
     * Retourne la carte principale "Detail par torrent" de la page stats
     */
    function getStatsDetailCard() {
        return Array.from(document.querySelectorAll('div.rounded-2xl.border'))
            .find((card) => normalizeText(card.querySelector('h2')?.textContent) === 'Détail par torrent');
    }

    /**
     * Retourne le conteneur des lignes dans la carte stats
     */
    function getStatsRowsContainer(card = getStatsDetailCard()) {
        if (!card) return null;

        return Array.from(card.children).find((child) => {
            return String(child.className || '').includes('divide-y')
                && String(child.className || '').includes('divide-zinc-800/40');
        }) || null;
    }

    /**
     * Retourne les lignes de la nouvelle page stats
     */
    function getStatsRows() {
        const rowsContainer = getStatsRowsContainer();
        if (!rowsContainer) return [];

        return Array.from(rowsContainer.children).filter((row) => {
            if (!String(row.className || '').includes('px-5')) return false;
            if (!row.querySelector('.hidden.md\\:grid.grid-cols-12')) return false;
            return !!getUploadRowTitle(row);
        });
    }

    /**
     * Retourne la categorie d'une ligne du listing
     */
    function getUploadRowCategory(row) {
        if (isStatsPage()) {
            return getStatsRowCategory(row);
        }

        return getLegacyUploadRowCategory(row);
    }

    /**
     * Retourne la categorie pour le layout legacy
     */
    function getLegacyUploadRowCategory(row) {
        const categoryCell = Array.from(row.children).find((child) => {
            const className = String(child.className || '');
            if (!className.includes('md:col-span-1')) return false;
            if (!className.includes('items-center')) return false;
            if (className.includes('justify-end')) return false;
            if (className.includes('justify-center')) return false;
            return !!child.querySelector('span');
        });

        const categorySpan = categoryCell?.querySelector('span');
        return normalizeText(categorySpan?.getAttribute('title') || categorySpan?.textContent || '');
    }

    /**
     * Retourne la categorie pour la nouvelle page stats
     */
    function getStatsRowCategory(row) {
        const desktopCategory = row.querySelector('.hidden.md\\:grid.grid-cols-12 .col-span-4 p.text-\\[10px\\]');
        if (desktopCategory) {
            return normalizeText(desktopCategory.textContent || '');
        }

        const mobileTexts = Array.from(row.querySelectorAll('.md\\:hidden .text-xs, .md\\:hidden .text-\\[10px\\], .md\\:hidden p'));
        const mobileCategory = mobileTexts.find((element) => isAdultCategory(normalizeText(element.textContent)));
        return normalizeText(mobileCategory?.textContent || '');
    }

    /**
     * Retourne le titre d'une ligne du listing
     */
    function getUploadRowTitle(row) {
        if (isStatsPage()) {
            const desktopTitle = row.querySelector('.hidden.md\\:grid.grid-cols-12 .col-span-4 p.text-sm');
            if (desktopTitle) return normalizeText(desktopTitle.textContent || '');

            const mobileTitle = row.querySelector('.md\\:hidden p.text-sm');
            return normalizeText(mobileTitle?.textContent || '');
        }

        const titleElement = row.querySelector('p[title]');
        return normalizeText(titleElement?.getAttribute('title') || titleElement?.textContent || '');
    }

    /**
     * Retourne le statut d'une ligne du listing
     */
    function getUploadRowStatus(row) {
        const statusSpan = row.querySelector('.md\\:hidden.flex.items-center.gap-2 > span');
        const normalizedStatus = normalizeText(statusSpan?.textContent || '').toLowerCase();

        if (normalizedStatus.includes('rejet')) return 'rejected';
        if (normalizedStatus.includes('attente')) return 'pending';
        if (normalizedStatus.includes('actif')) return 'active';

        return 'unknown';
    }

    /**
     * Repere les blocs de synthese a maintenir coherents sur la page stats
     */
    function collectStatsSummaryElements() {
        if (isStatsPage()) {
            const statsCard = getStatsDetailCard();
            const header = statsCard?.firstElementChild || null;
            const headerCount = header?.querySelector('span.text-xs') || null;
            const footerCount = Array.from(statsCard?.querySelectorAll('p') || [])
                .find((element) => /entrées/i.test(normalizeText(element.textContent)));

            return {
                mode: 'stats-detail',
                statsRoot: statsCard,
                headerCount,
                footerCount
            };
        }

        const statsRoot = Array.from(document.querySelectorAll('div.container.mx-auto.px-4.max-w-6xl'))
            .find((container) => normalizeText(container.querySelector('h1')?.textContent) === 'Mes Uploads');

        if (!statsRoot) {
            return {
                mode: 'legacy',
                statsRoot: null,
                subtitle: null,
                resultCount: null,
                activeBadgeCount: null,
                pendingBadgeCount: null,
                rejectedBadgeCount: null,
                activeTabButton: null,
                pendingTabButton: null,
                rejectedTabButton: null
            };
        }

        const subtitle = Array.from(statsRoot.querySelectorAll('p'))
            .find((element) => /torrents/i.test(normalizeText(element.textContent)));
        const resultCount = Array.from(statsRoot.querySelectorAll('p'))
            .find((element) => /resultats/i.test(normalizeText(element.textContent)));

        const badgeDivs = Array.from(statsRoot.querySelectorAll('div.px-3.py-1\\.5'));
        const activeBadgeCount = badgeDivs.find((element) => /actifs/i.test(normalizeText(element.textContent)))
            ?.querySelector('span');
        const pendingBadgeCount = badgeDivs.find((element) => /attente/i.test(normalizeText(element.textContent)))
            ?.querySelector('span');
        const rejectedBadgeCount = badgeDivs.find((element) => /rejet/i.test(normalizeText(element.textContent)))
            ?.querySelector('span');

        const tabButtons = Array.from(statsRoot.querySelectorAll('button'));
        const activeTabButton = tabButtons.find((element) => /^Actifs?\s*\(/i.test(normalizeText(element.textContent)));
        const pendingTabButton = tabButtons.find((element) => /^En attente\s*\(/i.test(normalizeText(element.textContent)));
        const rejectedTabButton = tabButtons.find((element) => /^Rejet(?:és|es?)\s*\(/i.test(normalizeText(element.textContent)));

        return {
            mode: 'legacy',
            statsRoot,
            subtitle,
            resultCount,
            activeBadgeCount,
            pendingBadgeCount,
            rejectedBadgeCount,
            activeTabButton,
            pendingTabButton,
            rejectedTabButton
        };
    }

    /**
     * Capture les textes d'origine des blocs de synthese
     */
    function rememberStatsSummaryElements(elements) {
        if (!elements?.statsRoot) return;

        if (elements.mode === 'stats-detail') {
            rememberOriginalText(elements.headerCount);
            rememberOriginalText(elements.footerCount);
            return;
        }

        rememberOriginalText(elements.subtitle);
        rememberOriginalText(elements.resultCount);
        rememberOriginalText(elements.activeBadgeCount);
        rememberOriginalText(elements.pendingBadgeCount);
        rememberOriginalText(elements.rejectedBadgeCount);
        rememberOriginalText(elements.activeTabButton);
        rememberOriginalText(elements.pendingTabButton);
        rememberOriginalText(elements.rejectedTabButton);
    }

    /**
     * Restaure les textes d'origine quand le filtre adulte est desactive
     */
    function restoreStatsSummaryElements(elements) {
        if (!elements?.statsRoot) return;

        if (elements.mode === 'stats-detail') {
            restoreOriginalText(elements.headerCount);
            restoreOriginalText(elements.footerCount);
            return;
        }

        restoreOriginalText(elements.subtitle);
        restoreOriginalText(elements.resultCount);
        restoreOriginalText(elements.activeBadgeCount);
        restoreOriginalText(elements.pendingBadgeCount);
        restoreOriginalText(elements.rejectedBadgeCount);
        restoreOriginalText(elements.activeTabButton);
        restoreOriginalText(elements.pendingTabButton);
        restoreOriginalText(elements.rejectedTabButton);
    }

    /**
     * Recalcule les compteurs visibles de la page stats filtree
     */
    function updateStatsSummary(elements, visibleRows) {
        if (!elements?.statsRoot) return;

        if (elements.mode === 'stats-detail') {
            const total = visibleRows.length;
            setTextIfChanged(elements.headerCount, `${total} entrées`);

            if (elements.footerCount) {
                const originalText = elements.footerCount.dataset.tmTorr9confOriginalText || elements.footerCount.textContent || '';
                const nextText = originalText.replace(/(\u00b7\s*)\d+\s+entrées/i, `$1${total} entrées`);
                setTextIfChanged(elements.footerCount, nextText);
            }

            return;
        }

        const summary = {
            total: visibleRows.length,
            active: 0,
            pending: 0,
            rejected: 0
        };

        visibleRows.forEach((row) => {
            const status = getUploadRowStatus(row);
            if (status === 'active') summary.active += 1;
            if (status === 'pending') summary.pending += 1;
            if (status === 'rejected') summary.rejected += 1;
        });

        setTextIfChanged(elements.subtitle, `${summary.total} torrents affiches`);
        setTextIfChanged(elements.resultCount, `${summary.total} resultats affiches`);
        setTextIfChanged(elements.activeBadgeCount, String(summary.active));
        setTextIfChanged(elements.pendingBadgeCount, String(summary.pending));
        setTextIfChanged(elements.rejectedBadgeCount, String(summary.rejected));
        setTextIfChanged(elements.activeTabButton, `Actifs (${summary.active})`);
        setTextIfChanged(elements.pendingTabButton, `En attente (${summary.pending})`);
        setTextIfChanged(elements.rejectedTabButton, `Rejetés (${summary.rejected})`);
    }

    /**
     * Construit un rapport de debug pour une ligne du listing
     */
    function buildUploadRowDebugInfo(row, index) {
        const statusSpan = row.querySelector('.md\\:hidden.flex.items-center.gap-2 > span');

        return {
            index,
            title: getUploadRowTitle(row),
            category: getUploadRowCategory(row),
            status: normalizeText(statusSpan?.textContent || ''),
            hidden: row.dataset.tmTorr9confHidden === '1',
            display: row.style.display || '(default)'
        };
    }

    /**
     * Emet un rapport de debug dans la console quand l'etat detecte change
     */
    function emitUploadDebugReport(pageKey, rows) {
        if (!DEBUG_ENABLED) return;
        if (pageKey === 'other') return;

        const details = rows.map((row, index) => buildUploadRowDebugInfo(row, index));
        const selectorBreakdown = getUploadRowsSelectorBreakdown();
        const summary = {
            page: pageKey,
            wantPorn: readWantPorn(),
            totalRows: details.length,
            hiddenRows: details.filter((row) => row.hidden).length,
            adultRows: details.filter((row) => isAdultCategory(row.category)).length,
            rowsWithoutCategory: details.filter((row) => !row.category).length,
            selectorBreakdown
        };

        const signature = JSON.stringify({
            wantPorn: summary.wantPorn,
            totalRows: summary.totalRows,
            hiddenRows: summary.hiddenRows,
            adultRows: summary.adultRows,
            rowsWithoutCategory: summary.rowsWithoutCategory,
            categories: details.map((row) => `${row.hidden ? '1' : '0'}:${row.category}:${row.title}`).slice(0, 50)
        });

        if (lastDebugSnapshotByPage.get(pageKey) === signature) return;
        lastDebugSnapshotByPage.set(pageKey, signature);

        console.groupCollapsed(
            `${DEBUG_PREFIX} ${pageKey} debug total=${summary.totalRows} hidden=${summary.hiddenRows} adult=${summary.adultRows}`
        );
        debugLog('summary', summary);
        console.table(details);
        console.groupEnd();
    }

    /**
     * Applique tous les filtres nécessaires selon la page courante
     */
    function applyFilters() {
        filterMyUploads();
        filterStats();
    }

    /**
     * Réagit à un changement de want_porn
     */
    function onWantPornChange() {
        applyFilters();
    }

    /**
     * Compare la valeur actuelle à la dernière valeur connue
     * pour détecter les changements
     */
    function checkWantPorn() {
        const currentValue = readWantPorn();

        if (currentValue !== lastWantPorn) {
            lastWantPorn = currentValue;
            onWantPornChange();
        } else {
            applyFilters();
        }
    }

    /**
     * Observe les changements du DOM pour réappliquer les filtres
     * si le site recharge dynamiquement le contenu
     */
    function initObserver() {
        const observer = new MutationObserver(() => {
            const currentUrl = window.location.href;
            if (currentUrl !== lastKnownUrl) {
                lastKnownUrl = currentUrl;
                startProgressiveApplyFilters();
                return;
            }

            scheduleApplyFilters(120);
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Initialise le raccourci clavier Ctrl + Alt + P
     * pour basculer want_porn via l'API
     */
    function initShortcut() {
        window.addEventListener('keydown', function (event) {
            const isP = event.key.toLowerCase() === 'p';

            if (event.ctrlKey && event.altKey && isP) {
                event.preventDefault();
                toggleWantPornViaApi();
            }
        });
    }

    /**
     * Observe les changements d'URL pour les navigations SPA
     */
    function initNavigationHooks() {
        const originalPushState = history.pushState;
        history.pushState = function () {
            const result = originalPushState.apply(this, arguments);
            if (window.location.href !== lastKnownUrl) {
                lastKnownUrl = window.location.href;
                startProgressiveApplyFilters();
            }
            return result;
        };

        const originalReplaceState = history.replaceState;
        history.replaceState = function () {
            const result = originalReplaceState.apply(this, arguments);
            if (window.location.href !== lastKnownUrl) {
                lastKnownUrl = window.location.href;
                startProgressiveApplyFilters();
            }
            return result;
        };

        window.addEventListener('popstate', () => {
            if (window.location.href !== lastKnownUrl) {
                lastKnownUrl = window.location.href;
                startProgressiveApplyFilters();
            }
        });

        window.addEventListener('pageshow', () => {
            startProgressiveApplyFilters();
        });

        window.addEventListener('load', () => {
            startProgressiveApplyFilters();
        });
    }

    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
        const result = originalSetItem.apply(this, arguments);

        if (this === localStorage && key === 'user') {
            checkWantPorn();
        }

        return result;
    };

    const originalRemoveItem = Storage.prototype.removeItem;
    Storage.prototype.removeItem = function (key) {
        const result = originalRemoveItem.apply(this, arguments);

        if (this === localStorage && key === 'user') {
            checkWantPorn();
        }

        return result;
    };

    const originalClear = Storage.prototype.clear;
    Storage.prototype.clear = function () {
        const result = originalClear.apply(this, arguments);
        checkWantPorn();
        return result;
    };

    window.addEventListener('storage', function (event) {
        if (event.storageArea === localStorage && event.key === 'user') {
            checkWantPorn();
        }
    });

    window.addEventListener('DOMContentLoaded', () => {
        lastWantPorn = readWantPorn();
        lastKnownUrl = window.location.href;
        startProgressiveApplyFilters();
        initObserver();
        initShortcut();
        initNavigationHooks();
    });

    setInterval(() => {
        if (window.location.href !== lastKnownUrl) {
            lastKnownUrl = window.location.href;
            startProgressiveApplyFilters();
            return;
        }

        scheduleApplyFilters(0);
    }, 1000);
})();
