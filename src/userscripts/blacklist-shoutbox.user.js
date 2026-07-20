// ==UserScript==
// @name         Tr4ker Chat - Shoutbox 3.0
// @namespace    http://tampermonkey.net/
// @version      3.0.32
// @description  Blacklist, mise en avant, mentions, réponses rapides contextuelles, GIF et confort avancé pour le chat Tr4ker
// @author       Butchered
// @match        https://tr4ker.net/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addElement
// @connect      api.klipy.com
// @connect      api.imgbb.com
// @connect      ibb.co
// @connect      www.youtube.com
// @connect      youtube.com
// @connect      *
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY_USERS = 'tm_hidden_shout_users_t4';
    const TR4KER_HOSTNAME = 'tr4ker.net';
    const TR4KER_CHAT_INPUT_SELECTOR = 'textarea[placeholder^="Message dans"]';
    const TR4KER_MESSAGE_SELECTOR = '[data-msg-id]';
    const TR4KER_MESSAGE_ROOT_SELECTOR = '[class*="messageList"]';
    const STORAGE_KEY_POS_HOME = 'tm_t4_stats_box_position_home';
    const STORAGE_KEY_POS_CHAT = 'tm_t4_stats_box_position_chat';
    const STORAGE_KEY_SIZE_HOME = 'tm_t4_stats_box_size_home';
    const STORAGE_KEY_SIZE_CHAT = 'tm_t4_stats_box_size_chat';
    const STORAGE_KEY_STATS_COLLAPSED_HOME = 'tm_t4_stats_box_collapsed_home';
    const STORAGE_KEY_STATS_COLLAPSED_CHAT = 'tm_t4_stats_box_collapsed_chat';
    const STORAGE_KEY_STATS_HIDDEN_HOME = 'tm_t4_stats_box_hidden_home';
    const STORAGE_KEY_STATS_HIDDEN_CHAT = 'tm_t4_stats_box_hidden_chat';
    const STORAGE_KEY_DEBUG = 'tm_t4_debug_mode';
    const STORAGE_KEY_HOME_COLLAPSED = 'tm_t4_home_chat_collapsed';
    const STORAGE_KEY_HIGHLIGHTED_USERS = 'tm_highlighted_shout_users_t4';
    const STORAGE_KEY_MENTION_SETTINGS = 'tm_t4_mention_highlight_settings';
    const STORAGE_KEY_LAST_MENTION_SOUND_NOTIFICATION = 'tm_t4_last_mention_sound_notification';
    const STORAGE_KEY_RECENT_MENTION_SOUND_NOTIFICATIONS = 'tm_t4_recent_mention_sound_notifications';
    const STORAGE_KEY_CHAT_FONT_SCALE = 'tm_t4_chat_font_scale';
    const STORAGE_KEY_CHAT_SCROLLBAR_ENABLED = 'tm_t4_chat_scrollbar_enabled';
    const STORAGE_KEY_MESSAGE_ACTIONS_LEFT_ENABLED = 'tm_t4_message_actions_left_enabled';
    const STORAGE_KEY_LINKIFY_URLS = 'tm_t4_linkify_urls';
    const STORAGE_KEY_EMBED_URL_IMAGES = 'tm_t4_embed_url_images';
    const STORAGE_KEY_SAVED_PHRASES = 'tm_t4_saved_phrases';
    const STORAGE_KEY_SAVED_PHRASES_ENABLED = 'tm_t4_saved_phrases_enabled';
    const STORAGE_KEY_SAVED_PHRASES_REPLACE_INPUT = 'tm_t4_saved_phrases_replace_input';
    const STORAGE_KEY_KLIPY_GIFS_ENABLED = 'tm_t4_klipy_gifs_enabled';
    const STORAGE_KEY_EMOJI_USAGE_COUNTS = 'tm_t4_emoji_usage_counts';
    const STORAGE_KEY_REACTION_USAGE_COUNTS = 'tm_t4_reaction_usage_counts';
    const STORAGE_KEY_EMOJI_QUICK_ACCESS_LIMIT = 'tm_t4_emoji_quick_access_limit';
    const STORAGE_KEY_REACTION_QUICK_ACCESS_LIMIT = 'tm_t4_reaction_quick_access_limit';
    const STORAGE_KEY_QUICK_ACCESS_MODE = 'tm_t4_quick_access_mode';
    const STORAGE_KEY_MANUAL_EMOJI_FAVORITES = 'tm_t4_manual_emoji_favorites';
    const STORAGE_KEY_MANUAL_REACTION_FAVORITES = 'tm_t4_manual_reaction_favorites';
    const STORAGE_KEY_CHAT_INPUT_TOOLBAR_INLINE = 'tm_t4_chat_input_toolbar_inline';
    const STORAGE_KEY_CHAT_INPUT_TOOLBAR_ALIGN_RIGHT = 'tm_t4_chat_input_toolbar_align_right';
    const STORAGE_KEY_IMAGE_HOSTING_ENABLED = 'tm_t4_image_hosting_enabled';
    const STORAGE_KEY_IMGBB_API_KEY = 'tm_t4_imgbb_api_key';
    const STORAGE_KEY_IMAGE_HOSTING_EXPIRATION_SECONDS = 'tm_t4_image_hosting_expiration_seconds';
    const STORAGE_KEY_IMAGE_CATALOG = 'tm_t4_image_catalog';
    const STORAGE_KEY_AFK_STATE = 'tm_t4_afk_state';
    const STORAGE_KEY_AFK_ACTIVITY = 'tm_t4_afk_activity';
    const STORAGE_KEY_AFK_PANEL_POSITION = 'tm_t4_afk_panel_position';
    const STORAGE_KEY_AFK_PANEL_HIDDEN = 'tm_t4_afk_panel_hidden';
    const SESSION_STORAGE_KEY_AFK_TAB_ID = 'tm_t4_afk_tab_id';
    const STORAGE_KEY_MIGRATION_DONE = 'tm_t4_storage_migration_v1';
    const STORAGE_KEYS_TO_MIGRATE = [
        STORAGE_KEY_USERS,
        STORAGE_KEY_POS_HOME,
        STORAGE_KEY_POS_CHAT,
        STORAGE_KEY_SIZE_HOME,
        STORAGE_KEY_SIZE_CHAT,
        STORAGE_KEY_STATS_COLLAPSED_HOME,
        STORAGE_KEY_STATS_COLLAPSED_CHAT,
        STORAGE_KEY_STATS_HIDDEN_HOME,
        STORAGE_KEY_STATS_HIDDEN_CHAT,
        STORAGE_KEY_DEBUG,
        STORAGE_KEY_HOME_COLLAPSED,
        STORAGE_KEY_HIGHLIGHTED_USERS,
        STORAGE_KEY_MENTION_SETTINGS,
        STORAGE_KEY_LAST_MENTION_SOUND_NOTIFICATION,
        STORAGE_KEY_RECENT_MENTION_SOUND_NOTIFICATIONS,
        STORAGE_KEY_CHAT_FONT_SCALE,
        STORAGE_KEY_CHAT_SCROLLBAR_ENABLED,
        STORAGE_KEY_MESSAGE_ACTIONS_LEFT_ENABLED,
        STORAGE_KEY_LINKIFY_URLS,
        STORAGE_KEY_EMBED_URL_IMAGES,
        STORAGE_KEY_SAVED_PHRASES,
        STORAGE_KEY_SAVED_PHRASES_ENABLED,
        STORAGE_KEY_SAVED_PHRASES_REPLACE_INPUT,
        STORAGE_KEY_KLIPY_GIFS_ENABLED,
        STORAGE_KEY_EMOJI_USAGE_COUNTS,
        STORAGE_KEY_REACTION_USAGE_COUNTS,
        STORAGE_KEY_EMOJI_QUICK_ACCESS_LIMIT,
        STORAGE_KEY_REACTION_QUICK_ACCESS_LIMIT,
        STORAGE_KEY_QUICK_ACCESS_MODE,
        STORAGE_KEY_MANUAL_EMOJI_FAVORITES,
        STORAGE_KEY_MANUAL_REACTION_FAVORITES,
        STORAGE_KEY_CHAT_INPUT_TOOLBAR_INLINE,
        STORAGE_KEY_CHAT_INPUT_TOOLBAR_ALIGN_RIGHT,
        STORAGE_KEY_IMAGE_HOSTING_ENABLED,
        STORAGE_KEY_IMGBB_API_KEY,
        STORAGE_KEY_IMAGE_HOSTING_EXPIRATION_SECONDS,
        STORAGE_KEY_IMAGE_CATALOG,
        STORAGE_KEY_AFK_STATE,
        STORAGE_KEY_AFK_ACTIVITY,
        STORAGE_KEY_AFK_PANEL_POSITION,
        STORAGE_KEY_AFK_PANEL_HIDDEN
    ];

    /**
     * Migre une seule fois les réglages enregistrés sous les anciennes clés
     * Torr9 vers les clés Tr4ker `t4`, puis nettoie les anciennes entrées.
     */
    function migrateLegacyStorageKeys() {
        try {
            if (localStorage.getItem(STORAGE_KEY_MIGRATION_DONE) === '1') return;

            STORAGE_KEYS_TO_MIGRATE.forEach((newKey) => {
                const legacyKey = newKey.replace(/t4/g, 'torr9');
                if (legacyKey === newKey) return;

                const currentValue = localStorage.getItem(newKey);
                const legacyValue = localStorage.getItem(legacyKey);

                if (currentValue === null && legacyValue !== null) {
                    localStorage.setItem(newKey, legacyValue);
                }

                if (localStorage.getItem(newKey) !== null) {
                    localStorage.removeItem(legacyKey);
                }
            });

            const legacySessionKey = SESSION_STORAGE_KEY_AFK_TAB_ID.replace(/t4/g, 'torr9');
            const currentSessionValue = sessionStorage.getItem(SESSION_STORAGE_KEY_AFK_TAB_ID);
            const legacySessionValue = sessionStorage.getItem(legacySessionKey);
            if (currentSessionValue === null && legacySessionValue !== null) {
                sessionStorage.setItem(SESSION_STORAGE_KEY_AFK_TAB_ID, legacySessionValue);
            }
            if (sessionStorage.getItem(SESSION_STORAGE_KEY_AFK_TAB_ID) !== null) {
                sessionStorage.removeItem(legacySessionKey);
            }

            localStorage.setItem(STORAGE_KEY_MIGRATION_DONE, '1');
        } catch (error) {
            console.warn('[Tr4ker Chat] Migration des réglages impossible.', error);
        }
    }

    migrateLegacyStorageKeys();

    // Option retirée : le footer historique n'existe plus sur Tr4ker.
    try {
        localStorage.removeItem('tm_t4_hide_chat_footer_enabled');
        localStorage.removeItem('tm_torr9_hide_chat_footer_enabled');
    } catch (error) {
        // Le script reste fonctionnel lorsque le stockage est indisponible.
    }

    /**
     * Effectue une requête externe hors du contexte réseau de la page.
     * Tr4ker applique une CSP qui bloque les fetch cross-origin du userscript;
     * GM_xmlhttpRequest passe par le canal réseau autorisé par Tampermonkey.
     */
    function requestExternal(url, options = {}) {
        const requestFunction = typeof GM_xmlhttpRequest === 'function'
            ? GM_xmlhttpRequest
            : null;

        if (!requestFunction) {
            return Promise.reject(new Error('GM_xmlhttpRequest est indisponible. Réinstalle le userscript avec Tampermonkey.'));
        }

        const method = String(options.method || 'GET').toUpperCase();
        const headers = options.headers && typeof options.headers === 'object'
            ? options.headers
            : {};

        return new Promise((resolve, reject) => {
            requestFunction({
                method,
                url: String(url || ''),
                headers,
                data: options.body,
                timeout: Math.max(0, Number(options.timeout) || 30000),
                responseType: String(options.responseType || 'text'),
                anonymous: options.credentials === 'omit',
                onload(response) {
                    const status = Math.max(0, Number(response?.status) || 0);
                    const rawResponse = response?.responseText ?? response?.response ?? '';
                    const responseText = typeof rawResponse === 'string' ? rawResponse : '';
                    const normalizedResponse = {
                        status,
                        ok: status >= 200 && status < 300,
                        type: 'basic',
                        responseHeaders: String(response?.responseHeaders || ''),
                        responseText,
                        text: async () => responseText,
                        json: async () => JSON.parse(responseText)
                    };
                    normalizedResponse.clone = () => normalizedResponse;
                    resolve(normalizedResponse);
                },
                onerror(response) {
                    reject(new Error(`Requête externe impossible (HTTP ${response?.status || 0}).`));
                },
                ontimeout() {
                    reject(new Error('Requête externe expirée.'));
                },
                onabort() {
                    reject(new Error('Requête externe annulée.'));
                }
            });
        });
    }

    function requestExternalArrayBuffer(url, options = {}) {
        const requestFunction = typeof GM_xmlhttpRequest === 'function'
            ? GM_xmlhttpRequest
            : null;

        if (!requestFunction) {
            return Promise.reject(new Error('GM_xmlhttpRequest est indisponible. Réinstalle le userscript avec Tampermonkey.'));
        }

        const method = String(options.method || 'GET').toUpperCase();
        const headers = options.headers && typeof options.headers === 'object'
            ? options.headers
            : {};

        return new Promise((resolve, reject) => {
            requestFunction({
                method,
                url: String(url || ''),
                headers,
                data: options.body,
                timeout: Math.max(0, Number(options.timeout) || 30000),
                responseType: 'arraybuffer',
                anonymous: options.credentials === 'omit',
                onload(response) {
                    const status = Math.max(0, Number(response?.status) || 0);
                    const audioData = response?.response;
                    if (status < 200 || status >= 300 || !(audioData instanceof ArrayBuffer)) {
                        reject(new Error(`Téléchargement audio impossible (HTTP ${status}).`));
                        return;
                    }
                    resolve(audioData);
                },
                onerror(response) {
                    reject(new Error(`Téléchargement audio impossible (HTTP ${response?.status || 0}).`));
                },
                ontimeout() {
                    reject(new Error('Téléchargement audio expiré.'));
                },
                onabort() {
                    reject(new Error('Téléchargement audio annulé.'));
                }
            });
        });
    }

    const SCRIPT_CONFIG_EXPORT_VERSION = 1;
    const SCRIPT_CONFIG_STORAGE_KEYS = [
        STORAGE_KEY_USERS,
        STORAGE_KEY_POS_HOME,
        STORAGE_KEY_POS_CHAT,
        STORAGE_KEY_SIZE_HOME,
        STORAGE_KEY_SIZE_CHAT,
        STORAGE_KEY_STATS_COLLAPSED_HOME,
        STORAGE_KEY_STATS_COLLAPSED_CHAT,
        STORAGE_KEY_STATS_HIDDEN_HOME,
        STORAGE_KEY_STATS_HIDDEN_CHAT,
        STORAGE_KEY_DEBUG,
        STORAGE_KEY_HOME_COLLAPSED,
        STORAGE_KEY_HIGHLIGHTED_USERS,
        STORAGE_KEY_MENTION_SETTINGS,
        STORAGE_KEY_CHAT_FONT_SCALE,
        STORAGE_KEY_CHAT_SCROLLBAR_ENABLED,
        STORAGE_KEY_MESSAGE_ACTIONS_LEFT_ENABLED,
        STORAGE_KEY_LINKIFY_URLS,
        STORAGE_KEY_EMBED_URL_IMAGES,
        STORAGE_KEY_SAVED_PHRASES,
        STORAGE_KEY_SAVED_PHRASES_ENABLED,
        STORAGE_KEY_SAVED_PHRASES_REPLACE_INPUT,
        STORAGE_KEY_KLIPY_GIFS_ENABLED,
        STORAGE_KEY_EMOJI_USAGE_COUNTS,
        STORAGE_KEY_REACTION_USAGE_COUNTS,
        STORAGE_KEY_EMOJI_QUICK_ACCESS_LIMIT,
        STORAGE_KEY_REACTION_QUICK_ACCESS_LIMIT,
        STORAGE_KEY_QUICK_ACCESS_MODE,
        STORAGE_KEY_MANUAL_EMOJI_FAVORITES,
        STORAGE_KEY_MANUAL_REACTION_FAVORITES,
        STORAGE_KEY_CHAT_INPUT_TOOLBAR_INLINE,
        STORAGE_KEY_CHAT_INPUT_TOOLBAR_ALIGN_RIGHT,
        STORAGE_KEY_IMAGE_HOSTING_ENABLED,
        STORAGE_KEY_IMAGE_HOSTING_EXPIRATION_SECONDS,
        STORAGE_KEY_AFK_PANEL_POSITION
    ];
    const PANEL_ID = 'tm-torr9-chat-stats';
    const MODAL_ID = 'tm-torr9-chat-modal';
    const OVERLAY_ID = 'tm-torr9-chat-overlay';
    const TOAST_ID = 'tm-torr9-chat-toast';
    const IMAGE_PREVIEW_ID = 'tm-torr9-image-preview';
    const IMAGE_VIEWER_MODAL_ID = 'tm-torr9-image-viewer-modal';
    const IMAGE_VIEWER_OVERLAY_ID = 'tm-torr9-image-viewer-overlay';
    const IMAGE_CATALOG_DELETE_CONFIRMATION_ID = 'tm-t4-image-catalog-delete-confirmation';
    const YOUTUBE_PLAYER_ID = 'tm-torr9-youtube-player';
    const AFK_PANEL_ID = 'tm-torr9-afk-panel';
    const HOME_COLLAPSE_BUTTON_ID = 'tm-home-chat-collapse-toggle';
    const PHRASES_MENU_WRAPPER_ID = 'tm-torr9-phrases-menu-wrapper';
    const GIF_MENU_WRAPPER_ID = 'tm-torr9-klipy-gif-wrapper';
    const IMAGE_UPLOAD_MENU_WRAPPER_ID = 'tm-torr9-image-upload-wrapper';
    const EMOJI_QUICK_ACCESS_WRAPPER_ID = 'tm-torr9-emoji-quick-access-wrapper';
    const MODAL_SCROLLBAR_STYLE_ID = 'tm-torr9-modal-scrollbar-style';
    const CHAT_SCROLLBAR_STYLE_ID = 'tm-torr9-chat-scrollbar-style';
    const DEFAULT_YOUTUBE_PLAYER_TITLE = 'Player YouTube';
    const DEFAULT_YOUTUBE_PLAYER_WIDTH_PX = 420;
    const DEFAULT_YOUTUBE_PLAYER_HEIGHT_PX = 260;
    const MINIMIZED_YOUTUBE_PLAYER_WIDTH_PX = 260;
    const DEFAULT_AFK_AUTO_REPLY_MESSAGE = 'Je suis AFK quelques minutes, je reviens rapidement.';
    const DEFAULT_HIGHLIGHT_COLOR = '#f59e0b';
    const DEFAULT_HIGHLIGHT_OPACITY = 14;
    const DEFAULT_MENTION_COLOR = '#22c55e';
    const DEFAULT_MENTION_OPACITY = 18;
    const DEFAULT_MENTION_BLINK_SECONDS = 6;
    const DEFAULT_MENTION_KEEP_HIGHLIGHT = true;
    const DEFAULT_MENTION_INCLUDE_REPLY_CONTEXT = false;
    const DEFAULT_MENTION_SOUND_ENABLED = false;
    const DEFAULT_MENTION_SOUND_SCOPE = 'off';
    const DEFAULT_MENTION_SOUND_STYLE = 'ping';
    const DEFAULT_MENTION_SOUND_CUSTOM_URL = '';
    const DEFAULT_MENTION_SOUND_COOLDOWN_SECONDS = 8;
    const ALLOWED_CHAT_CHANNELS = new Set(['general', 'aide', 'bug report', 'bug reports']);
    const DEFAULT_CHAT_FONT_SCALE = 1;
    const MIN_CHAT_FONT_SCALE = 0.85;
    const MAX_CHAT_FONT_SCALE = 1.7;
    const DEFAULT_CHAT_SCROLLBAR_THICKNESS = 18;
    const DEFAULT_CHAT_SCROLLBAR_THUMB_BORDER = 4;
    const STATS_DISPLAY_MODE_EXPANDED = 'expanded';
    const STATS_DISPLAY_MODE_COMPACT = 'compact';
    const STATS_DISPLAY_MODE_MINI = 'mini';
    const MAX_STATS_RIGHT_PERCENT = 100;
    const MAX_STATS_BOTTOM_PERCENT = 95;
    const MAX_RECENT_MENTION_SOUND_RECORDS = 40;
    const MAX_AFK_READ_ACTIVITY_RECORDS = 50;
    const MAX_AFK_AUTO_REPLY_MESSAGE_LENGTH = 300;
    const MAX_SAVED_PHRASE_LENGTH = 1000;
    const MAX_VISIBLE_SAVED_PHRASES_IN_MENU = 5;
    const SAVED_PHRASES_EXPORT_VERSION = 1;
    const SAVED_PHRASES_REPLY_CONTEXT_MAX_AGE_MS = 5 * 60 * 1000;
    const DEFAULT_KLIPY_GIFS_ENABLED = true;
    const KLIPY_API_BASE_URL = 'https://api.klipy.com/v2';
    // Test key provided locally for development. Replace it before any public rollout.
    const KLIPY_API_KEY = 'msjEFIejxUS9DvPCk5NAvbnF4HK1hfVEz8zpgFAoo5kpjkSGGIqIJYJ4WGx2cRhJ';
    const KLIPY_CLIENT_KEY = 'tr4ker-shoutbox-userscript';
    const KLIPY_MAX_RESULTS_PER_PAGE = 10;
    const KLIPY_SEARCH_MIN_LENGTH = 2;
    const KLIPY_SEARCH_DEBOUNCE_MS = 280;
    const KLIPY_CACHE_MAX_ENTRIES = 24;
    const LONG_PRESS_REACTION_DELAY_MS = 420;
    const LONG_PRESS_REACTION_MOVE_THRESHOLD_PX = 10;
    const LONG_PRESS_REACTION_PICKER_OFFSET_X = 18;
    const LONG_PRESS_REACTION_PICKER_OFFSET_Y = 0;
    const REACTION_PICKER_Z_INDEX = 320;
    const REACTION_USAGE_DUPLICATE_WINDOW_MS = 700;
    const NATIVE_PICKER_CONTEXT_TIMEOUT_MS = 90 * 1000;
    const IMGBB_API_KEY_URL = 'https://api.imgbb.com/';
    const IMGBB_UPLOAD_ENDPOINT = 'https://api.imgbb.com/1/upload';
    const IMGBB_DELETE_ENDPOINT = 'https://ibb.co/json';
    const IMAGE_UPLOAD_MAX_BYTES = 32 * 1024 * 1024;
    const IMAGE_CATALOG_MAX_RECORDS = 120;
    const IMAGE_URL_VALIDATION_TIMEOUT_MS = 9000;
    const IMAGE_DELETE_VERIFICATION_ATTEMPTS = 6;
    const IMAGE_DELETE_VERIFICATION_DELAY_MS = 1200;
    const IMAGE_HOSTING_EXPIRATION_VALUES = new Set([0, 600, 3600, 86400, 604800, 2592000, 15552000]);
    const DEFAULT_IMAGE_HOSTING_EXPIRATION_SECONDS = 0;
    const DEFAULT_EMOJI_QUICK_ACCESS_LIMIT = 5;
    const DEFAULT_REACTION_QUICK_ACCESS_LIMIT = 5;
    const QUICK_ACCESS_MODE_AUTO = 'auto';
    const QUICK_ACCESS_MODE_MANUAL = 'manual';
    const QUICK_ACCESS_MODES = new Set([QUICK_ACCESS_MODE_AUTO, QUICK_ACCESS_MODE_MANUAL]);
    const MAX_MANUAL_QUICK_ACCESS_FAVORITES = 24;
    const MENTION_STYLE_ID = 'tm-torr9-mention-style';
    const LINKIFIED_URL_STYLE_ID = 'tm-torr9-linkified-url-style';
    const EMBEDDED_IMAGE_STYLE_ID = 'tm-torr9-embedded-image-style';
    const YOUTUBE_LINK_ACTION_STYLE_ID = 'tm-torr9-youtube-link-action-style';
    const MESSAGE_ACTIONS_POSITION_STYLE_ID = 'tm-torr9-message-actions-position-style';
    const HOME_CHAT_POPOVER_STYLE_ID = 'tm-torr9-home-chat-popover-style';
    const NATIVE_CHAT_INPUT_POPOVER_STYLE_ID = 'tm-torr9-native-chat-input-popover-style';
    const CHAT_INPUT_TOOLBAR_STYLE_ID = 'tm-t4-chat-input-toolbar-style';
    const CHAT_INPUT_TOOLBAR_RAIL_ATTR = 'data-tm-chat-input-toolbar-rail';
    const CHAT_INPUT_TOOLBAR_INLINE_ATTR = 'data-tm-chat-input-toolbar-inline';
    const CHAT_INPUT_TOOLBAR_SPACE_ATTR = 'data-tm-chat-input-toolbar-space';
    const CHAT_INPUT_TOOLBAR_SYNC_BOUND_ATTR = 'data-tm-chat-input-toolbar-sync-bound';
    const CHAT_INPUT_TOOLBAR_RESERVED_HEIGHT_PX = 46;
    const MESSAGE_REACTION_QUICK_ACCESS_GROUP_ATTR = 'data-tm-message-reaction-quick-access-group';
    const MESSAGE_REACTION_QUICK_ACCESS_BUTTON_ATTR = 'data-tm-message-reaction-quick-access-button';
    const MANUAL_QUICK_ACCESS_PICKER_MARKER_ATTR = 'data-tm-manual-quick-access-picker-marker';
    const HOME_CHAT_POPOVER_SURFACE_ATTR = 'data-tm-home-chat-popover-surface';
    const HOME_CHAT_POPOVER_PARENT_ATTR = 'data-tm-home-chat-popover-parent';
    const NATIVE_CHAT_INPUT_ACTION_HOST_ATTR = 'data-tm-native-chat-input-action-host';
    const NATIVE_CHAT_INPUT_ACTION_SOURCE_ATTR = 'data-tm-native-chat-input-action-source';
    const NATIVE_CHAT_INPUT_ACTION_PLACEHOLDER_ATTR = 'data-tm-native-chat-input-action-placeholder';
    const NATIVE_CHAT_INPUT_ACTION_POPOVER_SYNC_BOUND_ATTR = 'data-tm-native-chat-input-action-popover-sync-bound';
    const NATIVE_CHAT_INPUT_POPOVER_LIFTED_ATTR = 'data-tm-native-chat-input-popovers-lifted';
    const URL_CANDIDATE_RE = /(?:https?:\/\/|www\.)[^\s<>"']+/i;
    const URL_MATCH_RE = /(?:https?:\/\/|www\.)[^\s<>"']+/gi;
    const YOUTUBE_FRAGMENT_RE = /(?:^|[\s([{"'/])((?:watch\?v=|shorts\/|embed\/|live\/)([a-zA-Z0-9_-]{11})(?:&[a-zA-Z0-9_.~-]+=[a-zA-Z0-9_.~%+-]*)*)(?=$|[\s)\]}>,.!?;:'"])/gi;
    const DIRECT_IMAGE_PATH_RE = /\.(?:avif|bmp|gif|jpe?g|png|svg|webp)$/i;
    const MESSAGE_ACTIONS_LEFT_VERTICAL_OFFSET_PX = 10;
    const AFK_AUTO_REPLY_GLOBAL_COOLDOWN_MS = 60 * 1000;
    const AFK_AUTO_REPLY_PER_USER_COOLDOWN_MS = 5 * 60 * 1000;
    const AFK_AUTO_REPLY_MAX_INACTIVITY_MS = 30 * 60 * 1000;
    const AFK_RELOAD_REPLAY_PROTECTION_MS = 8000;

    const DEFAULT_POSITION = {
        rightPercent: 2,
        bottomPercent: 2
    };
    const DEFAULT_STATS_BOX_WIDTH_PX = 240;
    const MIN_STATS_BOX_WIDTH_PX = 220;
    const MIN_STATS_BOX_HEIGHT_PX = 110;

    let observer = null;
    let statsBox = null;
    let statsContent = null;
    let statsBoxResizeObserver = null;
    let routeWatcher = null;
    let modalOpen = false;
    let imageViewerOpen = false;
    let imageCatalogDeleteConfirmationClose = null;
    let imageViewerKeydownHandler = null;
    let youtubePlayerKeydownHandler = null;
    let youtubePlayerResizeObserver = null;
    let youtubePlayerViewportResizeHandler = null;
    let youtubePlayerTitleRequestSerial = 0;
    let hoveredMessageImage = null;
    let debugMode = loadDebugMode();
    let homeChatCollapsed = loadHomeChatCollapsed();
    let statsDisplayMode = loadStatsDisplayMode();
    let statsHidden = loadStatsHidden();
    let statsUpdateFrame = null;
    let toastHideTimer = null;
    let mentionSettings = loadMentionSettings();
    let chatFontScale = loadChatFontScale();
    let chatScrollbarEnabled = loadChatScrollbarEnabled();
    let messageActionsLeftEnabled = loadMessageActionsLeftEnabled();
    let linkifyUrlsEnabled = loadLinkifyUrlsEnabled();
    let embedUrlImagesEnabled = loadEmbedUrlImagesEnabled();
    let savedPhrasesEnabled = loadSavedPhrasesEnabled();
    let savedPhrasesReplaceInput = loadSavedPhrasesReplaceInput();
    let klipyGifsEnabled = loadKlipyGifsEnabled();
    let emojiUsageCounts = loadEmojiUsageCounts();
    let reactionUsageCounts = loadReactionUsageCounts();
    let emojiQuickAccessLimit = loadEmojiQuickAccessLimit();
    let reactionQuickAccessLimit = loadReactionQuickAccessLimit();
    let quickAccessMode = loadQuickAccessMode();
    let manualEmojiFavorites = loadManualEmojiFavorites();
    let manualReactionFavorites = loadManualReactionFavorites();
    let chatInputToolbarInline = loadChatInputToolbarInline();
    let chatInputToolbarAlignRight = loadChatInputToolbarAlignRight();
    let imageHostingEnabled = loadImageHostingEnabled();
    let imgbbApiKey = loadImgBbApiKey();
    let imageHostingExpirationSeconds = loadImageHostingExpirationSeconds();
    let imageCatalog = loadImageCatalog();
    let mentionSoundContext = null;
    const mentionSoundBufferCache = new Map();
    let lastMentionSoundRecord = loadLastMentionSoundRecord();
    let recentMentionSoundRecords = loadRecentMentionSoundRecords(lastMentionSoundRecord);
    let lastMentionSoundAt = lastMentionSoundRecord?.notifiedAt || 0;
    let lastChatContextKey = 'other';
    let longPressReactionState = null;
    let nativeEmojiPickerContext = null;
    let nativeReactionPickerContext = null;
    let lastTrackedReactionUsageKey = '';
    let lastTrackedReactionUsageAt = 0;
    let savedPhrasesToolbarEventsInstalled = false;
    let klipyGifToolbarEventsInstalled = false;
    let imageUploadToolbarEventsInstalled = false;
    let imagePasteHandlerInstalled = false;
    let pendingImageUploadFiles = [];
    let klipyGifSearchDebounceTimer = null;
    let klipyGifRequestSerial = 0;
    let savedPhrasesStorageNeedsRepair = false;
    let savedPhrasesReplyContext = null;
    let afkAutomatedSendInFlight = false;
    let afkMessageDraft = null;
    let afkReplayProtectionUntil = 0;
    let afkReplayProtectionContextKey = '';
    let afkState = loadAfkState();
    let afkActivityRecords = loadAfkActivityRecords();
    let afkPanelPosition = loadAfkPanelPosition();
    let afkPanelHidden = loadAfkPanelHidden();
    const afkTabId = loadAfkTabId();

    const savedPhrases = loadSavedPhrases();
    if (savedPhrasesStorageNeedsRepair) {
        saveSavedPhrases();
    }
    const hiddenUsers = loadHiddenUsers();
    const highlightedUsers = loadHighlightedUsers();
    const sessionBlockedCounts = {};
    const alreadyCountedMessages = new WeakSet();
    const mentionBlinkStates = new WeakMap();
    const mentionSoundNotifiedMessages = new WeakSet();
    const klipyGifResponseCache = new Map();
    const youtubeVideoTitleCache = new Map();
    const afkSeenMessageKeys = new Set();

    /**
     * @typedef {Object} SavedPhraseRecord
     * @property {string} id
     * @property {string} text
     * @property {string[]} keywords
     */

    /**
     * @typedef {Object} RankedSavedPhraseEntry
     * @property {SavedPhraseRecord} phrase
     * @property {number} score
     * @property {string[]} matchedKeywords
     * @property {number} matchPercent
     */

    /**
     * @typedef {Object} MentionSettings
     * @property {string} username
     * @property {string} color
     * @property {number} opacityPercent
     * @property {number} blinkSeconds
     * @property {boolean} keepHighlightAfterBlink
     * @property {boolean} includeReplyContext
     * @property {string} soundScope
     * @property {string} soundStyle
     * @property {string} soundCustomUrl
     * @property {number} soundCooldownSeconds
     */

    /**
     * @typedef {Object} AfkState
     * @property {boolean} enabled
     * @property {boolean} autoReplyEnabled
     * @property {boolean} muteMentionSound
     * @property {string} ownerTabId
     * @property {string} contextKey
     * @property {string} contextLabel
     * @property {string} username
     * @property {string} autoReplyMessage
     * @property {number} activatedAt
     * @property {number} lastAutoReplyAt
     * @property {Object.<string, number>} perUserReplyAt
     */

    /**
     * @typedef {Object} AfkActivityRecord
     * @property {string} id
     * @property {string} contextKey
     * @property {string} contextLabel
     * @property {string} username
     * @property {string} displayUsername
     * @property {string} messageText
     * @property {string} replyContextText
     * @property {string} reason
     * @property {string} messageTimestamp
     * @property {number} capturedAt
     * @property {boolean} isRead
     * @property {number} readAt
     * @property {boolean} autoReplySent
     * @property {string} autoReplyStatus
     * @property {string} autoReplyText
     * @property {string} signatureHash
     * @property {number} signatureTimestampKey
     */

    /**
     * @typedef {Object} AfkPanelViewModel
     * @property {string} statusLabel
     * @property {string} currentAfkMessage
     * @property {number} activityCount
     * @property {number} unreadCount
     * @property {number} readCount
     * @property {boolean} autoReplyEnabled
     * @property {boolean} autoReplyActive
     * @property {boolean} autoReplyWindowExpired
     * @property {boolean} muteMentionSound
     * @property {string} toggleLabel
     */

    /**
     * @typedef {Object} KlipyGifResult
     * @property {string} id
     * @property {string} title
     * @property {string} gifUrl
     * @property {string} previewUrl
     * @property {string} itemUrl
     * @property {number} width
     * @property {number} height
     * @property {string[]} tags
     */

    /**
     * @typedef {Object} KlipyGifFeedPayload
     * @property {KlipyGifResult[]} results
     * @property {string} next
     */

    /**
     * @typedef {Object} ImageCatalogRecord
     * @property {string} id
     * @property {string} url
     * @property {string} displayUrl
     * @property {string} viewerUrl
     * @property {string} deleteUrl
     * @property {string} thumbUrl
     * @property {string} title
     * @property {string} source
     * @property {string} mime
     * @property {number} width
     * @property {number} height
     * @property {number} size
     * @property {number} createdAt
     * @property {number} expiresAt
     * @property {number} lastCheckedAt
     */

    /**
     * @typedef {Object} EmojiUsageRecord
     * @property {string} key
     * @property {string} title
     * @property {string} alt
     * @property {string} src
     * @property {number} count
     * @property {number} lastUsedAt
     */

    function isTr4kerPage() {
        return location.hostname === TR4KER_HOSTNAME || location.hostname.endsWith(`.${TR4KER_HOSTNAME}`);
    }

    function isChatPage() {
        return isTr4kerPage() && (
            location.pathname === '/communication' ||
            location.pathname.startsWith('/communication/')
        );
    }

    function isHomePage() {
        return false;
    }

    function isSupportedPage() {
        return isChatPage() || isHomePage();
    }

    function getCurrentPageType() {
        if (isChatPage()) return 'chat';
        if (isHomePage()) return 'home';
        return 'other';
    }

    function getCurrentPageLabel() {
        return 'Tr4ker · Communication';
    }

    function getCurrentContextLabel() {
        if (isHomePage()) return 'Accueil';
        if (!isChatPage()) return 'Autre';

        const context = getCurrentChatContext();
        if (!context) return 'Chat';
        if (context.type === 'channel') return `#${context.name}`;
        return context.name || 'Chat privé';
    }

    function getPositionStorageKey() {
        return isChatPage() ? STORAGE_KEY_POS_CHAT : STORAGE_KEY_POS_HOME;
    }

    function getStatsBoxSizeStorageKey() {
        return isChatPage() ? STORAGE_KEY_SIZE_CHAT : STORAGE_KEY_SIZE_HOME;
    }

    function getStatsCollapsedStorageKey() {
        return isChatPage() ? STORAGE_KEY_STATS_COLLAPSED_CHAT : STORAGE_KEY_STATS_COLLAPSED_HOME;
    }

    function getStatsHiddenStorageKey() {
        return isChatPage() ? STORAGE_KEY_STATS_HIDDEN_CHAT : STORAGE_KEY_STATS_HIDDEN_HOME;
    }

    /**
     * Lit une valeur brute depuis un stockage navigateur sans interrompre le script.
     *
     * @param {string} key
     * @param {Storage} [storage=localStorage]
     * @returns {string|null}
     */
    function readStorageItem(key, storage = localStorage) {
        try {
            return storage.getItem(key);
        } catch (e) {
            return null;
        }
    }

    /**
     * Écrit une valeur brute dans un stockage navigateur.
     *
     * @param {string} key
     * @param {string} value
     * @param {Storage} [storage=localStorage]
     * @returns {boolean}
     */
    function writeStorageItem(key, value, storage = localStorage) {
        try {
            storage.setItem(key, value);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Supprime une clé de stockage sans laisser remonter d'exception.
     *
     * @param {string} key
     * @param {Storage} [storage=localStorage]
     * @returns {boolean}
     */
    function removeStorageItem(key, storage = localStorage) {
        try {
            storage.removeItem(key);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Lit et parse un JSON stocké, avec valeur de repli en cas d'absence ou d'erreur.
     *
     * @template T
     * @param {string} key
     * @param {T} fallbackValue
     * @param {Storage} [storage=localStorage]
     * @returns {T}
     */
    function readStorageJson(key, fallbackValue, storage = localStorage) {
        const rawValue = readStorageItem(key, storage);
        if (rawValue === null) return fallbackValue;

        try {
            return JSON.parse(rawValue);
        } catch (e) {
            return fallbackValue;
        }
    }

    /**
     * Sérialise puis écrit une valeur JSON.
     *
     * @param {string} key
     * @param {unknown} value
     * @param {Storage} [storage=localStorage]
     * @returns {boolean}
     */
    function writeStorageJson(key, value, storage = localStorage) {
        return writeStorageItem(key, JSON.stringify(value), storage);
    }

    function readStorageBoolean(key, defaultValue = false, storage = localStorage) {
        const rawValue = readStorageItem(key, storage);
        if (rawValue === null) return !!defaultValue;
        return rawValue === '1';
    }

    function writeStorageBoolean(key, value, storage = localStorage) {
        return writeStorageItem(key, value ? '1' : '0', storage);
    }

    function loadHiddenUsers() {
        const parsed = readStorageJson(STORAGE_KEY_USERS, []);
        if (!Array.isArray(parsed)) return new Set();
        return new Set(parsed.map(normalizeName).filter(Boolean));
    }

    function saveHiddenUsers() {
        writeStorageJson(STORAGE_KEY_USERS, [...hiddenUsers]);
    }

    function extractSavedPhraseStringValue(value, depth = 0) {
        if (depth > 4 || value === null || value === undefined) return '';

        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
        }

        if (Array.isArray(value)) {
            for (const entry of value) {
                const extractedEntry = extractSavedPhraseStringValue(entry, depth + 1);
                if (extractedEntry) return extractedEntry;
            }

            return '';
        }

        if (typeof value === 'object') {
            return extractSavedPhraseStringValue(
                value.text ?? value.phrase ?? value.content ?? value.value ?? value.label ?? value.title ?? value.name ?? '',
                depth + 1
            );
        }

        return '';
    }

    function normalizeSavedPhraseText(value, truncate = false) {
        const normalized = extractSavedPhraseStringValue(value).replace(/\r\n?/g, '\n').trim();
        if (!normalized) return '';

        if (truncate) {
            return normalized.slice(0, MAX_SAVED_PHRASE_LENGTH);
        }

        return normalized;
    }

    function normalizeSavedPhraseKeywords(value) {
        const rawKeywords = Array.isArray(value)
            ? value.flatMap((entry) => {
                const extractedEntry = extractSavedPhraseStringValue(entry);
                return extractedEntry ? extractedEntry.split(/[,;\n]+/) : [];
            })
            : normalizeSavedPhraseText(value).split(/[,;\n]+/);

        const seen = new Set();
        const keywords = [];

        for (const rawKeyword of rawKeywords) {
            const keyword = normalizeSavedPhraseText(rawKeyword);
            if (!keyword) continue;

            const normalizedKeyword = keyword.toLocaleLowerCase('fr');
            if (seen.has(normalizedKeyword)) continue;

            seen.add(normalizedKeyword);
            keywords.push(keyword);
        }

        return keywords;
    }

    function mergeSavedPhraseKeywords(...keywordGroups) {
        const mergedKeywords = [];

        for (const group of keywordGroups) {
            if (Array.isArray(group)) {
                mergedKeywords.push(...group);
            } else if (group !== undefined && group !== null) {
                mergedKeywords.push(group);
            }
        }

        return normalizeSavedPhraseKeywords(mergedKeywords);
    }

    /**
     * Normalise une entrée de réponse rapide en structure stable exploitable partout dans le script.
     *
     * @param {unknown} record
     * @param {boolean} [truncateText=true]
     * @returns {SavedPhraseRecord|null}
     */
    function normalizeSavedPhraseRecord(record, truncateText = true) {
        if (typeof record === 'string' || typeof record === 'number' || typeof record === 'boolean') {
            const text = normalizeSavedPhraseText(record, truncateText);
            return text ? { text, keywords: [] } : null;
        }

        if (!record || typeof record !== 'object' || Array.isArray(record)) {
            return null;
        }

        const text = normalizeSavedPhraseText(
            record.text ?? record.phrase ?? record.content ?? record.value ?? record.label ?? '',
            truncateText
        );
        if (!text) return null;

        return {
            text,
            keywords: normalizeSavedPhraseKeywords(record.keywords)
        };
    }

    function loadSavedPhrases() {
        const parsed = readStorageJson(STORAGE_KEY_SAVED_PHRASES, []);
        if (!Array.isArray(parsed)) {
            savedPhrasesStorageNeedsRepair = false;
            return [];
        }

        savedPhrasesStorageNeedsRepair = false;

        const normalizedEntries = [];
        const seenTexts = new Set();

        parsed.forEach((entry) => {
            const normalizedEntry = normalizeSavedPhraseRecord(entry, true);
            if (!normalizedEntry) {
                savedPhrasesStorageNeedsRepair = true;
                return;
            }

            if (
                typeof entry !== 'object' ||
                entry === null ||
                Array.isArray(entry) ||
                typeof entry.text !== 'string' ||
                !Array.isArray(entry.keywords)
            ) {
                savedPhrasesStorageNeedsRepair = true;
            }

            if (seenTexts.has(normalizedEntry.text)) {
                savedPhrasesStorageNeedsRepair = true;
                return;
            }

            seenTexts.add(normalizedEntry.text);
            normalizedEntries.push(normalizedEntry);
        });

        return normalizedEntries;
    }

    function saveSavedPhrases() {
        const normalizedEntries = savedPhrases
            .map((phrase) => normalizeSavedPhraseRecord(phrase, true))
            .filter(Boolean);

        savedPhrases.splice(0, savedPhrases.length, ...normalizedEntries);

        writeStorageJson(
            STORAGE_KEY_SAVED_PHRASES,
            normalizedEntries.map((phrase) => ({
                text: phrase.text,
                keywords: [...phrase.keywords]
            }))
        );

        savedPhrasesStorageNeedsRepair = false;
    }

    function loadSavedPhrasesEnabled() {
        return readStorageBoolean(STORAGE_KEY_SAVED_PHRASES_ENABLED, false);
    }

    function saveSavedPhrasesEnabled(value) {
        savedPhrasesEnabled = !!value;
        writeStorageBoolean(STORAGE_KEY_SAVED_PHRASES_ENABLED, savedPhrasesEnabled);
    }

    function loadSavedPhrasesReplaceInput() {
        return readStorageBoolean(STORAGE_KEY_SAVED_PHRASES_REPLACE_INPUT, false);
    }

    function saveSavedPhrasesReplaceInput(value) {
        savedPhrasesReplaceInput = !!value;
        writeStorageBoolean(STORAGE_KEY_SAVED_PHRASES_REPLACE_INPUT, savedPhrasesReplaceInput);
    }

    function loadKlipyGifsEnabled() {
        return readStorageBoolean(STORAGE_KEY_KLIPY_GIFS_ENABLED, DEFAULT_KLIPY_GIFS_ENABLED);
    }

    function saveKlipyGifsEnabled(value) {
        klipyGifsEnabled = !!value;
        writeStorageBoolean(STORAGE_KEY_KLIPY_GIFS_ENABLED, klipyGifsEnabled);
    }

    function normalizeEmojiUsageAssetPath(value) {
        const rawValue = String(value || '').trim();
        if (!rawValue) return '';

        try {
            const parsedUrl = new URL(rawValue, location.origin);
            return `${parsedUrl.pathname}${parsedUrl.search}`;
        } catch (e) {
            return rawValue;
        }
    }

    function buildEmojiUsageKey(title, alt, src) {
        const normalizedTitle = String(title || '').trim();
        const normalizedAlt = String(alt || '').trim();
        const normalizedSrc = normalizeEmojiUsageAssetPath(src);
        const label = normalizedTitle || normalizedAlt || normalizedSrc;
        if (!label) return '';

        return [
            normalizeMentionComparableText(normalizedTitle || normalizedAlt || normalizedSrc),
            normalizedSrc
        ].join('|');
    }

    function normalizeEmojiUsageRecord(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

        const title = String(value.title || '').trim();
        const alt = String(value.alt || '').trim();
        const src = normalizeEmojiUsageAssetPath(value.src);
        const key = String(value.key || buildEmojiUsageKey(title, alt, src)).trim();
        const count = Math.max(0, Number.parseInt(String(value.count ?? 0), 10) || 0);
        const lastUsedAt = Math.max(0, Number(value.lastUsedAt) || 0);
        if (!key || count <= 0) return null;

        return {
            key,
            title,
            alt,
            src,
            count,
            lastUsedAt
        };
    }

    function loadEmojiUsageCounts() {
        const parsed = readStorageJson(STORAGE_KEY_EMOJI_USAGE_COUNTS, {});
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

        return Object.fromEntries(
            Object.entries(parsed)
                .map(([, value]) => {
                    const record = normalizeEmojiUsageRecord(value);
                    return record ? [record.key, record] : null;
                })
                .filter(Boolean)
        );
    }

    function saveEmojiUsageCounts() {
        const normalizedRecords = Object.fromEntries(
            Object.values(emojiUsageCounts)
                .map((entry) => normalizeEmojiUsageRecord(entry))
                .filter(Boolean)
                .map((record) => [record.key, record])
        );

        emojiUsageCounts = normalizedRecords;
        writeStorageJson(STORAGE_KEY_EMOJI_USAGE_COUNTS, normalizedRecords);
    }

    function resetEmojiUsageCounts() {
        emojiUsageCounts = {};
        removeStorageItem(STORAGE_KEY_EMOJI_USAGE_COUNTS);
        refreshEmojiQuickAccessToolbar();
    }

    function extractEmojiUsageRecordFromButton(button) {
        if (!(button instanceof HTMLButtonElement)) return null;

        const image = button.querySelector('img');
        const rawText = String(button.textContent || '').trim();
        const emojiValue = normalizeReactionEmojiValue(rawText);
        const dataValue = String(
            button.getAttribute('data-emoji') ||
            button.getAttribute('data-value') ||
            button.getAttribute('data-name') ||
            ''
        ).trim();
        const title = String(
            emojiValue ||
            button.getAttribute('title') ||
            button.getAttribute('aria-label') ||
            dataValue ||
            rawText
        ).trim();
        const alt = String(
            image?.getAttribute('alt') ||
            emojiValue ||
            dataValue ||
            rawText
        ).trim();
        const src = normalizeEmojiUsageAssetPath(image?.getAttribute('src') || image?.currentSrc || '');
        const key = buildEmojiUsageKey(title, alt, src);
        if (!key) return null;

        return {
            key,
            title,
            alt,
            src,
            count: 0,
            lastUsedAt: 0
        };
    }

    function getEmojiUsageCount(recordOrKey) {
        const key = typeof recordOrKey === 'string'
            ? String(recordOrKey || '').trim()
            : String(recordOrKey?.key || '').trim();
        if (!key) return 0;

        return Math.max(0, Number(emojiUsageCounts[key]?.count) || 0);
    }

    function recordEmojiUsageRecord(record) {
        const baseRecord = normalizeEmojiUsageRecord({
            ...record,
            count: 1,
            lastUsedAt: Date.now()
        });
        if (!baseRecord) {
            logEmojiDebug('record: skipped, emoji metadata unresolved');
            return null;
        }

        const existingRecord = normalizeEmojiUsageRecord(emojiUsageCounts[baseRecord.key]);
        const nextRecord = {
            ...baseRecord,
            count: (existingRecord?.count || 0) + 1,
            lastUsedAt: Date.now()
        };

        emojiUsageCounts = {
            ...emojiUsageCounts,
            [baseRecord.key]: nextRecord
        };
        saveEmojiUsageCounts();
        refreshOpenSettingsUsageLists();
        refreshEmojiQuickAccessToolbar();

        logEmojiDebug('record: stored', {
            key: baseRecord.key,
            title: baseRecord.title,
            alt: baseRecord.alt,
            src: baseRecord.src,
            previousCount: existingRecord?.count || 0,
            nextCount: nextRecord.count
        });

        return emojiUsageCounts[baseRecord.key] || null;
    }

    function recordEmojiUsageFromButton(button) {
        const baseRecord = extractEmojiUsageRecordFromButton(button);
        return recordEmojiUsageRecord(baseRecord);
    }

    function getTopEmojiUsageRecords(limit = 10) {
        const safeLimit = Math.max(0, Number(limit) || 0);
        if (safeLimit <= 0) return [];

        return Object.values(emojiUsageCounts)
            .map((entry) => normalizeEmojiUsageRecord(entry))
            .filter(Boolean)
            .sort((left, right) => (
                (right.count - left.count)
                || (right.lastUsedAt - left.lastUsedAt)
                || String(left.title || left.alt || left.src).localeCompare(
                    String(right.title || right.alt || right.src),
                    'fr'
                )
            ))
            .slice(0, safeLimit);
    }

    function buildEmojiInsertionText(record) {
        const insertText = String(record?.insertText || '').trim();
        if (insertText) {
            return insertText;
        }

        const title = String(record?.title || '').trim();
        if (normalizeReactionEmojiValue(title)) {
            return title;
        }
        if (/^:[^:\s][^:]*:$/.test(title)) {
            return title;
        }

        const rawAlt = String(record?.alt || '').trim();
        if (normalizeReactionEmojiValue(rawAlt)) {
            return rawAlt;
        }

        const alt = rawAlt.replace(/^:+|:+$/g, '');
        if (alt) {
            return `:${alt}:`;
        }

        const normalizedSrc = normalizeEmojiUsageAssetPath(record?.src || '');
        const pathMatch = normalizedSrc.match(/\/([^/?#]+)\.(?:avif|bmp|gif|jpe?g|png|svg|webp)(?:\?.*)?$/i);
        if (pathMatch?.[1]) {
            return `:${pathMatch[1]}:`;
        }

        return '';
    }

    function getQuickAccessEmojiRecords(limit = emojiQuickAccessLimit) {
        const safeLimit = Math.max(0, Number(limit) || 0);
        if (safeLimit <= 0) return [];

        if (quickAccessMode === QUICK_ACCESS_MODE_MANUAL) {
            return getManualEmojiFavoriteRecords(safeLimit);
        }

        return getTopEmojiUsageRecords(safeLimit * 3)
            .filter((record) => !!buildEmojiInsertionText(record))
            .slice(0, safeLimit);
    }

    function normalizeReactionEmojiValue(value) {
        const rawValue = String(value || '').trim();
        if (!rawValue) return '';
        if (/^:[^:\s][^:]*:$/.test(rawValue)) return '';
        if (/[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D]/u.test(rawValue)) {
            return rawValue;
        }

        return '';
    }

    function normalizeQuickAccessMode(value) {
        const normalizedValue = String(value || '').trim();
        return QUICK_ACCESS_MODES.has(normalizedValue) ? normalizedValue : QUICK_ACCESS_MODE_AUTO;
    }

    function loadQuickAccessMode() {
        return normalizeQuickAccessMode(readStorageItem(STORAGE_KEY_QUICK_ACCESS_MODE));
    }

    function saveQuickAccessMode(value) {
        quickAccessMode = normalizeQuickAccessMode(value);
        writeStorageItem(STORAGE_KEY_QUICK_ACCESS_MODE, quickAccessMode);
        refreshEmojiQuickAccessToolbar();
        refreshReactionQuickAccessButtons();
        syncManualQuickAccessPickerMarkers();
    }

    function isManualQuickAccessPickerToggleEvent(event) {
        return quickAccessMode === QUICK_ACCESS_MODE_MANUAL && (event.altKey || event.shiftKey);
    }

    function splitManualFavoriteInput(value) {
        return String(value || '')
            .replace(/\r\n?/g, '\n')
            .split(/[\s,;]+/)
            .map((entry) => entry.trim())
            .filter(Boolean);
    }

    function splitManualReactionFavoriteInput(value) {
        return splitManualFavoriteInput(value).flatMap((entry) => {
            if (!normalizeReactionEmojiValue(entry)) return [entry];

            try {
                if (typeof Intl === 'undefined' || typeof Intl.Segmenter !== 'function') return [entry];

                const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
                const segments = Array.from(segmenter.segment(entry), (segment) => segment.segment)
                    .filter((segment) => normalizeReactionEmojiValue(segment));

                if (segments.length > 0 && segments.join('') !== entry) return segments;
                return segments.length > 1 ? segments : [entry];
            } catch (e) {
                return [entry];
            }
        });
    }

    function normalizeManualEmojiFavoriteText(value) {
        const rawValue = String(value || '').trim();
        if (!rawValue) return '';
        if (/^:[^:\s][^:]*:$/.test(rawValue)) return rawValue;
        if (normalizeReactionEmojiValue(rawValue)) return rawValue;
        if (!/\s/.test(rawValue)) return `:${rawValue.replace(/^:+|:+$/g, '')}:`;
        return rawValue;
    }

    function normalizeManualEmojiFavoriteRecord(value) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            const insertText = normalizeManualEmojiFavoriteText(value);
            if (!insertText) return null;

            return {
                key: `manual:${normalizeMentionComparableText(insertText)}`,
                title: insertText,
                alt: insertText,
                src: '',
                count: 0,
                lastUsedAt: 0,
                insertText,
                isManual: true
            };
        }

        if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

        const title = String(value.title || value.insertText || '').trim();
        const alt = String(value.alt || value.insertText || '').trim();
        const src = normalizeEmojiUsageAssetPath(value.src);
        const insertText = normalizeManualEmojiFavoriteText(
            value.insertText || buildEmojiInsertionText({ title, alt, src }) || title || alt
        );
        const key = String(
            value.key ||
            buildEmojiUsageKey(title, alt, src) ||
            (insertText ? `manual:${normalizeMentionComparableText(insertText)}` : '')
        ).trim();
        if (!key || (!insertText && !src)) return null;

        return {
            key,
            title: title || insertText,
            alt: alt || insertText,
            src,
            count: Math.max(0, Number(value.count) || 0),
            lastUsedAt: Math.max(0, Number(value.lastUsedAt) || 0),
            insertText,
            isManual: true
        };
    }

    function normalizeManualEmojiFavorites(value) {
        const rawEntries = Array.isArray(value) ? value : splitManualFavoriteInput(value);
        const seen = new Set();
        const favorites = [];

        rawEntries.forEach((entry) => {
            const favoriteRecord = normalizeManualEmojiFavoriteRecord(entry);
            if (!favoriteRecord || seen.has(favoriteRecord.key)) return;

            seen.add(favoriteRecord.key);
            favorites.push(favoriteRecord);
        });

        return favorites.slice(0, MAX_MANUAL_QUICK_ACCESS_FAVORITES);
    }

    function loadManualEmojiFavorites() {
        return normalizeManualEmojiFavorites(readStorageJson(STORAGE_KEY_MANUAL_EMOJI_FAVORITES, []));
    }

    function saveManualEmojiFavorites(value) {
        manualEmojiFavorites = normalizeManualEmojiFavorites(value);
        writeStorageJson(STORAGE_KEY_MANUAL_EMOJI_FAVORITES, manualEmojiFavorites);
        refreshEmojiQuickAccessToolbar();
        refreshOpenSettingsManualQuickAccessLists();
        syncManualQuickAccessPickerMarkers();
    }

    function getManualEmojiFavoriteRecords(limit = emojiQuickAccessLimit) {
        const safeLimit = Math.max(0, Number(limit) || 0);
        return manualEmojiFavorites.slice(0, safeLimit);
    }

    function isManualEmojiFavoriteRecord(record) {
        const normalizedRecord = normalizeManualEmojiFavoriteRecord(record);
        if (!normalizedRecord) return false;
        return manualEmojiFavorites.some((favorite) => favorite.key === normalizedRecord.key);
    }

    function toggleManualEmojiFavoriteRecord(record) {
        const normalizedRecord = normalizeManualEmojiFavoriteRecord(record);
        if (!normalizedRecord) {
            return { ok: false, added: false, message: 'Emoji favori introuvable.' };
        }

        const existingIndex = manualEmojiFavorites.findIndex((favorite) => favorite.key === normalizedRecord.key);
        if (existingIndex >= 0) {
            const nextFavorites = manualEmojiFavorites.filter((_, index) => index !== existingIndex);
            saveManualEmojiFavorites(nextFavorites);
            return { ok: true, added: false, message: 'Emoji retiré des favoris manuels.' };
        }

        saveManualEmojiFavorites([...manualEmojiFavorites, normalizedRecord]);
        return { ok: true, added: true, message: 'Emoji ajouté aux favoris manuels.' };
    }

    function toggleManualEmojiFavoriteFromButton(button) {
        return toggleManualEmojiFavoriteRecord(extractEmojiUsageRecordFromButton(button));
    }

    function moveManualEmojiFavorite(index, delta) {
        const sourceIndex = Math.max(0, Number(index) || 0);
        const targetIndex = sourceIndex + (Number(delta) || 0);
        if (
            sourceIndex < 0 ||
            sourceIndex >= manualEmojiFavorites.length ||
            targetIndex < 0 ||
            targetIndex >= manualEmojiFavorites.length
        ) {
            return false;
        }

        const nextFavorites = manualEmojiFavorites.slice();
        const [movedFavorite] = nextFavorites.splice(sourceIndex, 1);
        nextFavorites.splice(targetIndex, 0, movedFavorite);
        saveManualEmojiFavorites(nextFavorites);
        return true;
    }

    function reorderManualEmojiFavorite(sourceIndex, targetIndex) {
        const normalizedSourceIndex = Math.max(0, Number(sourceIndex) || 0);
        const normalizedTargetIndex = Math.max(0, Number(targetIndex) || 0);
        return moveManualEmojiFavorite(normalizedSourceIndex, normalizedTargetIndex - normalizedSourceIndex);
    }

    function normalizeManualReactionFavoriteRecord(value) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            const emojiValue = normalizeReactionEmojiValue(value);
            if (!emojiValue) return null;

            return {
                key: `manual-reaction:${emojiValue}`,
                label: emojiValue,
                title: emojiValue,
                alt: emojiValue,
                emojiValue,
                src: '',
                svgSignature: '',
                count: 0,
                lastUsedAt: 0,
                isManual: true
            };
        }

        if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

        const label = String(value.label || value.emojiValue || '').trim();
        const title = String(value.title || '').trim();
        const alt = String(value.alt || '').trim();
        const emojiValue = normalizeReactionEmojiValue(value.emojiValue || label || alt || title);
        const src = normalizeEmojiUsageAssetPath(value.src);
        const svgSignature = String(value.svgSignature || '').trim();
        const key = String(
            value.key ||
            (emojiValue ? `manual-reaction:${emojiValue}` : '') ||
            (src ? `manual-reaction-src:${src}` : '') ||
            (svgSignature ? `manual-reaction-svg:${hashString(svgSignature)}` : '')
        ).trim();
        if (!key || (!emojiValue && !src && !svgSignature)) return null;

        return {
            key,
            label: label || emojiValue || title || alt,
            title: title || emojiValue,
            alt: alt || emojiValue,
            emojiValue,
            src,
            svgSignature,
            count: Math.max(0, Number(value.count) || 0),
            lastUsedAt: Math.max(0, Number(value.lastUsedAt) || 0),
            isManual: true
        };
    }

    function normalizeManualReactionFavorites(value) {
        const rawEntries = Array.isArray(value) ? value : splitManualReactionFavoriteInput(value);
        const seen = new Set();
        const favorites = [];

        rawEntries.forEach((entry) => {
            const favoriteRecord = normalizeManualReactionFavoriteRecord(entry);
            if (!favoriteRecord || seen.has(favoriteRecord.key)) return;

            seen.add(favoriteRecord.key);
            favorites.push(favoriteRecord);
        });

        return favorites.slice(0, MAX_MANUAL_QUICK_ACCESS_FAVORITES);
    }

    function loadManualReactionFavorites() {
        return normalizeManualReactionFavorites(readStorageJson(STORAGE_KEY_MANUAL_REACTION_FAVORITES, []));
    }

    function saveManualReactionFavorites(value) {
        manualReactionFavorites = normalizeManualReactionFavorites(value);
        writeStorageJson(STORAGE_KEY_MANUAL_REACTION_FAVORITES, manualReactionFavorites);
        refreshReactionQuickAccessButtons();
        refreshOpenSettingsManualQuickAccessLists();
        syncManualQuickAccessPickerMarkers();
    }

    function getManualReactionFavoriteRecords(limit = reactionQuickAccessLimit) {
        const safeLimit = Math.max(0, Number(limit) || 0);
        return manualReactionFavorites.slice(0, safeLimit);
    }

    function isManualReactionFavoriteRecord(record) {
        const normalizedRecord = normalizeManualReactionFavoriteRecord(record);
        if (!normalizedRecord) return false;
        return manualReactionFavorites.some((favorite) => favorite.key === normalizedRecord.key);
    }

    function toggleManualReactionFavoriteRecord(record) {
        const normalizedRecord = normalizeManualReactionFavoriteRecord(record);
        if (!normalizedRecord) {
            return { ok: false, added: false, message: 'Réaction favorite introuvable.' };
        }

        const existingIndex = manualReactionFavorites.findIndex((favorite) => favorite.key === normalizedRecord.key);
        if (existingIndex >= 0) {
            const nextFavorites = manualReactionFavorites.filter((_, index) => index !== existingIndex);
            saveManualReactionFavorites(nextFavorites);
            return { ok: true, added: false, message: 'Réaction retirée des favoris manuels.' };
        }

        saveManualReactionFavorites([...manualReactionFavorites, normalizedRecord]);
        return { ok: true, added: true, message: 'Réaction ajoutée aux favoris manuels.' };
    }

    function toggleManualReactionFavoriteFromButton(button) {
        return toggleManualReactionFavoriteRecord(extractReactionUsageRecordFromButton(button));
    }

    function moveManualReactionFavorite(index, delta) {
        const sourceIndex = Math.max(0, Number(index) || 0);
        const targetIndex = sourceIndex + (Number(delta) || 0);
        if (
            sourceIndex < 0 ||
            sourceIndex >= manualReactionFavorites.length ||
            targetIndex < 0 ||
            targetIndex >= manualReactionFavorites.length
        ) {
            return false;
        }

        const nextFavorites = manualReactionFavorites.slice();
        const [movedFavorite] = nextFavorites.splice(sourceIndex, 1);
        nextFavorites.splice(targetIndex, 0, movedFavorite);
        saveManualReactionFavorites(nextFavorites);
        return true;
    }

    function reorderManualReactionFavorite(sourceIndex, targetIndex) {
        const normalizedSourceIndex = Math.max(0, Number(sourceIndex) || 0);
        const normalizedTargetIndex = Math.max(0, Number(targetIndex) || 0);
        return moveManualReactionFavorite(normalizedSourceIndex, normalizedTargetIndex - normalizedSourceIndex);
    }

    function extractReactionEmojiValueFromCandidates(...values) {
        for (const value of values) {
            const emojiValue = normalizeReactionEmojiValue(value);
            if (emojiValue) return emojiValue;
        }

        return '';
    }

    function normalizeReactionUsageRecord(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

        const label = String(value.label || '').trim();
        const title = String(value.title || '').trim();
        const alt = String(value.alt || '').trim();
        const emojiValue = normalizeReactionEmojiValue(value.emojiValue);
        const src = normalizeEmojiUsageAssetPath(value.src);
        const svgSignature = String(value.svgSignature || '').trim();
        const key = String(value.key || '').trim();
        const count = Math.max(0, Number.parseInt(String(value.count ?? 0), 10) || 0);
        const lastUsedAt = Math.max(0, Number(value.lastUsedAt) || 0);
        if (!key || count <= 0) return null;

        return {
            key,
            label,
            title,
            alt,
            emojiValue,
            src,
            svgSignature,
            count,
            lastUsedAt
        };
    }

    function buildReactionUsageKey(button) {
        if (!(button instanceof HTMLButtonElement)) return '';

        const label = getButtonSearchLabel(button);
        const image = button.querySelector('img');
        const title = String(button.getAttribute('title') || '').trim();
        const datasetValue = normalizeMentionComparableText(
            [
                button.getAttribute('data-emoji'),
                button.getAttribute('data-name'),
                button.getAttribute('data-key'),
                button.getAttribute('data-value')
            ]
                .filter(Boolean)
                .join(' ')
        );
        const textValue = String(button.textContent || '').trim();
        const alt = String(image?.getAttribute('alt') || '').trim();
        const src = normalizeEmojiUsageAssetPath(image?.getAttribute('src') || image?.currentSrc || '');
        const svg = button.querySelector('svg');
        const svgSignature = svg instanceof SVGElement
            ? normalizeMentionComparableText(svg.outerHTML.replace(/\s+/g, ' ').slice(0, 400))
            : '';
        const keySource = label || datasetValue || title || alt || textValue || src || svgSignature;
        if (!keySource) return '';

        return [
            normalizeMentionComparableText(keySource),
            src || `svg:${hashString(svgSignature || textValue || keySource)}`
        ].join('|');
    }

    function extractReactionUsageRecordFromButton(button) {
        if (!(button instanceof HTMLButtonElement)) return null;

        const image = button.querySelector('img');
        const label = getButtonSearchLabel(button);
        const title = String(button.getAttribute('title') || '').trim();
        const rawDataEmoji = String(button.getAttribute('data-emoji') || '').trim();
        const datasetValue = normalizeMentionComparableText(
            [
                rawDataEmoji,
                button.getAttribute('data-name'),
                button.getAttribute('data-key'),
                button.getAttribute('data-value')
            ]
                .filter(Boolean)
                .join(' ')
        );
        const textValue = String(button.textContent || '').trim();
        const alt = String(image?.getAttribute('alt') || '').trim();
        const emojiValue = extractReactionEmojiValueFromCandidates(
            rawDataEmoji,
            textValue,
            alt,
            title,
            button.getAttribute('aria-label')
        );
        const src = normalizeEmojiUsageAssetPath(image?.getAttribute('src') || image?.currentSrc || '');
        const svg = button.querySelector('svg');
        const svgSignature = svg instanceof SVGElement
            ? normalizeMentionComparableText(svg.outerHTML.replace(/\s+/g, ' ').slice(0, 400))
            : '';
        const key = buildReactionUsageKey(button);
        if (!key) return null;

        return {
            key,
            label: label || datasetValue || textValue,
            title,
            alt,
            emojiValue,
            src,
            svgSignature,
            count: 0,
            lastUsedAt: 0
        };
    }

    function loadReactionUsageCounts() {
        const parsed = readStorageJson(STORAGE_KEY_REACTION_USAGE_COUNTS, {});
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

        const normalizedRecords = Object.fromEntries(
            Object.entries(parsed)
                .map(([, value]) => {
                    const record = normalizeReactionUsageRecord(value);
                    return record && !isUserscriptControlReactionRecord(record)
                        ? [record.key, record]
                        : null;
                })
                .filter(Boolean)
        );

        // Retirer les faux positifs produits par les anciennes heuristiques
        // (par exemple le bouton « Ouvrir le picker GIF Klipy »).
        if (Object.keys(normalizedRecords).length !== Object.keys(parsed).length) {
            writeStorageJson(STORAGE_KEY_REACTION_USAGE_COUNTS, normalizedRecords);
        }

        return normalizedRecords;
    }

    function saveReactionUsageCounts() {
        const normalizedRecords = Object.fromEntries(
            Object.values(reactionUsageCounts)
                .map((entry) => normalizeReactionUsageRecord(entry))
                .filter(Boolean)
                .map((record) => [record.key, record])
        );

        reactionUsageCounts = normalizedRecords;
        writeStorageJson(STORAGE_KEY_REACTION_USAGE_COUNTS, normalizedRecords);
    }

    function resetReactionUsageCounts() {
        reactionUsageCounts = {};
        removeStorageItem(STORAGE_KEY_REACTION_USAGE_COUNTS);
        refreshReactionQuickAccessButtons();
    }

    function refreshOpenSettingsUsageLists() {
        const modal = document.getElementById(MODAL_ID);
        if (!(modal instanceof HTMLElement)) return;

        refreshSettingsEmojiUsageList({
            emojiUsageHistoryEmojiList: modal.querySelector('#tm-emoji-usage-history-emoji-list')
        });
        refreshSettingsReactionUsageList({
            reactionUsageHistoryReactionList: modal.querySelector('#tm-emoji-usage-history-reaction-list')
        });
    }

    function refreshOpenSettingsManualQuickAccessLists() {
        const modal = document.getElementById(MODAL_ID);
        if (!(modal instanceof HTMLElement)) return;

        refreshSettingsManualQuickAccessLists({
            manualEmojiFavoritesList: modal.querySelector('#tm-manual-emoji-favorites-list'),
            manualReactionFavoritesList: modal.querySelector('#tm-manual-reaction-favorites-list')
        });
    }

    function getReactionUsageCount(recordOrKey) {
        const key = typeof recordOrKey === 'string'
            ? String(recordOrKey || '').trim()
            : String(recordOrKey?.key || '').trim();
        if (!key) return 0;

        return Math.max(0, Number(reactionUsageCounts[key]?.count) || 0);
    }

    function recordReactionUsageRecord(record) {
        const baseRecord = normalizeReactionUsageRecord({
            ...record,
            count: 1,
            lastUsedAt: Date.now()
        });
        if (!baseRecord) {
            logEmojiDebug('reaction record: skipped, button metadata unresolved');
            return null;
        }

        const existingRecord = normalizeReactionUsageRecord(reactionUsageCounts[baseRecord.key]);
        const nextRecord = {
            ...baseRecord,
            count: (existingRecord?.count || 0) + 1,
            lastUsedAt: Date.now()
        };

        reactionUsageCounts = {
            ...reactionUsageCounts,
            [baseRecord.key]: nextRecord
        };
        saveReactionUsageCounts();
        refreshOpenSettingsUsageLists();
        refreshReactionQuickAccessButtons();

        logEmojiDebug('reaction record: stored', {
            key: baseRecord.key,
            label: baseRecord.label,
            title: baseRecord.title,
            alt: baseRecord.alt,
            src: baseRecord.src,
            previousCount: existingRecord?.count || 0,
            nextCount: nextRecord.count
        });

        return reactionUsageCounts[baseRecord.key] || null;
    }

    function recordReactionUsageFromButton(button) {
        return recordReactionUsageRecord(extractReactionUsageRecordFromButton(button));
    }

    function getTopReactionUsageRecords(limit = 10) {
        const safeLimit = Math.max(0, Number(limit) || 0);
        if (safeLimit <= 0) return [];

        return Object.values(reactionUsageCounts)
            .map((entry) => normalizeReactionUsageRecord(entry))
            .filter(Boolean)
            .sort((left, right) => (
                (right.count - left.count)
                || (right.lastUsedAt - left.lastUsedAt)
                || String(left.label || left.title || left.alt || left.src).localeCompare(
                    String(right.label || right.title || right.alt || right.src),
                    'fr'
                )
            ))
            .slice(0, safeLimit);
    }

    function buildReactionQuickAccessLabel(record) {
        const emojiValue = normalizeReactionEmojiValue(record?.emojiValue);
        if (emojiValue) return emojiValue;

        const labelSource = String(record?.title || record?.alt || record?.label || '').trim();
        if (!labelSource) return '';

        return Array.from(labelSource).slice(0, 2).join('');
    }

    function getQuickAccessReactionRecords(limit = reactionQuickAccessLimit) {
        const safeLimit = Math.max(0, Number(limit) || 0);
        if (safeLimit <= 0) return [];

        if (quickAccessMode === QUICK_ACCESS_MODE_MANUAL) {
            return getManualReactionFavoriteRecords(safeLimit);
        }

        return getTopReactionUsageRecords(safeLimit * 3)
            .filter((record) => !!record?.src || !!buildReactionQuickAccessLabel(record))
            .slice(0, safeLimit);
    }

    function parseQuickAccessLimit(value, fallback = DEFAULT_EMOJI_QUICK_ACCESS_LIMIT) {
        const parsed = Number.parseInt(String(value ?? '').trim(), 10);
        if (Number.isNaN(parsed)) {
            return clamp(fallback, 0, 9);
        }

        return clamp(parsed, 0, 9);
    }

    function loadEmojiQuickAccessLimit() {
        return parseQuickAccessLimit(
            readStorageItem(STORAGE_KEY_EMOJI_QUICK_ACCESS_LIMIT),
            DEFAULT_EMOJI_QUICK_ACCESS_LIMIT
        );
    }

    function saveEmojiQuickAccessLimit(value) {
        emojiQuickAccessLimit = parseQuickAccessLimit(value, DEFAULT_EMOJI_QUICK_ACCESS_LIMIT);
        writeStorageItem(STORAGE_KEY_EMOJI_QUICK_ACCESS_LIMIT, String(emojiQuickAccessLimit));
        refreshEmojiQuickAccessToolbar();
        resetNativeChatInputActionButtonsLayout(getChatInput(), 6);
    }

    function loadReactionQuickAccessLimit() {
        return parseQuickAccessLimit(
            readStorageItem(STORAGE_KEY_REACTION_QUICK_ACCESS_LIMIT),
            DEFAULT_REACTION_QUICK_ACCESS_LIMIT
        );
    }

    function saveReactionQuickAccessLimit(value) {
        reactionQuickAccessLimit = parseQuickAccessLimit(value, DEFAULT_REACTION_QUICK_ACCESS_LIMIT);
        writeStorageItem(STORAGE_KEY_REACTION_QUICK_ACCESS_LIMIT, String(reactionQuickAccessLimit));
        refreshReactionQuickAccessButtons();
    }

    function shouldSkipDuplicateReactionUsage(recordKey) {
        const normalizedKey = String(recordKey || '').trim();
        if (!normalizedKey) return true;

        const now = Date.now();
        if (
            lastTrackedReactionUsageKey === normalizedKey
            && (now - lastTrackedReactionUsageAt) <= REACTION_USAGE_DUPLICATE_WINDOW_MS
        ) {
            return true;
        }

        lastTrackedReactionUsageKey = normalizedKey;
        lastTrackedReactionUsageAt = now;
        return false;
    }

    function waitForVisibleReactionPicker(maxAttempts = 12, delayMs = 30, attempt = 0) {
        return new Promise((resolve) => {
            const picker = findVisibleReactionPicker();
            if (picker instanceof HTMLElement) {
                resolve(picker);
                return;
            }

            if (attempt >= maxAttempts) {
                resolve(null);
                return;
            }

            window.setTimeout(() => {
                waitForVisibleReactionPicker(maxAttempts, delayMs, attempt + 1).then(resolve);
            }, Math.max(0, Number(delayMs) || 0));
        });
    }

    function getReactionPickerCandidateButtons(picker) {
        if (!(picker instanceof HTMLElement)) return [];

        if (isTr4kerPage()) {
            return Array.from(picker.querySelectorAll('button')).filter((button) => (
                button instanceof HTMLButtonElement &&
                !button.disabled &&
                findReactionUsageButtonFromTarget(button) === button
            ));
        }

        return Array.from(picker.querySelectorAll('div.grid button')).filter((button) => (
            button instanceof HTMLButtonElement &&
            findReactionUsageButtonFromTarget(button) === button
        ));
    }

    function scoreReactionPickerButtonCandidate(button, record, emoji) {
        if (!(button instanceof HTMLButtonElement)) return -1;

        const buttonRecord = extractReactionUsageRecordFromButton(button);
        if (!buttonRecord) return -1;

        const targetKey = String(record?.key || '').trim();
        const targetEmoji = normalizeReactionEmojiValue(emoji);
        const targetLabel = normalizeMentionComparableText(
            record?.label || record?.title || record?.alt || ''
        );
        let score = 1;

        if (targetKey && buttonRecord.key === targetKey) {
            score += 10;
        }

        if (targetEmoji && buttonRecord.emojiValue === targetEmoji) {
            score += 8;
        }

        if (targetLabel) {
            const buttonLabel = normalizeMentionComparableText(
                buttonRecord.label || buttonRecord.title || buttonRecord.alt || ''
            );

            if (buttonLabel === targetLabel) {
                score += 4;
            }
        }

        return score;
    }

    function findReactionPickerButtonForRecord(picker, record, emoji) {
        const candidateButtons = getReactionPickerCandidateButtons(picker);
        let bestMatch = null;

        candidateButtons.forEach((button) => {
            const score = scoreReactionPickerButtonCandidate(button, record, emoji);
            if (score < 0) return;

            if (!bestMatch || score > bestMatch.score) {
                bestMatch = {
                    score,
                    button
                };
            }
        });

        return bestMatch?.button || null;
    }

    async function postFavoriteReactionViaNativeFlow(messageEl, record, emoji) {
        if (!(messageEl instanceof HTMLElement)) {
            throw new Error('Message cible introuvable.');
        }

        const reactionButton = getMessageReactionActionButton(messageEl);
        if (!(reactionButton instanceof HTMLButtonElement) || reactionButton.disabled) {
            throw new Error('Bouton de réaction natif introuvable.');
        }

        reactionButton.click();
        const picker = await waitForVisibleReactionPicker();
        if (!(picker instanceof HTMLElement)) {
            throw new Error('Picker de réaction natif introuvable.');
        }

        const pickerButton = findReactionPickerButtonForRecord(picker, record, emoji);
        if (!(pickerButton instanceof HTMLButtonElement)) {
            throw new Error(`Réaction ${emoji || 'demandée'} introuvable dans le picker natif.`);
        }

        pickerButton.click();

        return {
            ok: true,
            strategy: 'native'
        };
    }

    function resolveReactionApiEmoji(record) {
        return extractReactionEmojiValueFromCandidates(
            record?.emojiValue,
            record?.label,
            record?.alt,
            record?.title
        );
    }

    async function postFavoriteReactionForMessage(messageEl, record) {
        const emoji = resolveReactionApiEmoji(record);
        if (!emoji) {
            return {
                ok: false,
                message: 'Emoji de réaction introuvable pour ce favori.'
            };
        }

        const nativeResult = await postFavoriteReactionViaNativeFlow(messageEl, record, emoji);

        return {
            ok: true,
            message: 'Réaction envoyée.',
            strategy: nativeResult.strategy
        };
    }

    function loadChatInputToolbarInline() {
        return readStorageBoolean(STORAGE_KEY_CHAT_INPUT_TOOLBAR_INLINE, false);
    }

    function saveChatInputToolbarInline(value) {
        chatInputToolbarInline = !!value;
        writeStorageBoolean(STORAGE_KEY_CHAT_INPUT_TOOLBAR_INLINE, chatInputToolbarInline);
    }

    function loadChatInputToolbarAlignRight() {
        return readStorageBoolean(STORAGE_KEY_CHAT_INPUT_TOOLBAR_ALIGN_RIGHT, false);
    }

    function saveChatInputToolbarAlignRight(value) {
        chatInputToolbarAlignRight = !!value;
        writeStorageBoolean(STORAGE_KEY_CHAT_INPUT_TOOLBAR_ALIGN_RIGHT, chatInputToolbarAlignRight);
    }

    function loadImageHostingEnabled() {
        return readStorageBoolean(STORAGE_KEY_IMAGE_HOSTING_ENABLED, false);
    }

    function saveImageHostingEnabled(value) {
        imageHostingEnabled = !!value;
        writeStorageBoolean(STORAGE_KEY_IMAGE_HOSTING_ENABLED, imageHostingEnabled);
    }

    function normalizeImgBbApiKey(value) {
        return String(value || '').trim().replace(/\s+/g, '');
    }

    function loadImgBbApiKey() {
        return normalizeImgBbApiKey(readStorageItem(STORAGE_KEY_IMGBB_API_KEY));
    }

    function saveImgBbApiKey(value) {
        imgbbApiKey = normalizeImgBbApiKey(value);
        if (!imgbbApiKey) {
            removeStorageItem(STORAGE_KEY_IMGBB_API_KEY);
            return;
        }

        writeStorageItem(STORAGE_KEY_IMGBB_API_KEY, imgbbApiKey);
    }

    function normalizeImageHostingExpirationSeconds(value) {
        const parsedValue = Math.max(0, Number.parseInt(String(value ?? ''), 10) || 0);
        return IMAGE_HOSTING_EXPIRATION_VALUES.has(parsedValue)
            ? parsedValue
            : DEFAULT_IMAGE_HOSTING_EXPIRATION_SECONDS;
    }

    function loadImageHostingExpirationSeconds() {
        return normalizeImageHostingExpirationSeconds(readStorageItem(STORAGE_KEY_IMAGE_HOSTING_EXPIRATION_SECONDS));
    }

    function saveImageHostingExpirationSeconds(value) {
        imageHostingExpirationSeconds = normalizeImageHostingExpirationSeconds(value);
        writeStorageItem(STORAGE_KEY_IMAGE_HOSTING_EXPIRATION_SECONDS, String(imageHostingExpirationSeconds));
    }

    function normalizeImageCatalogUrl(value) {
        const rawValue = String(value || '').trim();
        if (!rawValue) return '';
        if (!/^https?:\/\//i.test(rawValue)) return '';

        try {
            const url = new URL(rawValue);
            if (!/^https?:$/i.test(url.protocol)) return '';
            return url.href;
        } catch (e) {
            return '';
        }
    }

    function normalizeImageCatalogRecord(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

        const url = normalizeImageCatalogUrl(value.url || value.displayUrl || value.image?.url);
        if (!url) return null;

        const createdAt = Math.max(0, Number(value.createdAt) || Date.now());
        const expiresAt = Math.max(0, Number(value.expiresAt) || 0);
        const id = String(value.id || `img-${hashString(`${url}:${createdAt}`)}`).trim();

        return {
            id,
            url,
            displayUrl: normalizeImageCatalogUrl(value.displayUrl) || url,
            viewerUrl: normalizeImageCatalogUrl(value.viewerUrl || value.urlViewer) || '',
            deleteUrl: normalizeImageCatalogUrl(value.deleteUrl || value.delete_url) || '',
            thumbUrl: normalizeImageCatalogUrl(value.thumbUrl || value.thumbnailUrl || value.thumb?.url) || url,
            title: String(value.title || value.name || value.filename || 'Image').trim().slice(0, 120) || 'Image',
            source: String(value.source || 'manual').trim().toLowerCase() === 'imgbb' ? 'imgbb' : 'manual',
            mime: String(value.mime || value.type || '').trim().slice(0, 80),
            width: Math.max(0, Number.parseInt(String(value.width ?? 0), 10) || 0),
            height: Math.max(0, Number.parseInt(String(value.height ?? 0), 10) || 0),
            size: Math.max(0, Number.parseInt(String(value.size ?? 0), 10) || 0),
            createdAt,
            expiresAt,
            lastCheckedAt: Math.max(0, Number(value.lastCheckedAt) || 0)
        };
    }

    function pruneImageCatalogRecords(records = []) {
        const now = Date.now();
        const seenUrls = new Set();

        return (Array.isArray(records) ? records : [])
            .map(normalizeImageCatalogRecord)
            .filter(Boolean)
            .filter((record) => !record.expiresAt || record.expiresAt > now)
            .filter((record) => {
                const dedupeKey = record.url.toLowerCase();
                if (seenUrls.has(dedupeKey)) return false;
                seenUrls.add(dedupeKey);
                return true;
            })
            .sort((left, right) => right.createdAt - left.createdAt)
            .slice(0, IMAGE_CATALOG_MAX_RECORDS);
    }

    function loadImageCatalog() {
        return pruneImageCatalogRecords(readStorageJson(STORAGE_KEY_IMAGE_CATALOG, []));
    }

    function saveImageCatalog(nextRecords = imageCatalog) {
        imageCatalog = pruneImageCatalogRecords(nextRecords);
        writeStorageJson(STORAGE_KEY_IMAGE_CATALOG, imageCatalog);
    }

    function getImageCatalogExpirationAt(referenceTime = Date.now(), expirationSeconds = imageHostingExpirationSeconds) {
        const normalizedExpirationSeconds = normalizeImageHostingExpirationSeconds(expirationSeconds);
        return normalizedExpirationSeconds > 0
            ? referenceTime + normalizedExpirationSeconds * 1000
            : 0;
    }

    function addImageCatalogRecord(record) {
        const normalizedRecord = normalizeImageCatalogRecord(record);
        if (!normalizedRecord) {
            return { ok: false, message: 'Lien image invalide.' };
        }

        const nextRecords = [
            {
                ...normalizedRecord,
                createdAt: normalizedRecord.createdAt || Date.now()
            },
            ...imageCatalog.filter((entry) => entry.url.toLowerCase() !== normalizedRecord.url.toLowerCase())
        ];

        saveImageCatalog(nextRecords);
        return { ok: true, message: 'Image ajoutée au catalogue.' };
    }

    function removeImageCatalogRecord(recordId) {
        const normalizedRecordId = String(recordId || '').trim();
        if (!normalizedRecordId) return { ok: false, message: 'Image introuvable.' };

        const previousLength = imageCatalog.length;
        saveImageCatalog(imageCatalog.filter((record) => record.id !== normalizedRecordId));

        return previousLength === imageCatalog.length
            ? { ok: false, message: 'Image introuvable.' }
            : { ok: true, message: 'Image retirée du catalogue.' };
    }

    function normalizeAfkAutoReplyMessage(value) {
        const normalizedMessage = extractSavedPhraseStringValue(value)
            .replace(/\r\n?/g, '\n')
            .trim()
            .slice(0, MAX_AFK_AUTO_REPLY_MESSAGE_LENGTH);
        return normalizedMessage || DEFAULT_AFK_AUTO_REPLY_MESSAGE;
    }

    function normalizeAfkPerUserReplyAtMap(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

        return Object.fromEntries(
            Object.entries(value)
                .map(([username, timestamp]) => [normalizeName(username), Math.max(0, Number(timestamp) || 0)])
                .filter(([username, timestamp]) => !!username && timestamp > 0)
        );
    }

    /**
     * Garantit une forme cohérente de l'état AFK, quelle que soit la source des données.
     *
     * @param {unknown} value
     * @returns {AfkState}
     */
    function normalizeAfkState(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return {
                enabled: false,
                autoReplyEnabled: false,
                muteMentionSound: false,
                ownerTabId: '',
                contextKey: '',
                contextLabel: '',
                username: normalizeName(mentionSettings?.username || ''),
                autoReplyMessage: DEFAULT_AFK_AUTO_REPLY_MESSAGE,
                activatedAt: 0,
                lastAutoReplyAt: 0,
                perUserReplyAt: {}
            };
        }

        return {
            enabled: value.enabled === true,
            autoReplyEnabled: value.autoReplyEnabled === true,
            muteMentionSound: value.muteMentionSound === true,
            ownerTabId: String(value.ownerTabId || '').trim(),
            contextKey: String(value.contextKey || '').trim(),
            contextLabel: String(value.contextLabel || '').trim(),
            username: normalizeName(value.username || mentionSettings?.username || ''),
            autoReplyMessage: normalizeAfkAutoReplyMessage(value.autoReplyMessage),
            activatedAt: Math.max(0, Number(value.activatedAt) || 0),
            lastAutoReplyAt: Math.max(0, Number(value.lastAutoReplyAt) || 0),
            perUserReplyAt: normalizeAfkPerUserReplyAtMap(value.perUserReplyAt)
        };
    }

    function loadAfkState() {
        return normalizeAfkState(readStorageJson(STORAGE_KEY_AFK_STATE, null));
    }

    function createAfkTabId() {
        if (window.crypto?.randomUUID) {
            return window.crypto.randomUUID();
        }

        return `afk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    }

    function loadAfkTabId() {
        const existingValue = String(readStorageItem(SESSION_STORAGE_KEY_AFK_TAB_ID, sessionStorage) || '').trim();
        if (existingValue) return existingValue;

        const nextValue = createAfkTabId();
        if (!writeStorageItem(SESSION_STORAGE_KEY_AFK_TAB_ID, nextValue, sessionStorage)) {
            return createAfkTabId();
        }

        return nextValue;
    }

    function saveAfkState(nextState) {
        afkState = normalizeAfkState(nextState);
        writeStorageJson(STORAGE_KEY_AFK_STATE, afkState);
    }

    function buildAfkMessageKey(signature) {
        if (!signature) return '';

        const hash = String(signature.hash || '').trim();
        const timestampKey = Math.max(0, Number(signature.messageTimestampKey) || 0);
        if (!hash) return '';

        return `${hash}:${timestampKey}`;
    }

    /**
     * Convertit une entrée AFK brute en enregistrement complet, filtré et prêt au rendu.
     *
     * @param {unknown} value
     * @returns {AfkActivityRecord|null}
     */
    function normalizeAfkActivityRecord(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

        const signatureHash = String(value.signatureHash || '').trim();
        const signatureTimestampKey = Math.max(0, Number(value.signatureTimestampKey) || 0);
        const messageText = String(value.messageText || '').trim();
        const replyContextText = String(value.replyContextText || '').trim();
        const username = normalizeName(value.username || '');
        const contextKey = String(value.contextKey || '').trim();
        const contextLabel = String(value.contextLabel || '').trim();

        if (!signatureHash || !username || (!messageText && !replyContextText)) {
            return null;
        }

        return {
            id: String(value.id || `${signatureHash}-${signatureTimestampKey || 'na'}`).trim(),
            contextKey,
            contextLabel,
            username,
            displayUsername: String(value.displayUsername || value.username || '').trim() || username,
            messageText,
            replyContextText,
            reason: value.reason === 'reply' ? 'reply' : (value.reason === 'mention+reply' ? 'mention+reply' : 'mention'),
            messageTimestamp: String(value.messageTimestamp || '').trim(),
            capturedAt: Math.max(0, Number(value.capturedAt) || Date.now()),
            isRead: value.isRead === true || Math.max(0, Number(value.readAt) || 0) > 0,
            readAt: Math.max(0, Number(value.readAt) || 0),
            autoReplySent: value.autoReplySent === true,
            autoReplyStatus: String(value.autoReplyStatus || '').trim(),
            autoReplyText: String(value.autoReplyText || '').trim(),
            signatureHash,
            signatureTimestampKey
        };
    }

    function sortAfkActivityRecords(records = []) {
        return records
            .slice()
            .sort((a, b) =>
                Number(a.isRead) - Number(b.isRead) ||
                (b.isRead ? Math.max(0, Number(b.readAt) || Number(b.capturedAt) || 0) : Math.max(0, Number(b.capturedAt) || 0)) -
                (a.isRead ? Math.max(0, Number(a.readAt) || Number(a.capturedAt) || 0) : Math.max(0, Number(a.capturedAt) || 0)) ||
                (Number(b.capturedAt) || 0) - (Number(a.capturedAt) || 0)
            );
    }

    function pruneAfkActivityRecords(records = []) {
        const normalizedRecords = records
            .map(normalizeAfkActivityRecord)
            .filter(Boolean);

        const unreadRecords = normalizedRecords.filter((record) => !record.isRead);
        const readRecords = normalizedRecords
            .filter((record) => record.isRead)
            .sort((a, b) =>
                Math.max(0, Number(b.readAt) || Number(b.capturedAt) || 0) -
                Math.max(0, Number(a.readAt) || Number(a.capturedAt) || 0)
            )
            .slice(0, MAX_AFK_READ_ACTIVITY_RECORDS);

        return sortAfkActivityRecords([...unreadRecords, ...readRecords]);
    }

    function loadAfkActivityRecords() {
        const parsed = readStorageJson(STORAGE_KEY_AFK_ACTIVITY, []);
        if (!Array.isArray(parsed)) return [];

        return pruneAfkActivityRecords(parsed);
    }

    function saveAfkActivityRecords() {
        afkActivityRecords = pruneAfkActivityRecords(afkActivityRecords);

        writeStorageJson(STORAGE_KEY_AFK_ACTIVITY, afkActivityRecords);
    }

    function normalizeAfkPanelPosition(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

        const leftPx = Math.max(0, Math.round(Number(value.leftPx) || 0));
        const topPx = Math.max(0, Math.round(Number(value.topPx) || 0));

        if (!Number.isFinite(leftPx) || !Number.isFinite(topPx)) return null;

        return { leftPx, topPx };
    }

    function loadAfkPanelPosition() {
        return normalizeAfkPanelPosition(readStorageJson(STORAGE_KEY_AFK_PANEL_POSITION, null));
    }

    function saveAfkPanelPosition(position) {
        const normalizedPosition = normalizeAfkPanelPosition(position);
        afkPanelPosition = normalizedPosition;

        if (!normalizedPosition) {
            removeStorageItem(STORAGE_KEY_AFK_PANEL_POSITION);
            return;
        }

        writeStorageJson(STORAGE_KEY_AFK_PANEL_POSITION, normalizedPosition);
    }

    function loadAfkPanelHidden() {
        return readStorageBoolean(STORAGE_KEY_AFK_PANEL_HIDDEN, false);
    }

    function saveAfkPanelHidden(value) {
        afkPanelHidden = !!value;

        writeStorageBoolean(STORAGE_KEY_AFK_PANEL_HIDDEN, afkPanelHidden);
    }

    function applyAfkPanelPosition(panel) {
        if (!(panel instanceof HTMLElement) || !afkPanelPosition) return;

        panel.style.left = `${Math.max(0, afkPanelPosition.leftPx)}px`;
        panel.style.top = `${Math.max(0, afkPanelPosition.topPx)}px`;
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
    }

    function constrainAfkPanelToViewport(panel, persistPosition = true) {
        if (!(panel instanceof HTMLElement)) return;

        const margin = 12;
        const rect = panel.getBoundingClientRect();
        const currentLeft = panel.style.left && panel.style.left !== 'auto'
            ? Number.parseFloat(panel.style.left) || rect.left
            : rect.left;
        const currentTop = panel.style.top && panel.style.top !== 'auto'
            ? Number.parseFloat(panel.style.top) || rect.top
            : rect.top;
        const nextLeft = clamp(currentLeft, margin, Math.max(margin, window.innerWidth - rect.width - margin));
        const nextTop = clamp(currentTop, margin, Math.max(margin, window.innerHeight - rect.height - margin));

        panel.style.left = `${nextLeft}px`;
        panel.style.top = `${nextTop}px`;
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';

        if (persistPosition) {
            saveAfkPanelPosition({
                leftPx: nextLeft,
                topPx: nextTop
            });
        }
    }

    function formatSavedPhrasesCountLabel(count = savedPhrases.length) {
        const safeCount = Math.max(0, Number(count) || 0);
        return `${safeCount} phrase${safeCount > 1 ? 's' : ''}`;
    }

    function formatSavedPhrasesSummaryLabel() {
        return `${savedPhrasesEnabled ? 'Fonction active' : 'Fonction désactivée'} · ${formatSavedPhrasesCountLabel()} enregistrée${savedPhrases.length > 1 ? 's' : ''}`;
    }

    function formatSavedPhraseKeywordsLabel(keywords = []) {
        const safeKeywords = normalizeSavedPhraseKeywords(keywords);
        return safeKeywords.length > 0 ? safeKeywords.join(', ') : 'Aucun mot-clé';
    }

    function formatSavedPhraseLengthLabel(text = '') {
        return `${String(text ?? '').length}/${MAX_SAVED_PHRASE_LENGTH} caractères`;
    }

    function formatSavedPhraseKeywordsInputValue(keywords = []) {
        return normalizeSavedPhraseKeywords(keywords).join(', ');
    }

    function truncateSavedPhrasePreviewText(text = '', maxLength = 250) {
        const safeText = String(text ?? '');
        const safeMaxLength = Math.max(4, Number(maxLength) || 250);

        if (safeText.length <= safeMaxLength) {
            return safeText;
        }

        return `${safeText.slice(0, safeMaxLength - 3).trimEnd()}...`;
    }

    function normalizeSavedPhraseMatchText(value) {
        return normalizeMentionComparableText(value)
            .replace(/[^\p{L}\p{N}@#]+/gu, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function tokenizeSavedPhraseMatchText(value) {
        const normalizedText = normalizeSavedPhraseMatchText(value);
        if (!normalizedText) return [];

        return Array.from(new Set(
            normalizedText
                .split(' ')
                .map((token) => token.trim())
                .filter((token) => token.length >= 3)
        ));
    }

    function getChatInputCurrentValue(input = getChatInput()) {
        if (!(input instanceof HTMLElement)) return '';

        if (input.isContentEditable) {
            return String(input.textContent || '').trim();
        }

        if ('value' in input) {
            return String(input.value || '').trim();
        }

        return '';
    }

    function clearSavedPhrasesReplyContext() {
        savedPhrasesReplyContext = null;
    }

    function setSavedPhrasesReplyContextFromMessage(messageEl) {
        if (!(messageEl instanceof HTMLElement) || !isChatPage()) return;

        const username = normalizeName(getLogicalUsername(messageEl) || '');
        const messageText = getMessageTextContent(messageEl);
        const replyContextText = getMessageReplyContextText(messageEl);

        if (!username && !messageText && !replyContextText) return;

        savedPhrasesReplyContext = {
            contextKey: getCurrentChatContextKey(),
            username,
            messageText,
            replyContextText,
            capturedAt: Date.now()
        };

        if (savedPhrasesEnabled) {
            injectSavedPhrasesToolbar();
        }
    }

    function getSavedPhrasesRankingContext(input = getChatInput()) {
        const inputText = getChatInputCurrentValue(input);
        const replyContextIsUsable =
            isChatPage() &&
            savedPhrasesReplyContext &&
            savedPhrasesReplyContext.contextKey === getCurrentChatContextKey() &&
            Date.now() - savedPhrasesReplyContext.capturedAt <= SAVED_PHRASES_REPLY_CONTEXT_MAX_AGE_MS;

        const replyText = replyContextIsUsable
            ? [
                savedPhrasesReplyContext.username,
                savedPhrasesReplyContext.replyContextText,
                savedPhrasesReplyContext.messageText
            ]
                .filter(Boolean)
                .join(' ')
            : '';

        return {
            inputText,
            inputNormalizedText: normalizeSavedPhraseMatchText(inputText),
            inputTokens: new Set(tokenizeSavedPhraseMatchText(inputText)),
            replyText,
            replyNormalizedText: normalizeSavedPhraseMatchText(replyText),
            replyTokens: new Set(tokenizeSavedPhraseMatchText(replyText))
        };
    }

    function getSavedPhraseMatchScore(phrase, context) {
        const normalizedPhrase = normalizeSavedPhraseRecord(phrase, true);
        if (!normalizedPhrase) {
            return {
                score: 0,
                matchedKeywords: [],
                matchedPhraseContent: false,
                phraseReplyOverlap: 0,
                phraseInputOverlap: 0
            };
        }

        let score = 0;
        let phraseReplyOverlap = 0;
        let phraseInputOverlap = 0;
        let matchedPhraseContent = false;
        const matchedKeywords = [];
        const inputText = context?.inputNormalizedText || '';
        const replyText = context?.replyNormalizedText || '';
        const inputTokens = context?.inputTokens instanceof Set ? context.inputTokens : new Set();
        const replyTokens = context?.replyTokens instanceof Set ? context.replyTokens : new Set();
        const normalizedPhraseText = normalizeSavedPhraseMatchText(normalizedPhrase.text);
        const phraseTextTokens = tokenizeSavedPhraseMatchText(normalizedPhrase.text);

        normalizedPhrase.keywords.forEach((keyword) => {
            const normalizedKeyword = normalizeSavedPhraseMatchText(keyword);
            if (!normalizedKeyword) return;

            const keywordTokens = tokenizeSavedPhraseMatchText(normalizedKeyword);
            let keywordMatched = false;

            if (replyText) {
                if (replyText.includes(normalizedKeyword)) {
                    score += normalizedKeyword.includes(' ') ? 18 : 14;
                    keywordMatched = true;
                } else if (keywordTokens.length > 0 && keywordTokens.every((token) => replyTokens.has(token))) {
                    score += 11 + keywordTokens.length;
                    keywordMatched = true;
                }
            }

            if (!keywordMatched && inputText) {
                if (inputText.includes(normalizedKeyword)) {
                    score += normalizedKeyword.includes(' ') ? 10 : 8;
                    keywordMatched = true;
                } else if (keywordTokens.length > 0 && keywordTokens.every((token) => inputTokens.has(token))) {
                    score += 6 + keywordTokens.length;
                    keywordMatched = true;
                }
            }

            if (keywordMatched) {
                matchedKeywords.push(keyword);
            }
        });

        if (normalizedPhraseText) {
            if (replyText) {
                if (replyText.includes(normalizedPhraseText)) {
                    score += normalizedPhraseText.includes(' ') ? 16 : 12;
                    matchedPhraseContent = true;
                } else if (phraseTextTokens.length > 1 && phraseTextTokens.every((token) => replyTokens.has(token))) {
                    score += 8 + phraseTextTokens.length;
                    matchedPhraseContent = true;
                }
            }

            if (!matchedPhraseContent && inputText) {
                if (inputText.includes(normalizedPhraseText)) {
                    score += normalizedPhraseText.includes(' ') ? 10 : 7;
                    matchedPhraseContent = true;
                } else if (phraseTextTokens.length > 1 && phraseTextTokens.every((token) => inputTokens.has(token))) {
                    score += 5 + phraseTextTokens.length;
                    matchedPhraseContent = true;
                }
            }
        }

        phraseTextTokens.forEach((token) => {
            if (replyTokens.has(token)) {
                phraseReplyOverlap += 1;
            }
            if (inputTokens.has(token)) {
                phraseInputOverlap += 1;
            }
        });

        score += Math.min(phraseReplyOverlap, 6) * 2;
        score += Math.min(phraseInputOverlap, 6);

        return {
            score,
            matchedKeywords,
            matchedPhraseContent,
            phraseReplyOverlap,
            phraseInputOverlap
        };
    }

    function computeSavedPhraseMatchPercent(score) {
        const numericScore = Number(score) || 0;
        if (numericScore <= 0) return 0;

        return clamp(Math.round((1 - Math.exp(-numericScore / 14)) * 100), 0, 100);
    }

    /**
     * Retourne les réponses rapides triées selon le contexte courant du chat.
     *
     * @param {HTMLElement|null} [input=getChatInput()]
     * @returns {RankedSavedPhraseEntry[]}
     */
    function getRankedSavedPhrases(input = getChatInput()) {
        const rankingContext = getSavedPhrasesRankingContext(input);
        const rankedPhrases = savedPhrases
            .map((entry, index) => {
                const phrase = normalizeSavedPhraseRecord(entry, true);
                if (!phrase) return null;

                if (phrase !== entry) {
                    savedPhrases[index] = phrase;
                }

                const matchData = getSavedPhraseMatchScore(phrase, rankingContext);
                return {
                    phrase,
                    originalIndex: index,
                    matchPercent: computeSavedPhraseMatchPercent(matchData.score),
                    ...matchData
                };
            })
            .filter(Boolean);

        const bestScore = rankedPhrases.reduce((maxScore, entry) => Math.max(maxScore, entry.score), 0);
        if (bestScore <= 0) {
            return rankedPhrases.sort((a, b) => a.originalIndex - b.originalIndex);
        }

        return rankedPhrases.sort((a, b) =>
            b.score - a.score ||
            Number(b.matchedPhraseContent) - Number(a.matchedPhraseContent) ||
            b.matchedKeywords.length - a.matchedKeywords.length ||
            b.phraseReplyOverlap - a.phraseReplyOverlap ||
            b.phraseInputOverlap - a.phraseInputOverlap ||
            a.originalIndex - b.originalIndex
        );
    }

    function buildSavedPhrasesExportPayload() {
        return {
            version: SAVED_PHRASES_EXPORT_VERSION,
            exportedAt: new Date().toISOString(),
            source: 'Tr4ker Chat - Shoutbox 3.0',
            phrases: savedPhrases
                .map((phrase) => normalizeSavedPhraseRecord(phrase, true))
                .filter(Boolean)
                .map((phrase) => ({
                    text: phrase.text,
                    keywords: [...phrase.keywords]
                }))
        };
    }

    function downloadSavedPhrasesExport() {
        try {
            const exportPayload = JSON.stringify(buildSavedPhrasesExportPayload(), null, 2);
            const blob = new Blob([exportPayload], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const exportDate = new Date().toISOString().slice(0, 10);

            link.href = url;
            link.download = `torr9-reponses-rapides-${exportDate}.json`;
            link.style.display = 'none';

            document.body?.appendChild(link);
            link.click();
            link.remove();

            window.setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 0);

            return { ok: true, message: 'Export JSON téléchargé.' };
        } catch (e) {
            return { ok: false, message: 'Impossible de générer l’export JSON.' };
        }
    }

    function extractSavedPhraseImportEntries(payload) {
        if (Array.isArray(payload)) {
            return payload;
        }

        if (!payload || typeof payload !== 'object') {
            return null;
        }

        if (Array.isArray(payload.phrases)) {
            return payload.phrases;
        }

        if (Array.isArray(payload.savedPhrases)) {
            return payload.savedPhrases;
        }

        if (Array.isArray(payload.items)) {
            return payload.items;
        }

        return null;
    }

    function importSavedPhrases(payload) {
        const importedEntries = extractSavedPhraseImportEntries(payload);
        if (!Array.isArray(importedEntries)) {
            return { ok: false, message: 'Format JSON invalide pour les réponses rapides.' };
        }

        const existingEntriesByText = new Map();
        savedPhrases.forEach((entry, index) => {
            const normalizedEntry = normalizeSavedPhraseRecord(entry, true);
            if (!normalizedEntry) return;

            if (normalizedEntry !== entry) {
                savedPhrases[index] = normalizedEntry;
            }

            if (!existingEntriesByText.has(normalizedEntry.text)) {
                existingEntriesByText.set(normalizedEntry.text, savedPhrases[index]);
            }
        });

        let addedCount = 0;
        let updatedCount = 0;
        let unchangedCount = 0;
        let invalidCount = 0;

        importedEntries.forEach((entry) => {
            const normalizedEntry = normalizeSavedPhraseRecord(entry, true);
            if (!normalizedEntry) {
                invalidCount += 1;
                return;
            }

            const existingEntry = existingEntriesByText.get(normalizedEntry.text);
            if (!existingEntry) {
                const nextEntry = {
                    text: normalizedEntry.text,
                    keywords: [...normalizedEntry.keywords]
                };

                savedPhrases.push(nextEntry);
                existingEntriesByText.set(nextEntry.text, nextEntry);
                addedCount += 1;
                return;
            }

            const mergedKeywords = mergeSavedPhraseKeywords(existingEntry.keywords, normalizedEntry.keywords);
            if (mergedKeywords.length === existingEntry.keywords.length) {
                unchangedCount += 1;
                return;
            }

            existingEntry.keywords = mergedKeywords;
            updatedCount += 1;
        });

        const validCount = addedCount + updatedCount + unchangedCount;
        if (validCount === 0) {
            return { ok: false, message: 'Import impossible : aucune réponse exploitable trouvée.' };
        }

        if (addedCount > 0 || updatedCount > 0) {
            saveSavedPhrases();
            injectSavedPhrasesToolbar();
        }

        const summaryParts = [];
        if (addedCount > 0) {
            summaryParts.push(`${addedCount} ajoutée${addedCount > 1 ? 's' : ''}`);
        }
        if (updatedCount > 0) {
            summaryParts.push(`${updatedCount} enrichie${updatedCount > 1 ? 's' : ''}`);
        }
        if (unchangedCount > 0) {
            summaryParts.push(`${unchangedCount} déjà présente${unchangedCount > 1 ? 's' : ''}`);
        }
        if (invalidCount > 0) {
            summaryParts.push(`${invalidCount} ignorée${invalidCount > 1 ? 's' : ''}`);
        }

        return {
            ok: true,
            message: `Import terminé : ${summaryParts.join(', ')}.`
        };
    }

    function buildScriptConfigExportPayload() {
        const storage = {};

        SCRIPT_CONFIG_STORAGE_KEYS.forEach((storageKey) => {
            const rawValue = readStorageItem(storageKey);
            if (rawValue !== null) {
                storage[storageKey] = rawValue;
            }
        });

        return {
            version: SCRIPT_CONFIG_EXPORT_VERSION,
            exportedAt: new Date().toISOString(),
            source: 'Tr4ker Chat - Shoutbox 3.0',
            storage,
            afkConfig: {
                autoReplyMessage: normalizeAfkAutoReplyMessage(afkState.autoReplyMessage),
                autoReplyEnabled: afkState.autoReplyEnabled === true,
                muteMentionSound: afkState.muteMentionSound === true
            }
        };
    }

    function downloadScriptConfigExport() {
        try {
            const exportPayload = JSON.stringify(buildScriptConfigExportPayload(), null, 2);
            const blob = new Blob([exportPayload], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const exportDate = new Date().toISOString().slice(0, 10);

            link.href = url;
            link.download = `tr4ker-chat-config-${exportDate}.json`;
            link.style.display = 'none';

            document.body?.appendChild(link);
            link.click();
            link.remove();

            window.setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 0);

            return { ok: true, message: 'Sauvegarde de configuration téléchargée.' };
        } catch (e) {
            return { ok: false, message: 'Impossible de générer la sauvegarde de configuration.' };
        }
    }

    function reloadScriptConfigurationFromStorage() {
        debugMode = loadDebugMode();
        homeChatCollapsed = loadHomeChatCollapsed();
        statsDisplayMode = loadStatsDisplayMode();
        statsHidden = loadStatsHidden();
        mentionSettings = loadMentionSettings();
        chatFontScale = loadChatFontScale();
        chatScrollbarEnabled = loadChatScrollbarEnabled();
        messageActionsLeftEnabled = loadMessageActionsLeftEnabled();
        linkifyUrlsEnabled = loadLinkifyUrlsEnabled();
        embedUrlImagesEnabled = loadEmbedUrlImagesEnabled();
        savedPhrasesEnabled = loadSavedPhrasesEnabled();
        savedPhrasesReplaceInput = loadSavedPhrasesReplaceInput();
        klipyGifsEnabled = loadKlipyGifsEnabled();
        emojiQuickAccessLimit = loadEmojiQuickAccessLimit();
        reactionQuickAccessLimit = loadReactionQuickAccessLimit();
        quickAccessMode = loadQuickAccessMode();
        manualEmojiFavorites = loadManualEmojiFavorites();
        manualReactionFavorites = loadManualReactionFavorites();
        chatInputToolbarInline = loadChatInputToolbarInline();
        chatInputToolbarAlignRight = loadChatInputToolbarAlignRight();
        imageHostingEnabled = loadImageHostingEnabled();
        imgbbApiKey = loadImgBbApiKey();
        imageHostingExpirationSeconds = loadImageHostingExpirationSeconds();
        imageCatalog = loadImageCatalog();
        afkState = loadAfkState();
        afkPanelPosition = loadAfkPanelPosition();
        afkPanelHidden = loadAfkPanelHidden();

        hiddenUsers.clear();
        loadHiddenUsers().forEach((username) => {
            hiddenUsers.add(username);
        });

        Object.keys(highlightedUsers).forEach((username) => {
            delete highlightedUsers[username];
        });
        Object.assign(highlightedUsers, loadHighlightedUsers());

        const reloadedSavedPhrases = loadSavedPhrases();
        savedPhrases.splice(0, savedPhrases.length, ...reloadedSavedPhrases);
        if (savedPhrasesStorageNeedsRepair) {
            saveSavedPhrases();
        }
    }

    function applyReloadedScriptConfiguration() {
        syncHomepageCollapseUi(true);
        applyStatsBoxDisplayModeState();
        applyBoxPosition(loadPosition());
        constrainStatsBoxToViewport(false, false);
        applyStatsBoxVisibilityState();
        applyChatPageScrollbarState();
        applyMessageActionsPositionState();
        applyHomeChatPopoverState();
        applyNativeChatInputPopoverState();
        applyChatInputToolbarAlignmentState();

        injectEmojiQuickAccessToolbar();

        if (savedPhrasesEnabled) {
            injectSavedPhrasesToolbar();
        } else {
            removeSavedPhrasesToolbar();
        }

        if (klipyGifsEnabled) {
            injectKlipyGifToolbar();
        } else {
            removeKlipyGifToolbar();
        }

        if (imageHostingEnabled) {
            injectImageUploadToolbar();
        } else {
            removeImageUploadToolbar();
        }

        processAllMessages();
        refreshReactionQuickAccessButtons();
        renderAfkPanel();
        updateStatsBox();
    }

    function importScriptConfiguration(payload) {
        const importedStorage = payload?.storage;
        if (!importedStorage || typeof importedStorage !== 'object' || Array.isArray(importedStorage)) {
            return { ok: false, message: 'Format JSON invalide pour la configuration du script.' };
        }

        let importedLegacyKeyCount = 0;
        SCRIPT_CONFIG_STORAGE_KEYS.forEach((storageKey) => {
            const legacyStorageKey = storageKey.replace(/t4/g, 'torr9');
            const rawValue = typeof importedStorage[storageKey] === 'string'
                ? importedStorage[storageKey]
                : importedStorage[legacyStorageKey];

            if (typeof importedStorage[storageKey] !== 'string' && typeof rawValue === 'string') {
                importedLegacyKeyCount += 1;
            }

            if (typeof rawValue === 'string') {
                writeStorageItem(storageKey, rawValue);
                return;
            }

            removeStorageItem(storageKey);
        });

        reloadScriptConfigurationFromStorage();

        saveAfkState({
            ...normalizeAfkState(null),
            username: normalizeName(mentionSettings?.username || ''),
            autoReplyMessage: normalizeAfkAutoReplyMessage(payload?.afkConfig?.autoReplyMessage),
            autoReplyEnabled: payload?.afkConfig?.autoReplyEnabled === true,
            muteMentionSound: payload?.afkConfig?.muteMentionSound === true
        });

        afkActivityRecords = [];
        removeStorageItem(STORAGE_KEY_AFK_ACTIVITY);
        clearAfkReplayProtection();
        applyReloadedScriptConfiguration();

        return {
            ok: true,
            message: importedLegacyKeyCount > 0
                ? `Configuration Torr9 importée (${importedLegacyKeyCount} réglage${importedLegacyKeyCount > 1 ? 's' : ''} migré${importedLegacyKeyCount > 1 ? 's' : ''}).`
                : 'Configuration du script importée.'
        };
    }

    function addSavedPhrase(phraseRaw, keywordsRaw = []) {
        const phrase = normalizeSavedPhraseText(phraseRaw);
        if (!phrase) {
            return { ok: false, message: 'Phrase vide.' };
        }

        if (phrase.length > MAX_SAVED_PHRASE_LENGTH) {
            return { ok: false, message: `Phrase trop longue (${phrase.length}/${MAX_SAVED_PHRASE_LENGTH}).` };
        }

        const keywords = normalizeSavedPhraseKeywords(keywordsRaw);
        const existingPhrase = savedPhrases.find((entry) => entry.text === phrase);

        if (existingPhrase) {
            const mergedKeywords = mergeSavedPhraseKeywords(existingPhrase.keywords, keywords);

            if (mergedKeywords.length === existingPhrase.keywords.length) {
                return { ok: false, message: 'Cette phrase existe déjà.' };
            }

            existingPhrase.keywords = mergedKeywords;
            saveSavedPhrases();
            injectSavedPhrasesToolbar();

            return { ok: true, message: 'Mots-clés ajoutés à la phrase existante.' };
        }

        savedPhrases.push({
            text: phrase,
            keywords
        });
        saveSavedPhrases();
        injectSavedPhrasesToolbar();

        return {
            ok: true,
            message: keywords.length > 0 ? 'Phrase et mots-clés ajoutés.' : 'Phrase ajoutée.'
        };
    }

    function removeSavedPhraseAt(index) {
        const numericIndex = Number(index);
        if (!Number.isInteger(numericIndex) || numericIndex < 0 || numericIndex >= savedPhrases.length) {
            return { ok: false, message: 'Phrase introuvable.' };
        }

        savedPhrases.splice(numericIndex, 1);
        saveSavedPhrases();
        injectSavedPhrasesToolbar();

        return { ok: true, message: 'Phrase supprimée.' };
    }

    function updateSavedPhraseAt(index, phraseRaw, keywordsRaw = []) {
        const numericIndex = Number(index);
        if (!Number.isInteger(numericIndex) || numericIndex < 0 || numericIndex >= savedPhrases.length) {
            return { ok: false, message: 'Phrase introuvable.' };
        }

        const phrase = normalizeSavedPhraseText(phraseRaw);
        if (!phrase) {
            return { ok: false, message: 'Phrase vide.' };
        }

        if (phrase.length > MAX_SAVED_PHRASE_LENGTH) {
            return { ok: false, message: `Phrase trop longue (${phrase.length}/${MAX_SAVED_PHRASE_LENGTH}).` };
        }

        const keywords = normalizeSavedPhraseKeywords(keywordsRaw);
        const currentEntry = normalizeSavedPhraseRecord(savedPhrases[numericIndex], true);
        if (!currentEntry) {
            return { ok: false, message: 'Phrase introuvable.' };
        }

        const duplicateIndex = savedPhrases.findIndex((entry, entryIndex) => {
            if (entryIndex === numericIndex) return false;

            const normalizedEntry = normalizeSavedPhraseRecord(entry, true);
            return normalizedEntry?.text === phrase;
        });

        if (duplicateIndex !== -1) {
            return { ok: false, message: 'Une autre phrase utilise déjà ce texte.' };
        }

        const currentKeywordsValue = formatSavedPhraseKeywordsInputValue(currentEntry.keywords);
        const nextKeywordsValue = formatSavedPhraseKeywordsInputValue(keywords);
        if (currentEntry.text === phrase && currentKeywordsValue === nextKeywordsValue) {
            return { ok: false, message: 'Aucun changement détecté.' };
        }

        savedPhrases[numericIndex] = {
            text: phrase,
            keywords
        };
        saveSavedPhrases();
        injectSavedPhrasesToolbar();

        return {
            ok: true,
            message: 'Phrase mise à jour.'
        };
    }

    function loadDebugMode() {
        return readStorageBoolean(STORAGE_KEY_DEBUG, false);
    }

    function saveDebugMode(value) {
        debugMode = !!value;
        writeStorageBoolean(STORAGE_KEY_DEBUG, debugMode);
    }

    function loadHomeChatCollapsed() {
        return readStorageBoolean(STORAGE_KEY_HOME_COLLAPSED, false);
    }

    function saveHomeChatCollapsed(value) {
        homeChatCollapsed = !!value;
        writeStorageBoolean(STORAGE_KEY_HOME_COLLAPSED, homeChatCollapsed);
    }

    function normalizeStatsDisplayMode(value) {
        const rawValue = String(value || '').trim().toLowerCase();

        if (rawValue === '1' || rawValue === 'true' || rawValue === STATS_DISPLAY_MODE_COMPACT) {
            return STATS_DISPLAY_MODE_COMPACT;
        }

        if (rawValue === STATS_DISPLAY_MODE_MINI) {
            return STATS_DISPLAY_MODE_MINI;
        }

        return STATS_DISPLAY_MODE_EXPANDED;
    }

    function loadStatsDisplayMode() {
        return normalizeStatsDisplayMode(readStorageItem(getStatsCollapsedStorageKey()));
    }

    function saveStatsDisplayMode(value) {
        statsDisplayMode = normalizeStatsDisplayMode(value);
        writeStorageItem(getStatsCollapsedStorageKey(), statsDisplayMode);
    }

    function loadStatsHidden() {
        return readStorageBoolean(getStatsHiddenStorageKey(), false);
    }

    function saveStatsHidden(value) {
        statsHidden = !!value;
        writeStorageBoolean(getStatsHiddenStorageKey(), statsHidden);
    }

    function getDefaultMentionSettings() {
        return {
            username: '',
            color: DEFAULT_MENTION_COLOR,
            opacityPercent: DEFAULT_MENTION_OPACITY,
            blinkSeconds: DEFAULT_MENTION_BLINK_SECONDS,
            keepHighlightAfterBlink: DEFAULT_MENTION_KEEP_HIGHLIGHT,
            includeReplyContext: DEFAULT_MENTION_INCLUDE_REPLY_CONTEXT,
            soundEnabled: DEFAULT_MENTION_SOUND_ENABLED,
            soundScope: DEFAULT_MENTION_SOUND_SCOPE,
            soundStyle: DEFAULT_MENTION_SOUND_STYLE,
            soundCustomUrl: DEFAULT_MENTION_SOUND_CUSTOM_URL,
            soundCooldownSeconds: DEFAULT_MENTION_SOUND_COOLDOWN_SECONDS
        };
    }

    function normalizeMentionSettings(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return getDefaultMentionSettings();
        }

        const parsedBlinkSeconds = Number(value.blinkSeconds);
        const soundScope = normalizeMentionSoundScope(
            value.soundScope ?? (value.soundEnabled === true ? 'both' : 'off')
        );

        return {
            username: normalizeName(value.username || ''),
            color: normalizeHexColor(value.color, DEFAULT_MENTION_COLOR),
            opacityPercent: parseOpacityPercentInput(value.opacityPercent, DEFAULT_MENTION_OPACITY),
            // Les anciens réglages Torr9 peuvent ne pas contenir ce champ :
            // dans ce cas, conserver le comportement historique (6 secondes)
            // plutôt que de désactiver le clignotement avec une valeur 0.
            blinkSeconds: Number.isFinite(parsedBlinkSeconds)
                ? clamp(parsedBlinkSeconds, 0, 30)
                : DEFAULT_MENTION_BLINK_SECONDS,
            keepHighlightAfterBlink: value.keepHighlightAfterBlink !== false,
            includeReplyContext: value.includeReplyContext === true,
            soundEnabled: isMentionSoundScopeEnabled(soundScope),
            soundScope,
            soundStyle: normalizeMentionSoundStyle(value.soundStyle),
            soundCustomUrl: normalizeMentionSoundCustomUrl(value.soundCustomUrl),
            soundCooldownSeconds: clamp(Number(value.soundCooldownSeconds) || 0, 0, 300)
        };
    }

    function loadHighlightedUsers() {
        const parsed = readStorageJson(STORAGE_KEY_HIGHLIGHTED_USERS, {});
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

        return Object.fromEntries(
            Object.entries(parsed)
                .map(([username, value]) => [normalizeName(username), normalizeHighlightUserConfig(value)])
                .filter(([username]) => !!username)
        );
    }

    function saveHighlightedUsers() {
        writeStorageJson(STORAGE_KEY_HIGHLIGHTED_USERS, highlightedUsers);
    }

    function loadMentionSettings() {
        return normalizeMentionSettings(readStorageJson(STORAGE_KEY_MENTION_SETTINGS, null));
    }

    function saveMentionSettings(nextSettings) {
        mentionSettings = normalizeMentionSettings(nextSettings);
        writeStorageJson(STORAGE_KEY_MENTION_SETTINGS, mentionSettings);
    }

    function loadLastMentionSoundRecord() {
        return normalizeMentionSoundRecord(readStorageJson(STORAGE_KEY_LAST_MENTION_SOUND_NOTIFICATION, null));
    }

    function normalizeMentionSoundRecord(record) {
        if (!record || typeof record !== 'object' || Array.isArray(record)) return null;

        const hash = String(record.hash || '').trim();
        const messageTimestamp = String(record.messageTimestamp || '').trim();
        const messageTimestampKey = Number(record.messageTimestampKey) || 0;
        const notifiedAt = Number(record.notifiedAt) || 0;

        if (!hash || messageTimestampKey < 0 || notifiedAt < 0) return null;

        return {
            hash,
            messageTimestamp,
            messageTimestampKey,
            notifiedAt
        };
    }

    function loadRecentMentionSoundRecords(fallbackRecord = null) {
        const parsed = readStorageJson(STORAGE_KEY_RECENT_MENTION_SOUND_NOTIFICATIONS, []);
        const records = Array.isArray(parsed)
            ? parsed.map(normalizeMentionSoundRecord).filter(Boolean)
            : [];

        if (records.length > 0) {
            return records.slice(-MAX_RECENT_MENTION_SOUND_RECORDS);
        }

        return fallbackRecord ? [fallbackRecord] : [];
    }

    function saveLastMentionSoundRecord(record) {
        const normalizedRecord = normalizeMentionSoundRecord(record);

        if (!normalizedRecord) {
            lastMentionSoundRecord = null;
            removeStorageItem(STORAGE_KEY_LAST_MENTION_SOUND_NOTIFICATION);
            return;
        }

        lastMentionSoundRecord = normalizedRecord;
        writeStorageJson(STORAGE_KEY_LAST_MENTION_SOUND_NOTIFICATION, lastMentionSoundRecord);
    }

    function saveRecentMentionSoundRecords() {
        writeStorageJson(
            STORAGE_KEY_RECENT_MENTION_SOUND_NOTIFICATIONS,
            recentMentionSoundRecords.slice(-MAX_RECENT_MENTION_SOUND_RECORDS)
        );
    }

    function rememberMentionSoundRecord(record) {
        const normalizedRecord = normalizeMentionSoundRecord(record);
        if (!normalizedRecord) return;

        recentMentionSoundRecords = recentMentionSoundRecords
            .filter((entry) => !(entry.hash === normalizedRecord.hash && entry.messageTimestampKey === normalizedRecord.messageTimestampKey));
        recentMentionSoundRecords.push(normalizedRecord);

        if (recentMentionSoundRecords.length > MAX_RECENT_MENTION_SOUND_RECORDS) {
            recentMentionSoundRecords = recentMentionSoundRecords.slice(-MAX_RECENT_MENTION_SOUND_RECORDS);
        }

        saveRecentMentionSoundRecords();
    }

    function hasRememberedMentionSoundRecord(signature) {
        if (!signature) return false;

        return recentMentionSoundRecords.some((record) =>
            record.hash === signature.hash &&
            record.messageTimestampKey === signature.messageTimestampKey
        );
    }

    function clampChatFontScale(value) {
        return clamp(value, MIN_CHAT_FONT_SCALE, MAX_CHAT_FONT_SCALE);
    }

    function loadChatFontScale() {
        const rawValue = readStorageItem(STORAGE_KEY_CHAT_FONT_SCALE);
        if (!rawValue) return DEFAULT_CHAT_FONT_SCALE;

        const parsed = Number(String(rawValue).trim().replace(',', '.'));
        if (Number.isNaN(parsed)) return DEFAULT_CHAT_FONT_SCALE;
        return clampChatFontScale(parsed);
    }

    function saveChatFontScale(value) {
        chatFontScale = clampChatFontScale(value);
        writeStorageItem(STORAGE_KEY_CHAT_FONT_SCALE, String(chatFontScale));
    }

    function loadChatScrollbarEnabled() {
        return readStorageBoolean(STORAGE_KEY_CHAT_SCROLLBAR_ENABLED, false);
    }

    function saveChatScrollbarEnabled(value) {
        chatScrollbarEnabled = !!value;
        writeStorageBoolean(STORAGE_KEY_CHAT_SCROLLBAR_ENABLED, chatScrollbarEnabled);
    }

    function loadMessageActionsLeftEnabled() {
        return readStorageBoolean(STORAGE_KEY_MESSAGE_ACTIONS_LEFT_ENABLED, false);
    }

    function saveMessageActionsLeftEnabled(value) {
        messageActionsLeftEnabled = !!value;
        writeStorageBoolean(STORAGE_KEY_MESSAGE_ACTIONS_LEFT_ENABLED, messageActionsLeftEnabled);
    }

    function loadLinkifyUrlsEnabled() {
        return readStorageBoolean(STORAGE_KEY_LINKIFY_URLS, true);
    }

    function saveLinkifyUrlsEnabled(value) {
        linkifyUrlsEnabled = !!value;
        writeStorageBoolean(STORAGE_KEY_LINKIFY_URLS, linkifyUrlsEnabled);
    }

    function loadEmbedUrlImagesEnabled() {
        return readStorageBoolean(STORAGE_KEY_EMBED_URL_IMAGES, true);
    }

    function saveEmbedUrlImagesEnabled(value) {
        embedUrlImagesEnabled = !!value;
        writeStorageBoolean(STORAGE_KEY_EMBED_URL_IMAGES, embedUrlImagesEnabled);
    }

    function formatChatFontScalePercent(value = chatFontScale) {
        return String(Math.round(clampChatFontScale(value) * 100));
    }

    function parseChatFontScalePercentInput(value, fallback = DEFAULT_CHAT_FONT_SCALE) {
        const num = Number(String(value).trim().replace(',', '.'));
        if (Number.isNaN(num)) return clampChatFontScale(fallback);
        return clampChatFontScale(num / 100);
    }

    function scalePixels(basePx, scale = chatFontScale) {
        const scaled = Math.round(basePx * clampChatFontScale(scale) * 10) / 10;
        return `${scaled}px`;
    }

    function ensureLinkifiedUrlStyle() {
        if (document.getElementById(LINKIFIED_URL_STYLE_ID)) return;
        if (!document.head) return;

        const style = document.createElement('style');
        style.id = LINKIFIED_URL_STYLE_ID;
        style.textContent = `
            a[data-tm-linkified-url="1"] {
                color: #67e8f9 !important;
                text-decoration: underline !important;
                text-underline-offset: 2px;
                text-decoration-thickness: 1px;
                word-break: break-word;
                cursor: pointer;
            }

            a[data-tm-linkified-url="1"]:hover {
                color: #a5f3fc !important;
            }

        `;

        document.head.appendChild(style);
    }

    function ensureEmbeddedImageStyle() {
        if (document.getElementById(EMBEDDED_IMAGE_STYLE_ID)) return;
        if (!document.head) return;

        const style = document.createElement('style');
        style.id = EMBEDDED_IMAGE_STYLE_ID;
        style.textContent = `
            a[data-tm-linkified-image="1"] {
                cursor: zoom-in;
            }
        `;

        document.head.appendChild(style);
    }

    function ensureYouTubeLinkActionStyle() {
        if (document.getElementById(YOUTUBE_LINK_ACTION_STYLE_ID)) return;
        if (!document.head) return;

        const style = document.createElement('style');
        style.id = YOUTUBE_LINK_ACTION_STYLE_ID;
        style.textContent = `
            button[data-tm-youtube-play-link="1"] {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                margin-left: 6px;
                padding: 1px 7px;
                border: 1px solid rgba(239,68,68,0.28);
                border-radius: 999px;
                background: rgba(127,29,29,0.72);
                color: #fee2e2;
                font: 700 11px/1.6 Inter, Arial, sans-serif;
                cursor: pointer;
                vertical-align: middle;
            }

            button[data-tm-youtube-play-link="1"]:hover {
                background: rgba(153,27,27,0.88);
                border-color: rgba(248,113,113,0.4);
            }

        `;

        document.head.appendChild(style);
    }

    function ensureMessageActionsPositionStyle() {
        if (document.getElementById(MESSAGE_ACTIONS_POSITION_STYLE_ID)) return;
        if (!document.head) return;

        const style = document.createElement('style');
        style.id = MESSAGE_ACTIONS_POSITION_STYLE_ID;
        style.textContent = `
            [data-tm-message-actions-left="1"] .group.relative.flex.items-start > .absolute.right-2.-top-3.flex.items-center.gap-0\\.5.bg-zinc-900.border.border-zinc-700.rounded-lg.shadow-lg.px-1.py-0\\.5.z-10 {
                right: auto !important;
                left: min(var(--tm-message-actions-inline-left, calc(0.5rem + 2.4rem)), calc(100% - 4.75rem)) !important;
                top: var(--tm-message-actions-inline-top, 0px) !important;
                transform: translateY(-${MESSAGE_ACTIONS_LEFT_VERTICAL_OFFSET_PX}px) !important;
            }

            [data-tm-message-actions-left="1"] [data-msg-id] [data-msg-actions] {
                position: absolute !important;
                left: min(var(--tm-message-actions-inline-left, 2.4rem), calc(100% - 5rem)) !important;
                top: var(--tm-message-actions-inline-top, 0px) !important;
                transform: translateY(-${MESSAGE_ACTIONS_LEFT_VERTICAL_OFFSET_PX}px) !important;
            }

            /* Les envois consécutifs de Tr4ker masquent la ligne auteur/date.
               Sans ancre, une barre d'actions absolue se superpose au texte. */
            [data-tm-message-actions-left="1"] [data-msg-id][data-tm-message-actions-stacked="1"] [data-msg-actions] {
                position: relative !important;
                left: auto !important;
                top: auto !important;
                transform: none !important;
                width: max-content !important;
                margin-top: 5px !important;
                margin-left: 0 !important;
            }
        `;

        document.head.appendChild(style);
    }

    function applyMessageActionsPositionState() {
        ensureMessageActionsPositionStyle();

        if (messageActionsLeftEnabled && isChatPage()) {
            document.documentElement.setAttribute('data-tm-message-actions-left', '1');
            return;
        }

        document.documentElement.removeAttribute('data-tm-message-actions-left');
    }

    function ensureHomeChatPopoverStyle() {
        if (document.getElementById(HOME_CHAT_POPOVER_STYLE_ID)) return;
        if (!document.head) return;

        const style = document.createElement('style');
        style.id = HOME_CHAT_POPOVER_STYLE_ID;
        style.textContent = `
            [${HOME_CHAT_POPOVER_SURFACE_ATTR}="1"] {
                position: relative !important;
                overflow: visible !important;
                z-index: 1 !important;
                isolation: isolate;
            }

            [${HOME_CHAT_POPOVER_PARENT_ATTR}="1"] {
                overflow: visible !important;
            }

            [${HOME_CHAT_POPOVER_SURFACE_ATTR}="1"] [${CHAT_INPUT_TOOLBAR_RAIL_ATTR}="1"] {
                z-index: 180 !important;
                overflow: visible !important;
            }

            [${HOME_CHAT_POPOVER_SURFACE_ATTR}="1"] #${PHRASES_MENU_WRAPPER_ID},
            [${HOME_CHAT_POPOVER_SURFACE_ATTR}="1"] #${GIF_MENU_WRAPPER_ID},
            [${HOME_CHAT_POPOVER_SURFACE_ATTR}="1"] #${IMAGE_UPLOAD_MENU_WRAPPER_ID},
            [${HOME_CHAT_POPOVER_SURFACE_ATTR}="1"] [${NATIVE_CHAT_INPUT_ACTION_HOST_ATTR}="1"],
            [${HOME_CHAT_POPOVER_SURFACE_ATTR}="1"] [${NATIVE_CHAT_INPUT_ACTION_SOURCE_ATTR}="1"] {
                z-index: 220 !important;
                overflow: visible !important;
            }

            [${HOME_CHAT_POPOVER_SURFACE_ATTR}="1"] #${PHRASES_MENU_WRAPPER_ID} [data-tm-saved-phrases-menu="1"],
            [${HOME_CHAT_POPOVER_SURFACE_ATTR}="1"] #${GIF_MENU_WRAPPER_ID} [data-tm-klipy-gif-menu="1"],
            [${HOME_CHAT_POPOVER_SURFACE_ATTR}="1"] #${IMAGE_UPLOAD_MENU_WRAPPER_ID} [data-tm-image-upload-menu="1"],
            [${HOME_CHAT_POPOVER_SURFACE_ATTR}="1"] [${NATIVE_CHAT_INPUT_ACTION_SOURCE_ATTR}="1"] > .absolute.bottom-12,
            [${HOME_CHAT_POPOVER_SURFACE_ATTR}="1"] [${NATIVE_CHAT_INPUT_ACTION_SOURCE_ATTR}="1"] > .fixed.bottom-12,
            [${HOME_CHAT_POPOVER_SURFACE_ATTR}="1"] [${NATIVE_CHAT_INPUT_ACTION_SOURCE_ATTR}="1"] > .absolute.bottom-24,
            [${HOME_CHAT_POPOVER_SURFACE_ATTR}="1"] [${NATIVE_CHAT_INPUT_ACTION_SOURCE_ATTR}="1"] > .fixed.bottom-24 {
                z-index: 1400 !important;
            }
        `;

        document.head.appendChild(style);
    }

    function ensureChatInputToolbarStyle() {
        if (document.getElementById(CHAT_INPUT_TOOLBAR_STYLE_ID)) return;
        if (!document.head) return;

        const style = document.createElement('style');
        style.id = CHAT_INPUT_TOOLBAR_STYLE_ID;
        style.textContent = `
            [${CHAT_INPUT_TOOLBAR_RAIL_ATTR}="1"] {
                box-sizing: border-box;
                min-height: 32px;
                height: 32px;
                padding: 3px 6px;
                gap: 4px !important;
                border: 1px solid color-mix(in srgb, var(--outline-variant, #474747) 78%, transparent);
                border-radius: 9px;
                background: color-mix(in srgb, var(--surface-container-high, #2a2a2a) 92%, transparent);
                box-shadow: 0 5px 14px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.035);
                scrollbar-width: none;
            }

            [${CHAT_INPUT_TOOLBAR_RAIL_ATTR}="1"]::-webkit-scrollbar {
                display: none;
            }

            [${CHAT_INPUT_TOOLBAR_RAIL_ATTR}="1"] > div {
                min-width: 0;
                height: 24px;
                gap: 4px !important;
            }

            [${CHAT_INPUT_TOOLBAR_RAIL_ATTR}="1"][${CHAT_INPUT_TOOLBAR_INLINE_ATTR}="1"] {
                min-height: var(--tm-chat-input-toolbar-inline-height, 32px);
                height: var(--tm-chat-input-toolbar-inline-height, 32px);
            }

            [${CHAT_INPUT_TOOLBAR_RAIL_ATTR}="1"] button {
                box-sizing: border-box;
                min-width: 26px;
                height: 24px !important;
                padding: 0 8px !important;
                border-radius: 6px !important;
                font-family: Geist Variable, Inter, Arial, sans-serif !important;
                font-size: 10px !important;
                font-weight: 700 !important;
                line-height: 1 !important;
                box-shadow: none !important;
                transition: background 120ms ease, border-color 120ms ease, transform 120ms ease !important;
            }

            [${CHAT_INPUT_TOOLBAR_RAIL_ATTR}="1"] button:hover {
                filter: none !important;
                transform: translateY(-1px) !important;
            }

            #${EMOJI_QUICK_ACCESS_WRAPPER_ID} button {
                width: 24px !important;
                padding: 0 !important;
                border-color: transparent !important;
                background: transparent !important;
            }

            #${EMOJI_QUICK_ACCESS_WRAPPER_ID} button:hover {
                background: color-mix(in srgb, var(--primary, #fff) 12%, transparent) !important;
            }

            #${EMOJI_QUICK_ACCESS_WRAPPER_ID} button img {
                width: 18px !important;
                height: 18px !important;
            }

            #${GIF_MENU_WRAPPER_ID} button {
                background: rgba(22, 163, 74, 0.18) !important;
                border-color: rgba(74, 222, 128, 0.28) !important;
                color: #dcfce7 !important;
            }

            #${IMAGE_UPLOAD_MENU_WRAPPER_ID} button {
                background: rgba(2, 132, 199, 0.18) !important;
                border-color: rgba(125, 211, 252, 0.3) !important;
                color: #e0f2fe !important;
            }

            #${PHRASES_MENU_WRAPPER_ID} > button:first-child {
                background: rgba(124, 58, 237, 0.18) !important;
                border-color: rgba(167, 139, 250, 0.3) !important;
                color: #ede9fe !important;
            }

            #${PHRASES_MENU_WRAPPER_ID} > button:nth-child(2) {
                width: 24px !important;
                padding: 0 !important;
                background: rgba(59, 130, 246, 0.16) !important;
                border-color: rgba(96, 165, 250, 0.3) !important;
                color: #dbeafe !important;
                font-size: 15px !important;
            }

            @media (max-width: 700px) {
                [${CHAT_INPUT_TOOLBAR_RAIL_ATTR}="1"] {
                    max-width: calc(100% - 16px);
                    overflow-x: auto !important;
                    overscroll-behavior-inline: contain;
                }

                [${CHAT_INPUT_TOOLBAR_RAIL_ATTR}="1"] > div {
                    flex: 0 0 auto;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function applyHomeChatPopoverState() {
        ensureHomeChatPopoverStyle();

        document.querySelectorAll(`[${HOME_CHAT_POPOVER_SURFACE_ATTR}="1"]`).forEach((element) => {
            if (element instanceof HTMLElement) {
                element.removeAttribute(HOME_CHAT_POPOVER_SURFACE_ATTR);
            }
        });

        document.querySelectorAll(`[${HOME_CHAT_POPOVER_PARENT_ATTR}="1"]`).forEach((element) => {
            if (element instanceof HTMLElement) {
                element.removeAttribute(HOME_CHAT_POPOVER_PARENT_ATTR);
            }
        });

        if (!isHomePage() || homeChatCollapsed) return;

        const homeContainer = getHomepageChatContainer();
        if (!(homeContainer instanceof HTMLElement)) return;

        homeContainer.setAttribute(HOME_CHAT_POPOVER_SURFACE_ATTR, '1');

        let ancestor = homeContainer.parentElement;
        for (let depth = 0; ancestor && depth < 3; depth += 1, ancestor = ancestor.parentElement) {
            ancestor.setAttribute(HOME_CHAT_POPOVER_PARENT_ATTR, '1');
        }
    }

    function ensureNativeChatInputPopoverStyle() {
        if (document.getElementById(NATIVE_CHAT_INPUT_POPOVER_STYLE_ID)) return;
        if (!document.head) return;

        const style = document.createElement('style');
        style.id = NATIVE_CHAT_INPUT_POPOVER_STYLE_ID;
        style.textContent = `
            :root[${NATIVE_CHAT_INPUT_POPOVER_LIFTED_ATTR}="1"] [${NATIVE_CHAT_INPUT_ACTION_SOURCE_ATTR}="1"] .bottom-24 {
                bottom: calc(var(--spacing, 0.25rem) * 24) !important;
            }

            :root[${NATIVE_CHAT_INPUT_POPOVER_LIFTED_ATTR}="1"] [${NATIVE_CHAT_INPUT_ACTION_SOURCE_ATTR}="1"] > .absolute.bottom-24,
            :root[${NATIVE_CHAT_INPUT_POPOVER_LIFTED_ATTR}="1"] [${NATIVE_CHAT_INPUT_ACTION_SOURCE_ATTR}="1"] > .fixed.bottom-24 {
                top: auto !important;
                z-index: 120 !important;
            }
        `;

        document.head.appendChild(style);
    }

    function applyNativeChatInputPopoverState() {
        ensureNativeChatInputPopoverStyle();

        if (isChatPage()) {
            document.documentElement.setAttribute(NATIVE_CHAT_INPUT_POPOVER_LIFTED_ATTR, '1');
            return;
        }

        document.documentElement.removeAttribute(NATIVE_CHAT_INPUT_POPOVER_LIFTED_ATTR);
    }

    function ensureChatScrollbarStyle() {
        if (document.getElementById(CHAT_SCROLLBAR_STYLE_ID)) return;
        if (!document.head) return;

        const style = document.createElement('style');
        style.id = CHAT_SCROLLBAR_STYLE_ID;
        style.textContent = `
            [data-tm-chat-scrollbar="1"] {
                scrollbar-width: auto !important;
                scrollbar-color: rgba(255,255,255,0.96) rgba(255,255,255,0.08) !important;
                scrollbar-gutter: stable both-edges !important;
                -ms-overflow-style: auto !important;
            }

            [data-tm-chat-scrollbar="1"]::-webkit-scrollbar {
                display: block !important;
                width: ${DEFAULT_CHAT_SCROLLBAR_THICKNESS}px !important;
                height: ${DEFAULT_CHAT_SCROLLBAR_THICKNESS}px !important;
                background: transparent !important;
            }

            [data-tm-chat-scrollbar="1"]::-webkit-scrollbar-track {
                background: rgba(255,255,255,0.08) !important;
                border-radius: 999px !important;
            }

            [data-tm-chat-scrollbar="1"]::-webkit-scrollbar-thumb {
                background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(226,232,240,0.9)) !important;
                border-radius: 999px !important;
                border: ${DEFAULT_CHAT_SCROLLBAR_THUMB_BORDER}px solid rgba(24,24,27,0.96) !important;
                box-shadow: 0 0 10px rgba(255,255,255,0.22) !important;
            }

            [data-tm-chat-scrollbar="1"]::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(180deg, rgba(255,255,255,1), rgba(248,250,252,0.98)) !important;
            }

        `;

        document.head.appendChild(style);
    }

    function clearChatPageScrollbarState(scroller) {
        if (!(scroller instanceof HTMLElement)) return;

        scroller.removeAttribute('data-tm-chat-scrollbar');
        scroller.style.removeProperty('overflow-y');
        scroller.style.removeProperty('overflow-x');
        scroller.style.removeProperty('scrollbar-width');
        scroller.style.removeProperty('-ms-overflow-style');
        scroller.style.removeProperty('scrollbar-gutter');
    }

    function applyChatPageScrollbarState() {
        ensureChatScrollbarStyle();

        const currentScroller = isChatPage() ? getChatPageMessagesRoot() : null;
        const activeScrollbars = Array.from(document.querySelectorAll('[data-tm-chat-scrollbar="1"]'));
        activeScrollbars.forEach((element) => {
            if (element !== currentScroller) {
                clearChatPageScrollbarState(element);
            }
        });

        if (!(currentScroller instanceof HTMLElement)) return;

        if (!chatScrollbarEnabled) {
            clearChatPageScrollbarState(currentScroller);
            return;
        }

        currentScroller.setAttribute('data-tm-chat-scrollbar', '1');
        currentScroller.style.setProperty('overflow-y', 'scroll', 'important');
        currentScroller.style.setProperty('overflow-x', 'hidden', 'important');
        currentScroller.style.setProperty('scrollbar-width', 'auto', 'important');
        currentScroller.style.setProperty('-ms-overflow-style', 'auto', 'important');
        currentScroller.style.setProperty('scrollbar-gutter', 'stable both-edges', 'important');
    }

    function normalizeStatsBoxPosition(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

        const leftPx = Number(value.leftPx);
        const topPx = Number(value.topPx);
        if (Number.isFinite(leftPx) && Number.isFinite(topPx)) {
            return {
                leftPx: Math.max(0, Math.round(leftPx)),
                topPx: Math.max(0, Math.round(topPx))
            };
        }

        const rightPercent = Number(value.rightPercent);
        const bottomPercent = Number(value.bottomPercent);
        if (Number.isFinite(rightPercent) && Number.isFinite(bottomPercent)) {
            return {
                rightPercent: clamp(rightPercent, 0, MAX_STATS_RIGHT_PERCENT),
                bottomPercent: clamp(bottomPercent, 0, MAX_STATS_BOTTOM_PERCENT)
            };
        }

        return null;
    }

    function loadPosition() {
        return normalizeStatsBoxPosition(readStorageJson(getPositionStorageKey(), null)) || { ...DEFAULT_POSITION };
    }

    function savePosition(position) {
        const normalizedPosition = normalizeStatsBoxPosition(position) || { ...DEFAULT_POSITION };
        writeStorageJson(getPositionStorageKey(), normalizedPosition);
    }

    function resetPosition() {
        removeStorageItem(getPositionStorageKey());
    }

    function normalizeStatsBoxSize(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

        const widthPx = Math.round(Number(value.widthPx) || 0);
        const heightPx = Math.round(Number(value.heightPx) || 0);
        if (!Number.isFinite(widthPx) || !Number.isFinite(heightPx)) return null;
        if (widthPx < MIN_STATS_BOX_WIDTH_PX || heightPx < MIN_STATS_BOX_HEIGHT_PX) return null;

        return { widthPx, heightPx };
    }

    function loadStatsBoxSize() {
        return normalizeStatsBoxSize(readStorageJson(getStatsBoxSizeStorageKey(), null));
    }

    function saveStatsBoxSize(size) {
        const normalizedSize = normalizeStatsBoxSize(size);
        if (!normalizedSize) {
            removeStorageItem(getStatsBoxSizeStorageKey());
            return;
        }

        writeStorageJson(getStatsBoxSizeStorageKey(), normalizedSize);
    }

    function resetStatsBoxSize() {
        removeStorageItem(getStatsBoxSizeStorageKey());
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function normalizeHexColor(value, fallback = DEFAULT_HIGHLIGHT_COLOR) {
        const raw = String(value || '').trim();

        if (/^#[0-9a-f]{3}$/i.test(raw)) {
            return `#${raw.slice(1).split('').map((char) => char + char).join('').toLowerCase()}`;
        }

        if (/^#[0-9a-f]{6}$/i.test(raw)) {
            return raw.toLowerCase();
        }

        return fallback;
    }

    function hexToRgb(hex) {
        const color = normalizeHexColor(hex);
        return {
            r: parseInt(color.slice(1, 3), 16),
            g: parseInt(color.slice(3, 5), 16),
            b: parseInt(color.slice(5, 7), 16)
        };
    }

    function hexToRgba(hex, alpha) {
        const { r, g, b } = hexToRgb(hex);
        return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
    }

    function normalizeName(name) {
        return (name || '').trim().toLowerCase();
    }

    function parseBlinkSecondsInput(value, fallback = DEFAULT_MENTION_BLINK_SECONDS) {
        const num = Number(String(value).trim().replace(',', '.'));
        if (Number.isNaN(num)) return clamp(fallback, 0, 30);
        return clamp(num, 0, 30);
    }

    function parseOpacityPercentInput(value, fallback = DEFAULT_MENTION_OPACITY) {
        const num = Number(String(value).trim().replace(',', '.'));
        if (Number.isNaN(num)) return clamp(fallback, 0, 100);
        return clamp(num, 0, 100);
    }

    function parseMentionSoundCooldownInput(value, fallback = DEFAULT_MENTION_SOUND_COOLDOWN_SECONDS) {
        const num = Number(String(value).trim().replace(',', '.'));
        if (Number.isNaN(num)) return clamp(fallback, 0, 300);
        return clamp(num, 0, 300);
    }

    function normalizeMentionSoundScope(value) {
        const raw = String(value || '').trim().toLowerCase();
        if (raw === 'home' || raw === 'chat' || raw === 'both' || raw === 'off') return raw;
        return DEFAULT_MENTION_SOUND_SCOPE;
    }

    function isMentionSoundScopeEnabled(scope = mentionSettings?.soundScope) {
        return normalizeMentionSoundScope(scope) !== 'off';
    }

    function isMentionSoundEnabledForCurrentPage(scope = mentionSettings?.soundScope) {
        const normalizedScope = normalizeMentionSoundScope(scope);

        if (normalizedScope === 'off') return false;
        if (normalizedScope === 'both') return isSupportedPage();
        if (normalizedScope === 'home') return isHomePage();
        if (normalizedScope === 'chat') return isChatPage();

        return false;
    }

    function normalizeMentionSoundStyle(value) {
        const raw = String(value || '').trim().toLowerCase();
        if (raw === 'bell' || raw === 'soft' || raw === 'double' || raw === 'custom') return raw;
        return DEFAULT_MENTION_SOUND_STYLE;
    }

    function normalizeMentionSoundCustomUrl(value) {
        const raw = String(value || '').trim();
        if (!raw) return DEFAULT_MENTION_SOUND_CUSTOM_URL;
        if (/^https?:\/\//i.test(raw)) return raw;
        if (/^data:audio\//i.test(raw)) return raw;
        return DEFAULT_MENTION_SOUND_CUSTOM_URL;
    }

    function normalizeHighlightUserConfig(value) {
        if (typeof value === 'string') {
            return {
                color: normalizeHexColor(value, DEFAULT_HIGHLIGHT_COLOR),
                opacityPercent: DEFAULT_HIGHLIGHT_OPACITY
            };
        }

        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return {
                color: DEFAULT_HIGHLIGHT_COLOR,
                opacityPercent: DEFAULT_HIGHLIGHT_OPACITY
            };
        }

        return {
            color: normalizeHexColor(value.color, DEFAULT_HIGHLIGHT_COLOR),
            opacityPercent: parseOpacityPercentInput(value.opacityPercent, DEFAULT_HIGHLIGHT_OPACITY)
        };
    }

    function hashString(value) {
        let hash = 5381;
        const input = String(value || '');

        for (let i = 0; i < input.length; i += 1) {
            hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
        }

        return (hash >>> 0).toString(36);
    }

    function normalizeUrlForChatInsertion(value) {
        const raw = String(value || '').trim();
        if (!/^https?:\/\/\S+$/i.test(raw)) return '';
        return raw;
    }

    function buildImageEmbedMarkup(imageUrl) {
        const normalizedImageUrl = normalizeUrlForChatInsertion(imageUrl);
        if (!normalizedImageUrl) return '';
        return `[img]${normalizedImageUrl}[/img]`;
    }

    async function copyTextToClipboard(text) {
        const normalizedText = String(text || '');
        if (!normalizedText) return false;

        if (navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(normalizedText);
                return true;
            } catch (e) {}
        }

        try {
            const textarea = document.createElement('textarea');
            textarea.value = normalizedText;
            textarea.setAttribute('readonly', 'readonly');
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            textarea.style.top = '0';
            document.body?.appendChild(textarea);
            textarea.select();
            const copied = document.execCommand('copy');
            textarea.remove();
            return copied;
        } catch (e) {
            return false;
        }
    }

    function formatFileSize(bytes) {
        const size = Math.max(0, Number(bytes) || 0);
        if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(size >= 10 * 1024 * 1024 ? 0 : 1)} Mo`;
        if (size >= 1024) return `${Math.round(size / 1024)} Ko`;
        return `${size} o`;
    }

    function formatImageHostingExpirationLabel(seconds = imageHostingExpirationSeconds) {
        const normalizedSeconds = normalizeImageHostingExpirationSeconds(seconds);
        if (normalizedSeconds === 0) return 'permanent';
        if (normalizedSeconds === 600) return '10 min';
        if (normalizedSeconds === 3600) return '1 h';
        if (normalizedSeconds === 86400) return '1 jour';
        if (normalizedSeconds === 604800) return '7 jours';
        if (normalizedSeconds === 2592000) return '30 jours';
        if (normalizedSeconds === 15552000) return '180 jours';
        return `${normalizedSeconds}s`;
    }

    function formatImageCatalogDate(timestamp) {
        const normalizedTimestamp = Math.max(0, Number(timestamp) || 0);
        if (!normalizedTimestamp) return '';

        return new Date(normalizedTimestamp).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    async function validateImageUrl(imageUrl, timeoutMs = IMAGE_URL_VALIDATION_TIMEOUT_MS) {
        const normalizedImageUrl = normalizeImageCatalogUrl(imageUrl);
        if (!normalizedImageUrl) {
            return { ok: false, message: 'URL image invalide.' };
        }

        // Un visuel « Image not found » peut parfois être servi comme une image
        // valide par le navigateur. Le statut HTTP obtenu par Tampermonkey est
        // donc vérifié avant le décodage de l'image dans la page.
        try {
            const remoteResponse = await requestExternal(normalizedImageUrl, {
                method: 'HEAD',
                credentials: 'omit',
                timeout: Math.min(Math.max(1000, Number(timeoutMs) || 0), 7000),
                responseType: 'arraybuffer'
            });
            if (remoteResponse.status >= 400) {
                return {
                    ok: false,
                    httpStatus: remoteResponse.status,
                    message: `Le serveur image répond HTTP ${remoteResponse.status}.`
                };
            }
        } catch (e) {
            // Certains hébergeurs refusent HEAD : le test de décodage ci-dessous
            // reste la solution de repli pour ces liens.
        }

        return new Promise((resolve) => {
            const image = new Image();
            let settled = false;
            const timeout = window.setTimeout(() => {
                if (settled) return;
                settled = true;
                image.onload = null;
                image.onerror = null;
                resolve({ ok: false, message: 'Validation image expirée.' });
            }, timeoutMs);

            image.onload = () => {
                if (settled) return;
                settled = true;
                window.clearTimeout(timeout);
                resolve({
                    ok: true,
                    url: normalizedImageUrl,
                    width: Math.max(0, Number(image.naturalWidth) || 0),
                    height: Math.max(0, Number(image.naturalHeight) || 0)
                });
            };

            image.onerror = () => {
                if (settled) return;
                settled = true;
                window.clearTimeout(timeout);
                resolve({ ok: false, message: 'Le lien ne charge pas une image valide.' });
            };

            image.referrerPolicy = 'no-referrer';
            image.src = normalizedImageUrl;
        });
    }

    function waitMs(delayMs) {
        return new Promise((resolve) => {
            window.setTimeout(resolve, Math.max(0, Number(delayMs) || 0));
        });
    }

    function addImageUrlCacheBuster(imageUrl) {
        const normalizedImageUrl = normalizeImageCatalogUrl(imageUrl);
        if (!normalizedImageUrl) return '';

        try {
            const url = new URL(normalizedImageUrl);
            url.searchParams.set('tm_delete_check', `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
            return url.href;
        } catch (e) {
            return normalizedImageUrl;
        }
    }

    async function waitForImageUrlToBecomeInvalid(imageUrl) {
        const normalizedImageUrl = normalizeImageCatalogUrl(imageUrl);
        if (!normalizedImageUrl) {
            return { ok: true, message: 'URL image déjà invalide.' };
        }

        for (let attempt = 0; attempt < IMAGE_DELETE_VERIFICATION_ATTEMPTS; attempt += 1) {
            await waitMs(attempt === 0 ? 650 : IMAGE_DELETE_VERIFICATION_DELAY_MS);

            const validation = await validateImageUrl(addImageUrlCacheBuster(normalizedImageUrl), 3500);
            if (!validation.ok) {
                return { ok: true, message: 'Image distante indisponible.' };
            }
        }

        return { ok: false, message: 'L’image distante charge encore.' };
    }

    function getImgBbDeleteRequestDetails(deleteUrl) {
        const normalizedDeleteUrl = normalizeImageCatalogUrl(deleteUrl);
        if (!normalizedDeleteUrl) return null;

        try {
            const url = new URL(normalizedDeleteUrl);
            if (!/^(?:www\.)?ibb\.co$/i.test(url.hostname)) return null;

            const pathParts = url.pathname.split('/').filter(Boolean);
            const [imageId, imageHash] = pathParts;
            if (
                pathParts.length !== 2 ||
                !/^[a-zA-Z0-9_-]+$/.test(imageId || '') ||
                !/^[a-zA-Z0-9_-]+$/.test(imageHash || '')
            ) {
                return null;
            }

            return {
                imageId,
                imageHash,
                pathname: `/${imageId}/${imageHash}`
            };
        } catch (e) {
            return null;
        }
    }

    async function requestRemoteImageDeletion(record) {
        const deleteUrl = normalizeImageCatalogUrl(record?.deleteUrl);
        if (!deleteUrl) {
            return { ok: false, message: 'URL de suppression distante introuvable.' };
        }

        const deleteRequestDetails = getImgBbDeleteRequestDetails(deleteUrl);
        if (!deleteRequestDetails) {
            return { ok: false, message: 'URL de suppression ImgBB invalide.' };
        }

        const requestResult = {
            responseReadable: false,
            responseOk: false,
            responseStatus: 0,
            responseText: '',
            errorMessage: ''
        };

        try {
            const formData = new FormData();
            formData.append('pathname', deleteRequestDetails.pathname);
            formData.append('action', 'delete');
            formData.append('delete', 'image');
            formData.append('from', 'resource');
            formData.append('deleting[id]', deleteRequestDetails.imageId);
            formData.append('deleting[hash]', deleteRequestDetails.imageHash);

            // delete_url mène à la page de gestion ImgBB. La suppression est
            // réellement effectuée par son POST vers /json, avec l'identifiant
            // et le jeton présents dans cette URL.
            const response = await requestExternal(IMGBB_DELETE_ENDPOINT, {
                method: 'POST',
                body: formData,
                credentials: 'omit',
                timeout: 15000
            });

            requestResult.responseReadable = response.type !== 'opaque';
            requestResult.responseOk = response.ok || (response.status >= 200 && response.status < 400);
            requestResult.responseStatus = Math.max(0, Number(response.status) || 0);

            if (requestResult.responseReadable) {
                try {
                    const responseText = await response.clone().text();
                    requestResult.responseText = responseText.slice(0, 300);
                    const payload = JSON.parse(responseText);
                    if (payload?.success === false || payload?.status === false) {
                        requestResult.responseOk = false;
                    }
                } catch (e) {
                    // ImgBB ne garantit pas un corps JSON ; le statut HTTP et
                    // la vérification du lien image restent alors la référence.
                }
            }
        } catch (e) {
            requestResult.errorMessage = e?.message || 'Réponse ImgBB inaccessible.';
        }

        const verification = await waitForImageUrlToBecomeInvalid(record?.url || record?.displayUrl || record?.thumbUrl);
        if (verification.ok) {
            return {
                ok: true,
                message: requestResult.responseReadable
                    ? 'Suppression distante confirmée.'
                    : 'Suppression distante confirmée après vérification.'
            };
        }

        if (requestResult.responseReadable && !requestResult.responseOk) {
            const statusLabel = requestResult.responseStatus ? `HTTP ${requestResult.responseStatus}` : 'réponse non valide';
            return {
                ok: false,
                message: `Suppression ImgBB non confirmée (${statusLabel}). Entrée locale conservée.`
            };
        }

        if (requestResult.errorMessage) {
            return {
                ok: false,
                message: 'Réponse ImgBB inaccessible et image encore valide. Entrée locale conservée.'
            };
        }

        return {
            ok: false,
            message: 'ImgBB a répondu, mais l’image charge encore. Entrée locale conservée.'
        };
    }

    async function deleteImageCatalogRecord(record) {
        const normalizedRecord = normalizeImageCatalogRecord(record);
        if (!normalizedRecord) {
            return { ok: false, message: 'Image introuvable.' };
        }

        if (normalizedRecord.deleteUrl) {
            const currentRemoteImage = await validateImageUrl(
                addImageUrlCacheBuster(normalizedRecord.url),
                IMAGE_URL_VALIDATION_TIMEOUT_MS
            );
            if (!currentRemoteImage.ok && [404, 410].includes(currentRemoteImage.httpStatus)) {
                const localDeletion = removeImageCatalogRecord(normalizedRecord.id);
                if (!localDeletion.ok) return localDeletion;
                return {
                    ok: true,
                    message: 'Image déjà supprimée sur ImgBB ; entrée locale retirée.'
                };
            }

            const remoteDeletion = await requestRemoteImageDeletion(normalizedRecord);
            if (!remoteDeletion.ok) return remoteDeletion;
        }

        const localDeletion = removeImageCatalogRecord(normalizedRecord.id);
        if (!localDeletion.ok) return localDeletion;

        return {
            ok: true,
            message: normalizedRecord.deleteUrl
                ? 'Image supprimée à distance, entrée locale retirée.'
                : localDeletion.message
        };
    }

    function extractImageFilesFromFileList(fileList) {
        return Array.from(fileList || [])
            .filter((file) => file instanceof File)
            .filter((file) => /^image\//i.test(file.type || ''))
            .filter((file) => file.size > 0);
    }

    function extractImageFilesFromDataTransfer(dataTransfer) {
        if (!dataTransfer) return [];

        const files = extractImageFilesFromFileList(dataTransfer.files);
        if (files.length > 0) return files;

        return Array.from(dataTransfer.items || [])
            .filter((item) => item.kind === 'file')
            .map((item) => item.getAsFile())
            .filter((file) => file instanceof File && /^image\//i.test(file.type || '') && file.size > 0);
    }

    function buildImageCatalogRecordFromImgBbPayload(payload, file, uploadedAt = Date.now()) {
        const data = payload?.data || {};
        const imageInfo = data.image || {};
        const thumbInfo = data.thumb || {};
        const mediumInfo = data.medium || {};
        const hasApiExpiration = data.expiration !== undefined && data.expiration !== null && data.expiration !== '';
        const expirationSeconds = hasApiExpiration
            ? Math.max(0, Number.parseInt(String(data.expiration), 10) || 0)
            : normalizeImageHostingExpirationSeconds(imageHostingExpirationSeconds);
        const expiresAt = expirationSeconds > 0
            ? uploadedAt + expirationSeconds * 1000
            : 0;

        return normalizeImageCatalogRecord({
            id: String(data.id || hashString(`${data.url || file?.name || uploadedAt}:${uploadedAt}`)),
            url: data.url || imageInfo.url || data.display_url,
            displayUrl: data.display_url || mediumInfo.url || data.url || imageInfo.url,
            viewerUrl: data.url_viewer || '',
            deleteUrl: data.delete_url || '',
            thumbUrl: thumbInfo.url || mediumInfo.url || data.display_url || data.url || imageInfo.url,
            title: data.title || imageInfo.name || file?.name || 'Image ImgBB',
            source: 'imgbb',
            mime: imageInfo.mime || file?.type || '',
            width: Number(data.width) || 0,
            height: Number(data.height) || 0,
            size: Number(data.size) || file?.size || 0,
            createdAt: uploadedAt,
            expiresAt,
            lastCheckedAt: uploadedAt
        });
    }

    async function uploadImageFileToImgBb(file, expirationSeconds = imageHostingExpirationSeconds) {
        if (!(file instanceof File)) {
            throw new Error('Fichier image introuvable.');
        }

        if (!/^image\//i.test(file.type || '')) {
            throw new Error(`${file.name || 'Fichier'} n’est pas une image.`);
        }

        if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
            throw new Error(`${file.name || 'Image'} dépasse ${formatFileSize(IMAGE_UPLOAD_MAX_BYTES)}.`);
        }

        const apiKey = normalizeImgBbApiKey(imgbbApiKey);
        if (!apiKey) {
            throw new Error('Clé API ImgBB manquante.');
        }

        const requestUrl = new URL(IMGBB_UPLOAD_ENDPOINT);
        requestUrl.searchParams.set('key', apiKey);
        const normalizedExpirationSeconds = normalizeImageHostingExpirationSeconds(expirationSeconds);
        if (normalizedExpirationSeconds > 0) {
            requestUrl.searchParams.set('expiration', String(normalizedExpirationSeconds));
        }

        const formData = new FormData();
        formData.append('image', file, file.name || `image-${Date.now()}`);

        const response = await requestExternal(requestUrl.toString(), {
            method: 'POST',
            body: formData,
            credentials: 'omit',
            timeout: 60000
        });

        let payload = null;
        try {
            payload = await response.json();
        } catch (e) {}

        if (!response.ok || payload?.success !== true) {
            const message = payload?.error?.message || payload?.message || `Upload ImgBB impossible (HTTP ${response.status}).`;
            throw new Error(message);
        }

        const record = buildImageCatalogRecordFromImgBbPayload(payload, file, Date.now());
        if (!record) {
            throw new Error('Réponse ImgBB inexploitable.');
        }

        return record;
    }

    async function addManualImageCatalogUrl(imageUrl, title = '') {
        const validation = await validateImageUrl(imageUrl);
        if (!validation.ok) {
            return { ok: false, message: validation.message || 'Lien image invalide.' };
        }

        const url = validation.url;
        let fallbackTitle = '';
        try {
            const parsedUrl = new URL(url);
            fallbackTitle = decodeURIComponent(parsedUrl.pathname.split('/').filter(Boolean).pop() || '');
        } catch (e) {}

        return addImageCatalogRecord({
            id: `manual-${hashString(`${url}:${Date.now()}`)}`,
            url,
            displayUrl: url,
            thumbUrl: url,
            title: String(title || fallbackTitle || 'Image').trim(),
            source: 'manual',
            width: validation.width,
            height: validation.height,
            createdAt: Date.now(),
            expiresAt: getImageCatalogExpirationAt(),
            lastCheckedAt: Date.now()
        });
    }

    // Klipy GIF picker - API/data helpers
    function buildKlipyGifEmbedMarkup(gifUrl) {
        const normalizedGifUrl = normalizeUrlForChatInsertion(gifUrl);
        if (!normalizedGifUrl) return '';
        return `[img]${normalizedGifUrl}[/img]`;
    }

    function getKlipyApiLocale() {
        const rawLocale = String(navigator.language || navigator.userLanguage || 'fr-FR').trim();
        if (!rawLocale) return 'fr_FR';

        const normalizedParts = rawLocale.replace('_', '-').split('-').filter(Boolean);
        const language = String(normalizedParts[0] || 'fr')
            .toLowerCase()
            .replace(/[^a-z]/g, '')
            .slice(0, 2);
        const region = String(normalizedParts[1] || 'FR')
            .toUpperCase()
            .replace(/[^A-Z]/g, '')
            .slice(0, 2);

        if (!language || !region) {
            return 'fr_FR';
        }

        return `${language}_${region}`;
    }

    function buildKlipyApiUrl(endpoint, params = {}) {
        const url = new URL(`${KLIPY_API_BASE_URL}/${String(endpoint || '').replace(/^\/+/, '')}`);
        url.searchParams.set('key', KLIPY_API_KEY);
        url.searchParams.set('client_key', KLIPY_CLIENT_KEY);

        Object.entries(params).forEach(([paramName, paramValue]) => {
            if (paramValue === undefined || paramValue === null || paramValue === '') return;
            url.searchParams.set(paramName, String(paramValue));
        });

        return url.toString();
    }

    function setKlipyGifCacheEntry(cacheKey, value) {
        if (!cacheKey) return;

        if (klipyGifResponseCache.has(cacheKey)) {
            klipyGifResponseCache.delete(cacheKey);
        }

        klipyGifResponseCache.set(cacheKey, value);

        while (klipyGifResponseCache.size > KLIPY_CACHE_MAX_ENTRIES) {
            const oldestCacheKey = klipyGifResponseCache.keys().next().value;
            if (!oldestCacheKey) break;
            klipyGifResponseCache.delete(oldestCacheKey);
        }
    }

    /**
     * Convertit un résultat Klipy brut en objet minimal et sûr pour le picker GIF.
     *
     * @param {unknown} result
     * @returns {KlipyGifResult|null}
     */
    function normalizeKlipyGifResult(result) {
        const gifUrl = normalizeUrlForChatInsertion(result?.media_formats?.gif?.url || result?.url);
        const previewUrl = normalizeUrlForChatInsertion(result?.media_formats?.tinygif?.url || gifUrl);

        if (!gifUrl || !previewUrl) return null;

        const previewDims = Array.isArray(result?.media_formats?.tinygif?.dims)
            ? result.media_formats.tinygif.dims
            : Array.isArray(result?.media_formats?.gif?.dims)
                ? result.media_formats.gif.dims
                : [];

        return {
            id: String(result?.id || hashString(gifUrl)),
            title: String(result?.title || result?.content_description || result?.tags?.[0] || 'GIF Klipy').trim(),
            gifUrl,
            previewUrl,
            itemUrl: normalizeUrlForChatInsertion(result?.itemurl) || 'https://klipy.com',
            width: Number(previewDims[0]) || 0,
            height: Number(previewDims[1]) || 0,
            tags: Array.isArray(result?.tags)
                ? result.tags.filter((tag) => typeof tag === 'string' && tag.trim()).slice(0, 3)
                : []
        };
    }

    /**
     * Charge une page de résultats Klipy, en tendances ou en recherche, avec mise en cache locale.
     *
     * @param {{ query?: string, pos?: string }} [options]
     * @returns {Promise<KlipyGifFeedPayload>}
     */
    async function fetchKlipyGifFeed({ query = '', pos = '' } = {}) {
        const normalizedQuery = String(query || '').trim();
        const endpoint = normalizedQuery ? 'search' : 'featured';
        const locale = getKlipyApiLocale();
        const cacheKey = JSON.stringify([endpoint, normalizedQuery.toLocaleLowerCase('fr'), String(pos || ''), locale]);

        if (klipyGifResponseCache.has(cacheKey)) {
            return klipyGifResponseCache.get(cacheKey);
        }

        const response = await requestExternal(buildKlipyApiUrl(endpoint, {
            q: normalizedQuery,
            pos,
            limit: KLIPY_MAX_RESULTS_PER_PAGE,
            media_filter: 'gif,tinygif',
            locale
        }), {
            method: 'GET',
            headers: {
                Accept: 'application/json'
            },
            credentials: 'omit',
            timeout: 20000
        });

        let payload = null;
        try {
            payload = await response.json();
        } catch (e) {}

        if (!response.ok) {
            const errorMessage = payload?.error?.message || payload?.message || `HTTP ${response.status}`;
            throw new Error(errorMessage);
        }

        const normalizedPayload = {
            results: Array.isArray(payload?.results)
                ? payload.results.map(normalizeKlipyGifResult).filter(Boolean)
                : [],
            next: typeof payload?.next === 'string' ? payload.next : ''
        };

        setKlipyGifCacheEntry(cacheKey, normalizedPayload);
        return normalizedPayload;
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, function (m) {
            return ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            })[m];
        });
    }

    function getHomepageChatContainer() {
        if (isTr4kerPage()) return null;

        const headers = Array.from(document.querySelectorAll('span.font-medium.text-white.text-sm'));
        for (const span of headers) {
            if (span.textContent.trim() === 'Chat') {
                return span.closest('.bg-zinc-950');
            }
        }
        return null;
    }

    function getActiveChatRoot() {
        if (isChatPage()) return getChatPageMessagesRoot() || document.body;
        if (isHomePage()) return getHomepageMessagesRoot();
        return null;
    }

    function normalizeChatContextLabel(label) {
        return String(label || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ');
    }

    function getChatPageHeaderTitle() {
        if (!isChatPage()) return '';

        if (isTr4kerPage()) {
            const title = document.querySelector('[class*="convTitleGroup"] [class*="convTitleRow"], [class*="convTitleRow"]');
            const value = String(title?.textContent || '').trim();
            if (value && normalizeChatContextLabel(value) !== 'chat') return value;

            const conversationId = new URLSearchParams(location.search).get('conv');
            return conversationId ? `Conversation #${conversationId}` : 'Conversation';
        }

        const titles = Array.from(document.querySelectorAll('h2.text-sm.font-semibold.text-white.truncate'));
        for (const title of titles) {
            const value = String(title.textContent || '').trim();
            if (!value) continue;
            if (normalizeChatContextLabel(value) === 'chat') continue;
            return value;
        }

        return '';
    }

    function getChatPageHeaderElement() {
        if (!isChatPage()) return null;

        if (isTr4kerPage()) {
            return document.querySelector('[class*="_header_1cvih"], [class*="chatArea"] [class*="header"]');
        }

        const titles = Array.from(document.querySelectorAll('h2.text-sm.font-semibold.text-white.truncate'));
        for (const title of titles) {
            const value = String(title.textContent || '').trim();
            if (!value) continue;
            if (normalizeChatContextLabel(value) === 'chat') continue;

            const header = title.closest('div');
            if (header instanceof HTMLElement) {
                return header;
            }
        }

        return null;
    }

    function getChatPageMessagesRoot() {
        if (!isChatPage()) return null;

        if (isTr4kerPage()) {
            const stableRoot = document.querySelector(TR4KER_MESSAGE_ROOT_SELECTOR);
            if (stableRoot instanceof HTMLElement) return stableRoot;

            const firstMessage = document.querySelector(TR4KER_MESSAGE_SELECTOR);
            if (!(firstMessage instanceof HTMLElement)) return null;

            let ancestor = firstMessage.parentElement;
            while (ancestor && ancestor !== document.body) {
                if (ancestor.querySelectorAll(TR4KER_MESSAGE_SELECTOR).length > 1) {
                    return ancestor;
                }
                ancestor = ancestor.parentElement;
            }

            return firstMessage.parentElement;
        }

        const header = getChatPageHeaderElement();
        const getDirectMessageCount = (scroller) => {
            if (!(scroller instanceof HTMLElement)) return 0;
            return scroller.querySelectorAll(':scope > .group.relative.flex.items-start').length;
        };

        const getScrollerCandidates = (scope) => {
            if (!scope || typeof scope.querySelectorAll !== 'function') return [];

            return Array.from(scope.querySelectorAll('div.flex-1.overflow-y-auto.py-2, .overflow-y-auto')).filter((scroller) => {
                if (!(scroller instanceof HTMLElement)) return false;
                if (scroller.closest(`#${PANEL_ID}, #${MODAL_ID}, #${OVERLAY_ID}, #${TOAST_ID}`)) return false;
                if (!scroller.classList.contains('overflow-y-auto')) return false;
                return getDirectMessageCount(scroller) > 0;
            });
        };

        const pickBestScroller = (scrollers) => {
            if (!Array.isArray(scrollers) || scrollers.length === 0) return null;

            return scrollers
                .slice()
                .sort((a, b) =>
                    Number(b.matches('div.flex-1.overflow-y-auto.py-2')) -
                    Number(a.matches('div.flex-1.overflow-y-auto.py-2')) ||
                    getDirectMessageCount(b) - getDirectMessageCount(a)
                )[0] || null;
        };

        if (header instanceof HTMLElement) {
            const directContainer = header.parentElement;
            const directMatch = pickBestScroller(getScrollerCandidates(directContainer));
            if (directMatch) return directMatch;

            const panelContainer = header.closest('.bg-zinc-950');
            const panelMatch = pickBestScroller(getScrollerCandidates(panelContainer));
            if (panelMatch) return panelMatch;

            let ancestor = directContainer?.parentElement || null;
            for (let depth = 0; ancestor && depth < 4; depth += 1, ancestor = ancestor.parentElement) {
                const ancestorMatch = pickBestScroller(getScrollerCandidates(ancestor));
                if (ancestorMatch) return ancestorMatch;
            }
        }

        return pickBestScroller(getScrollerCandidates(document));
    }

    function logMentionDebug(message, details = null) {
        if (!debugMode) return;

        if (details === null) {
            console.debug('[Tr4ker Chat][Mention]', message);
            return;
        }

        console.debug('[Tr4ker Chat][Mention]', message, details);
    }

    function logEmojiDebug(message, details = null) {
        if (!debugMode) return;

        if (details === null) {
            console.log('[Tr4ker Chat][Emoji]', message);
            return;
        }

        console.log('[Tr4ker Chat][Emoji]', message, details);
    }

    function normalizeMentionComparableText(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[\u200b-\u200d\ufeff]/g, '')
            .trim()
            .toLowerCase();
    }

    function getCurrentChatContext() {
        if (!isChatPage()) return null;

        if (isTr4kerPage()) {
            const title = getChatPageHeaderTitle();
            if (isTr4kerPrivateConversation()) {
                return {
                    type: 'private',
                    name: title || 'Conversation privée'
                };
            }

            const conversationId = new URLSearchParams(location.search).get('conv');
            return {
                type: 'channel',
                name: title || (conversationId ? `conversation-${conversationId}` : 'conversation')
            };
        }

        const headerTitle = getChatPageHeaderTitle();
        if (headerTitle) {
            if (headerTitle.startsWith('#')) {
                return {
                    type: 'channel',
                    name: headerTitle.slice(1).trim()
                };
            }

            return {
                type: 'private',
                name: headerTitle
            };
        }

        return null;
    }

    function getCurrentChatContextKey() {
        if (isHomePage()) return 'home';
        if (!isChatPage()) return 'other';

        const context = getCurrentChatContext();
        if (!context) return 'chat:unknown';

        return `${context.type}:${normalizeChatContextLabel(context.name)}`;
    }

    function isTr4kerPrivateConversation() {
        if (!isChatPage() || !isTr4kerPage()) return false;

        const activeNavigationItem = document.querySelector('[class*="navItem"][class*="active"]');
        const activeSection = activeNavigationItem?.closest('section');
        const activeSectionLabel = normalizeChatContextLabel(
            activeSection?.querySelector('[class*="sectionLabelText"]')?.textContent || ''
        );
        if (activeSectionLabel === 'messages prives') return true;
        if (activeSectionLabel === 'canaux') return false;

        const header = getChatPageHeaderElement();
        if (!(header instanceof HTMLElement)) return false;

        const description = normalizeChatContextLabel(
            header.querySelector('[class*="convDescription"]')?.textContent || ''
        );
        if (/\bcanal\b/.test(description)) return false;

        const icon = normalizeChatContextLabel(
            header.querySelector('[class*="convIcon"]')?.textContent || ''
        );
        return /^(person|person_2|alternate_email|account_circle)$/.test(icon);
    }

    function isMentionAndHighlightContextAllowed() {
        if (isHomePage()) return true;
        if (!isChatPage()) return false;

        if (isTr4kerPage()) return !isTr4kerPrivateConversation();

        const context = getCurrentChatContext();
        if (!context) return true;

        return context.type === 'channel' && ALLOWED_CHAT_CHANNELS.has(normalizeChatContextLabel(context.name));
    }

    function getHomepageChatHeader(container = null) {
        const chatContainer = container || getHomepageChatContainer();
        if (!(chatContainer instanceof HTMLElement)) return null;
        return chatContainer.firstElementChild instanceof HTMLElement
            ? chatContainer.firstElementChild
            : null;
    }

    function getHomepageMessagesRoot(container = null) {
        if (isTr4kerPage()) return null;

        const chatContainer = container || getHomepageChatContainer();
        if (!(chatContainer instanceof HTMLElement)) return null;
        return chatContainer.querySelector('.custom-scrollbar');
    }

    function applyMessageTypography(messageEl, scale = chatFontScale) {
        if (!(messageEl instanceof HTMLElement)) return;

        const safeScale = clampChatFontScale(scale);

        if (isTr4kerPage()) {
            const userButton = messageEl.querySelector('[class*="msgSender"]');
            const textBlock = messageEl.querySelector('[class*="msgBubble"]');
            const metaSpans = messageEl.querySelectorAll('[class*="msgMeta"] > *');

            if (userButton instanceof HTMLElement) {
                userButton.style.fontSize = scalePixels(14, safeScale);
                userButton.style.lineHeight = '1.35';
            }
            metaSpans.forEach((span) => {
                if (span instanceof HTMLElement) span.style.fontSize = scalePixels(12, safeScale);
            });
            if (textBlock instanceof HTMLElement) {
                textBlock.style.fontSize = scalePixels(14, safeScale);
                textBlock.style.lineHeight = safeScale >= 1.2 ? '1.6' : '1.5';
            }
            return;
        }

        if (isChatPage()) {
            const userButton = messageEl.querySelector(':scope > .flex-1.min-w-0 > .flex.items-baseline button[type="button"]');
            const textBlock = messageEl.querySelector(':scope > .flex-1.min-w-0 > .text-sm.text-gray-200.break-words');
            const metaSpans = messageEl.querySelectorAll(':scope > .flex-1.min-w-0 > .flex.items-baseline span');

            if (userButton instanceof HTMLElement) {
                userButton.style.fontSize = scalePixels(14, safeScale);
                userButton.style.lineHeight = '1.35';
            }

            metaSpans.forEach((span) => {
                if (span instanceof HTMLElement) {
                    span.style.fontSize = scalePixels(12, safeScale);
                    span.style.lineHeight = '1.35';
                }
            });

            if (textBlock instanceof HTMLElement) {
                textBlock.style.fontSize = scalePixels(14, safeScale);
                textBlock.style.lineHeight = safeScale >= 1.2 ? '1.6' : '1.5';
            }

            return;
        }

        if (isHomePage()) {
            const userSpan = messageEl.querySelector('span.text-xs.font-bold');
            const textBlock = messageEl.querySelector(':scope > .flex-1.min-w-0 > p.break-words.leading-snug');
            const metaSpans = messageEl.querySelectorAll(':scope > .flex-1.min-w-0 > .flex.items-center span:not(.text-xs.font-bold)');

            if (userSpan instanceof HTMLElement) {
                userSpan.style.fontSize = scalePixels(12, safeScale);
                userSpan.style.lineHeight = '1.35';
            }

            metaSpans.forEach((span) => {
                if (span instanceof HTMLElement) {
                    span.style.fontSize = scalePixels(11, safeScale);
                    span.style.lineHeight = '1.35';
                }
            });

            if (textBlock instanceof HTMLElement) {
                textBlock.style.fontSize = scalePixels(13, safeScale);
                textBlock.style.lineHeight = safeScale >= 1.2 ? '1.6' : '1.5';
            }
        }
    }

    function getMessageMetaRow(messageEl) {
        if (!(messageEl instanceof HTMLElement) || !isChatPage()) return null;

        if (isTr4kerPage()) {
            return messageEl.querySelector('[class*="msgMeta"]');
        }

        const exactMetaRow = messageEl.querySelector(':scope > .flex-1.min-w-0 > .flex.items-baseline.gap-2.mb-0\\.5');
        if (exactMetaRow instanceof HTMLElement) {
            return exactMetaRow;
        }

        const fallbackMetaRow = messageEl.querySelector(':scope > .flex-1.min-w-0 > .flex.items-baseline');
        return fallbackMetaRow instanceof HTMLElement ? fallbackMetaRow : null;
    }

    function getMessageMetaAnchorElement(messageEl) {
        const metaRow = getMessageMetaRow(messageEl);
        if (!(metaRow instanceof HTMLElement)) return null;

        const directChildren = Array.from(metaRow.children).filter((child) => child instanceof HTMLElement);
        if (directChildren.length === 0) {
            return metaRow;
        }

        const timestampChild = directChildren.find((child) =>
            parseMessageTimestampKey(child.textContent || '') > 0
        );
        if (timestampChild instanceof HTMLElement) {
            return timestampChild;
        }

        const trailingMetaChild = directChildren
            .slice()
            .reverse()
            .find((child) => {
                const text = String(child.textContent || '').trim();
                return text && child.getClientRects().length > 0;
            });

        return trailingMetaChild instanceof HTMLElement
            ? trailingMetaChild
            : directChildren[directChildren.length - 1];
    }

    function syncMessageActionsAnchorVars(messageEl) {
        if (!(messageEl instanceof HTMLElement)) return;

        if (!isChatPage()) {
            messageEl.style.removeProperty('--tm-message-actions-inline-left');
            messageEl.style.removeProperty('--tm-message-actions-inline-top');
            messageEl.removeAttribute('data-tm-message-actions-stacked');
            return;
        }

        const metaRow = getMessageMetaRow(messageEl);
        const anchorEl = getMessageMetaAnchorElement(messageEl);
        const hasVisibleMetaAnchor =
            metaRow instanceof HTMLElement &&
            anchorEl instanceof HTMLElement &&
            metaRow.getClientRects().length > 0 &&
            anchorEl.getClientRects().length > 0;

        if (!hasVisibleMetaAnchor) {
            messageEl.style.removeProperty('--tm-message-actions-inline-left');
            messageEl.style.removeProperty('--tm-message-actions-inline-top');
            if (isTr4kerPage() && messageActionsLeftEnabled && getMessageActionButtonsContainer(messageEl)) {
                messageEl.setAttribute('data-tm-message-actions-stacked', '1');
            } else {
                messageEl.removeAttribute('data-tm-message-actions-stacked');
            }
            return;
        }

        messageEl.removeAttribute('data-tm-message-actions-stacked');

        const messageRect = messageEl.getBoundingClientRect();
        const metaRowRect = metaRow.getBoundingClientRect();
        const anchorRect = anchorEl.getBoundingClientRect();
        if (messageRect.width <= 0 || metaRowRect.width <= 0 || anchorRect.width <= 0) return;

        const inlineLeft = Math.max(8, Math.round(anchorRect.right - messageRect.left + 8));
        const inlineTop = Math.max(0, Math.round(metaRowRect.top - messageRect.top));

        messageEl.style.setProperty('--tm-message-actions-inline-left', `${inlineLeft}px`);
        messageEl.style.setProperty('--tm-message-actions-inline-top', `${inlineTop}px`);
    }

    function applyChatFontScale(scale = chatFontScale) {
        const root = getActiveChatRoot();
        if (!root) return;

        root.querySelectorAll('div').forEach((el) => {
            if (isChatMessage(el)) {
                applyMessageTypography(el, scale);
                syncMessageActionsAnchorVars(el);
            }
        });
    }

    function getUsernameFromMessage(messageEl) {
        if (!(messageEl instanceof HTMLElement)) return null;

        if (isTr4kerPage()) {
            const sender = messageEl.querySelector('[class*="msgSender"]');
            return sender instanceof HTMLElement ? sender.textContent.trim() : null;
        }

        if (isChatPage()) {
            const userBtn = messageEl.querySelector(':scope > .flex-1.min-w-0 > .flex.items-baseline button[type="button"]');
            if (!userBtn) return null;
            return userBtn.textContent.trim();
        }

        if (isHomePage()) {
            const userSpan = messageEl.querySelector('span.text-xs.font-bold');
            if (!userSpan) return null;
            return userSpan.textContent.trim();
        }

        return null;
    }

    function isChatMessage(el) {
        if (!(el instanceof HTMLElement)) return false;

        if (isTr4kerPage()) {
            return el.matches(TR4KER_MESSAGE_SELECTOR) && !!el.querySelector('[class*="msgBubble"]');
        }

        // On ne veut matcher que le conteneur principal du message,
        // pas les div internes.
        const isMessageContainer =
              el.classList.contains('group') &&
              el.classList.contains('relative') &&
              el.classList.contains('flex') &&
              el.classList.contains('items-start');

        if (!isMessageContainer) return false;

        if (isChatPage()) {
            const hasTextBlock = !!el.querySelector(':scope > .flex-1.min-w-0 > .text-sm.text-gray-200.break-words');
            const hasHeaderWithUser = !!el.querySelector(':scope > .flex-1.min-w-0 > .flex.items-baseline button[type="button"]');
            const hasAvatarSlot = !!el.querySelector(':scope > .flex-shrink-0.w-7, :scope > .flex-shrink-0.w-7.md\\:w-9');

            // Ici on accepte :
            // - message complet (avatar + pseudo + texte)
            // - message de suite (slot avatar vide + texte)
            return hasTextBlock && hasAvatarSlot;
        }

        if (isHomePage()) {
            const hasTextBlock = !!el.querySelector(':scope > .flex-1.min-w-0 > p.break-words.leading-snug');
            const hasAvatarSlot = !!el.querySelector(':scope > .flex-shrink-0.w-6');

            return hasTextBlock && hasAvatarSlot;
        }

        return false;
    }

    function incrementBlockedCount(username, messageEl) {
        if (alreadyCountedMessages.has(messageEl)) return;
        alreadyCountedMessages.add(messageEl);

        if (!sessionBlockedCounts[username]) {
            sessionBlockedCounts[username] = 0;
        }

        sessionBlockedCounts[username]++;
    }

    function buildStatsHtml() {
        const entries = Object.entries(sessionBlockedCounts)
            .filter(([user]) => hiddenUsers.has(user))
            .sort((a, b) => b[1] - a[1]);

        const total = entries.reduce((sum, [, count]) => sum + count, 0);
        const isCompactMode = statsDisplayMode === STATS_DISPLAY_MODE_COMPACT;
        const isMiniMode = statsDisplayMode === STATS_DISPLAY_MODE_MINI;
        const createStatsActionButtonHtml = (action, title, label, fontSize = '15px') => `
            <button type="button" data-tm-action="${action}" title="${title}" aria-label="${title}" style="
                border:none;
                background:#27272a;
                color:#d4d4d8;
                border-radius:8px;
                width:24px;
                height:24px;
                display:inline-flex;
                align-items:center;
                justify-content:center;
                cursor:pointer;
                font-size:${fontSize};
                font-weight:600;
                line-height:1;
            ">${label}</button>
        `;
        const settingsButtonHtml = `
            <button type="button" data-tm-action="open-settings" title="Ouvrir les paramètres" aria-label="Ouvrir les paramètres" style="
                border:none;
                background:#27272a;
                color:#d4d4d8;
                border-radius:8px;
                width:24px;
                height:24px;
                display:inline-flex;
                align-items:center;
                justify-content:center;
                cursor:pointer;
                font-size:14px;
                font-weight:600;
                line-height:1;
            ">⚙</button>
        `;

        if (isMiniMode) {
            return `
                <div data-tm-stats-drag-handle="1" style="display:flex;align-items:center;gap:10px;white-space:nowrap;cursor:move;user-select:none;">
                    <div style="font-size:12px;color:#cfcfcf;">
                        Total : <span style="color:#fff;font-weight:700;">${total}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;margin-left:auto;">
                        ${settingsButtonHtml}
                        ${createStatsActionButtonHtml('set-stats-display-expanded', 'Développer la stats box', '+')}
                    </div>
                </div>
            `;
        }

        let html = `
            <div data-tm-stats-drag-handle="1" style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px;cursor:move;user-select:none;">
                <div style="font-weight:700;font-size:13px;color:#fff;">
                    Messages bloqués
                </div>
                <div style="display:flex;align-items:center;gap:6px;">
                    ${settingsButtonHtml}
                    ${isCompactMode
                        ? createStatsActionButtonHtml('set-stats-display-mini', 'Passer la stats box en pastille', '--', '16px')
                        : createStatsActionButtonHtml('set-stats-display-compact', 'Réduire la stats box', '-', '15px')
                    }
                    ${isCompactMode
                        ? createStatsActionButtonHtml('set-stats-display-expanded', 'Développer la stats box', '+', '15px')
                        : ''
                    }
                </div>
            </div>

            <div style="font-size:12px;color:#cfcfcf;margin-bottom:8px;">
                Total session : <span style="color:#fff;font-weight:700;">${total}</span>
                <span style="display:block;margin-top:4px;color:#a1a1aa;">Blacklist : ${hiddenUsers.size} pseudo${hiddenUsers.size > 1 ? 's' : ''}</span>
            </div>
        `;

        if (!isCompactMode && entries.length === 0) {
            html += `
                <div style="font-size:12px;color:#9ca3af;">
                    Aucun message bloqué pour l’instant
                </div>
            `;
        } else if (!isCompactMode) {
            html += `<div style="display:flex;flex-direction:column;gap:6px;">`;

            for (const [user, count] of entries) {
                html += `
                    <div style="display:flex;justify-content:space-between;gap:10px;font-size:12px;">
                        <span style="color:#93c5fd;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(user)}</span>
                        <span style="color:#fff;font-weight:700;">${count}</span>
                    </div>
                `;
            }

            html += `</div>`;
        }

        html += `
            <div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.08);font-size:11px;color:#9ca3af;line-height:1.45;">
                <p>Ctrl+Alt+C ou Ctrl+Cmd+C : paramètres · ${formatAfkShortcutLabel()} : mode AFK · Alt+clic pseudo : blacklist</p>
                <p>${debugMode ? 'Mode debug activé' : ''}</p>
            </div>
        `;

        return html;
    }

    function scheduleStatsBoxUpdate() {
        if (!statsContent || statsUpdateFrame !== null) return;

        statsUpdateFrame = window.requestAnimationFrame(() => {
            statsUpdateFrame = null;
            updateStatsBox();
        });
    }

    function escapeRegExp(str) {
        return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function updateStatsBox() {
        if (!statsContent) return;
        statsContent.innerHTML = buildStatsHtml();
    }

    function getOrCreateToast() {
        let toast = document.getElementById(TOAST_ID);
        if (toast) return toast;
        if (!document.body) return null;

        toast = document.createElement('div');
        toast.id = TOAST_ID;
        toast.style.position = 'fixed';
        toast.style.left = '50%';
        toast.style.bottom = '18px';
        toast.style.transform = 'translate(-50%, 12px)';
        toast.style.zIndex = '1000002';
        toast.style.maxWidth = 'min(420px, calc(100vw - 24px))';
        toast.style.padding = '10px 14px';
        toast.style.borderRadius = '12px';
        toast.style.background = 'rgba(24,24,27,0.96)';
        toast.style.border = '1px solid rgba(255,255,255,0.08)';
        toast.style.boxShadow = '0 14px 30px rgba(0,0,0,0.35)';
        toast.style.color = '#fff';
        toast.style.font = '600 12px/1.4 Inter, Arial, sans-serif';
        toast.style.opacity = '0';
        toast.style.pointerEvents = 'none';
        toast.style.transition = 'opacity 140ms ease, transform 140ms ease';

        document.body.appendChild(toast);
        return toast;
    }

    function removeToast() {
        if (toastHideTimer) {
            clearTimeout(toastHideTimer);
            toastHideTimer = null;
        }

        const toast = document.getElementById(TOAST_ID);
        if (toast) toast.remove();
    }

    function showToast(message, isError = false) {
        const toast = getOrCreateToast();
        if (!toast) return;

        toast.textContent = message;
        toast.style.color = isError ? '#fecaca' : '#fff';
        toast.style.borderColor = isError ? 'rgba(248,113,113,0.35)' : 'rgba(255,255,255,0.08)';
        toast.style.opacity = '1';
        toast.style.transform = 'translate(-50%, 0)';

        if (toastHideTimer) clearTimeout(toastHideTimer);
        toastHideTimer = window.setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translate(-50%, 12px)';
            toastHideTimer = null;
        }, 2200);
    }

    function formatAfkShortcutLabel() {
        return 'Ctrl+Alt+A ou Ctrl+Cmd+A';
    }

    function getAfkWatchedUsername() {
        return normalizeName(afkState.username || mentionSettings.username || '');
    }

    function isAfkEnabledForCurrentContext() {
        return afkState.enabled === true &&
            afkState.ownerTabId === afkTabId &&
            afkState.contextKey === getCurrentChatContextKey();
    }

    function doesCurrentTabOwnAfkState() {
        return !!afkState.ownerTabId && afkState.ownerTabId === afkTabId;
    }

    function hasAfkActivityForContext(contextKey = getCurrentChatContextKey()) {
        const normalizedContextKey = String(contextKey || '').trim();
        if (!normalizedContextKey) return false;

        return afkActivityRecords.some((record) => String(record?.contextKey || '').trim() === normalizedContextKey);
    }

    function shouldDisplayAfkPanelForCurrentPage() {
        if (!isSupportedPage()) return false;
        if (!doesCurrentTabOwnAfkState()) return false;

        const currentContextKey = getCurrentChatContextKey();
        if (!currentContextKey) return false;

        if (afkState.enabled === true) {
            return afkState.contextKey === currentContextKey;
        }

        return hasAfkActivityForContext(currentContextKey);
    }

    function isAfkMentionSoundMutedForCurrentContext() {
        return isAfkEnabledForCurrentContext() && afkState.muteMentionSound === true;
    }

    function isAfkAutoReplyEnabled() {
        return afkState.enabled === true && afkState.autoReplyEnabled === true;
    }

    function getAfkReasonLabel(reason) {
        if (reason === 'reply') return 'Réponse';
        if (reason === 'mention+reply') return 'Mention + réponse';
        return 'Mention';
    }

    function getAfkAutoReplyStatusLabel(record) {
        if (record?.autoReplySent === true) return 'Réponse auto envoyée';

        const status = String(record?.autoReplyStatus || '').trim();
        if (status === 'disabled') return 'Réponse auto désactivée';
        if (status === 'inactive-timeout') return 'Réponses auto coupées après 30 min';
        if (status === 'cooldown') return 'Réponse auto en cooldown';
        if (status === 'already-replied') return 'Déjà notifié récemment';
        if (status === 'send-failed') return 'Réponse auto non envoyée';
        if (status === 'input-unavailable') return 'Chat indisponible';
        if (status === 'missing-username') return 'Pseudo AFK manquant';

        return 'Réponse auto non envoyée';
    }

    function getAfkReadStatusLabel(record) {
        return record?.isRead === true ? 'Lu' : 'Non lu';
    }

    function isAfkAutoReplyWindowExpired(referenceTime = Date.now()) {
        const activatedAt = Math.max(0, Number(afkState.activatedAt) || 0);
        if (!activatedAt) return false;

        return referenceTime - activatedAt >= AFK_AUTO_REPLY_MAX_INACTIVITY_MS;
    }

    function clearAfkReplayProtection() {
        afkReplayProtectionUntil = 0;
        afkReplayProtectionContextKey = '';
    }

    function startAfkReplayProtectionForCurrentContext(durationMs = AFK_RELOAD_REPLAY_PROTECTION_MS) {
        if (!isAfkEnabledForCurrentContext()) {
            clearAfkReplayProtection();
            return;
        }

        afkReplayProtectionContextKey = getCurrentChatContextKey();
        afkReplayProtectionUntil = Date.now() + Math.max(0, Number(durationMs) || 0);
    }

    function isAfkReplayProtectionActive() {
        if (!isAfkEnabledForCurrentContext()) return false;
        if (!afkReplayProtectionUntil || Date.now() > afkReplayProtectionUntil) return false;
        return afkReplayProtectionContextKey === getCurrentChatContextKey();
    }

    function formatAfkRecordTimestamp(record) {
        const messageTimestamp = String(record?.messageTimestamp || '').trim();
        if (messageTimestamp) return messageTimestamp;

        const capturedAt = Math.max(0, Number(record?.capturedAt) || 0);
        if (capturedAt <= 0) return 'Horodatage indisponible';

        return new Date(capturedAt).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function seedAfkSeenMessagesFromCurrentRoot() {
        const root = getActiveChatRoot();
        if (!root) return;

        root.querySelectorAll('div').forEach((element) => {
            if (!(element instanceof HTMLElement)) return;
            if (!isChatMessage(element)) return;

            const signature = getMentionNotificationSignature(element);
            const messageKey = buildAfkMessageKey(signature);
            if (messageKey) {
                afkSeenMessageKeys.add(messageKey);
            }
        });
    }

    function upsertAfkActivityRecord(record) {
        const normalizedRecord = normalizeAfkActivityRecord(record);
        if (!normalizedRecord) return null;

        const existingIndex = afkActivityRecords.findIndex((entry) =>
            entry.signatureHash === normalizedRecord.signatureHash &&
            entry.signatureTimestampKey === normalizedRecord.signatureTimestampKey
        );

        if (existingIndex === -1) {
            afkActivityRecords.unshift(normalizedRecord);
        } else {
            afkActivityRecords[existingIndex] = {
                ...afkActivityRecords[existingIndex],
                ...normalizedRecord,
                isRead: afkActivityRecords[existingIndex].isRead === true,
                readAt: afkActivityRecords[existingIndex].isRead === true
                    ? Math.max(0, Number(afkActivityRecords[existingIndex].readAt) || Number(afkActivityRecords[existingIndex].capturedAt) || 0)
                    : 0
            };
        }

        saveAfkActivityRecords();
        renderAfkPanel();
        return normalizedRecord;
    }

    function setAfkActivityRecordReadState(recordId, isRead) {
        const normalizedRecordId = String(recordId || '').trim();
        if (!normalizedRecordId) {
            return { ok: false, message: 'Entrée AFK introuvable.' };
        }

        let recordFound = false;
        afkActivityRecords = afkActivityRecords.map((record) => {
            if (record.id !== normalizedRecordId) return record;

            recordFound = true;
            return normalizeAfkActivityRecord({
                ...record,
                isRead: isRead === true,
                readAt: isRead === true ? Date.now() : 0
            });
        }).filter(Boolean);

        if (!recordFound) {
            return { ok: false, message: 'Entrée AFK introuvable.' };
        }

        saveAfkActivityRecords();
        renderAfkPanel();

        return {
            ok: true,
            message: isRead === true
                ? 'Message AFK marqué comme lu.'
                : 'Message AFK repassé en non lu.'
        };
    }

    function clearAfkActivityRecords() {
        afkActivityRecords = [];
        saveAfkActivityRecords();
        renderAfkPanel();
    }

    function markAllAfkActivityRecordsRead() {
        let updatedCount = 0;
        const readAt = Date.now();

        afkActivityRecords = afkActivityRecords.map((record) => {
            if (record.isRead === true) return record;

            updatedCount += 1;
            return normalizeAfkActivityRecord({
                ...record,
                isRead: true,
                readAt
            });
        }).filter(Boolean);

        if (updatedCount === 0) {
            return { ok: false, message: 'Aucun message AFK non lu.' };
        }

        saveAfkActivityRecords();
        renderAfkPanel();

        return {
            ok: true,
            message: `${updatedCount} message${updatedCount > 1 ? 's' : ''} AFK marqué${updatedCount > 1 ? 's' : ''} comme lu${updatedCount > 1 ? 's' : ''}.`
        };
    }

    function updateAfkAutoReplyMessage(value) {
        afkMessageDraft = null;
        saveAfkState({
            ...afkState,
            autoReplyMessage: normalizeAfkAutoReplyMessage(value)
        });
        renderAfkPanel();
    }

    function updateAfkAutoReplyEnabled(value) {
        const nextAutoReplyEnabled = value === true;

        saveAfkState({
            ...afkState,
            autoReplyEnabled: nextAutoReplyEnabled,
            activatedAt: afkState.enabled === true && nextAutoReplyEnabled ? Date.now() : 0,
            lastAutoReplyAt: 0,
            perUserReplyAt: {}
        });
        renderAfkPanel();

        return {
            ok: true,
            message: nextAutoReplyEnabled
                ? 'Réponse automatique AFK activée.'
                : 'Réponse automatique AFK désactivée.'
        };
    }

    function updateAfkMuteMentionSound(value) {
        saveAfkState({
            ...afkState,
            muteMentionSound: value === true
        });
        renderAfkPanel();

        return {
            ok: true,
            message: value === true
                ? 'Son des alertes coupé pendant l’AFK.'
                : 'Son des alertes réactivé pendant l’AFK.'
        };
    }

    function disableAfkModeForCurrentContext(reasonLabel = 'après envoi manuel') {
        if (!isAfkEnabledForCurrentContext()) {
            return { ok: false, message: '' };
        }

        const currentContextLabel = getCurrentContextLabel();

        saveAfkState({
            ...afkState,
            enabled: false,
            ownerTabId: afkState.ownerTabId || afkTabId,
            contextKey: '',
            contextLabel: '',
            activatedAt: 0,
            lastAutoReplyAt: 0,
            perUserReplyAt: {}
        });
        afkSeenMessageKeys.clear();
        clearAfkReplayProtection();
        renderAfkPanel();

        return {
            ok: true,
            message: `Mode AFK désactivé ${reasonLabel} pour ${currentContextLabel}.`
        };
    }

    function getAfkTargetingInfo(messageEl, watchedUsername = getAfkWatchedUsername()) {
        const normalizedWatchedUsername = normalizeMentionComparableText(watchedUsername).replace(/^@+/, '');
        if (!normalizedWatchedUsername) {
            return {
                matched: false,
                directMentionMatched: false,
                replyMentionMatched: false,
                reason: 'mention',
                senderDisplayName: getLogicalUsername(messageEl) || '',
                senderUsername: normalizeName(getLogicalUsername(messageEl) || ''),
                messageText: getMessageTextContent(messageEl),
                replyContextText: getMessageReplyContextText(messageEl)
            };
        }

        const senderDisplayName = getLogicalUsername(messageEl) || '';
        const senderUsername = normalizeName(senderDisplayName);
        const messageText = getMessageTextContent(messageEl);
        const replyContextText = getMessageReplyContextText(messageEl);
        const replyAuthorText = getMessageReplyAuthorText(messageEl);
        const normalizedMessageText = normalizeMentionComparableText(messageText);
        const normalizedReplyAuthorText = normalizeMentionComparableText(replyAuthorText).replace(/^@+/, '');
        const mentionRegex = new RegExp(
            `(^|[^\\p{L}\\p{N}_])@${escapeRegExp(normalizedWatchedUsername)}(?=$|[^\\p{L}\\p{N}_])`,
            'u'
        );

        const directMentionMatched = !!normalizedMessageText && mentionRegex.test(normalizedMessageText);
        const replyMentionMatched = isChatPage() && normalizedReplyAuthorText === normalizedWatchedUsername;
        const matched = directMentionMatched || replyMentionMatched;

        return {
            matched,
            directMentionMatched,
            replyMentionMatched,
            reason: directMentionMatched && replyMentionMatched
                ? 'mention+reply'
                : (replyMentionMatched ? 'reply' : 'mention'),
            senderDisplayName,
            senderUsername,
            messageText,
            replyContextText
        };
    }

    function getOrCreateAfkPanel() {
        let panel = document.getElementById(AFK_PANEL_ID);
        if (panel) return panel;
        if (!document.body) return null;

        panel = document.createElement('div');
        panel.id = AFK_PANEL_ID;
        panel.style.position = 'fixed';
        panel.style.left = '18px';
        panel.style.bottom = '18px';
        panel.style.zIndex = '1000001';
        panel.style.width = 'min(380px, calc(100vw - 24px))';
        panel.style.maxHeight = 'min(62vh, 720px)';
        panel.style.overflowY = 'auto';
        panel.style.padding = '14px';
        panel.style.borderRadius = '16px';
        panel.style.background = 'rgba(24,24,27,0.96)';
        panel.style.border = '1px solid rgba(255,255,255,0.08)';
        panel.style.boxShadow = '0 18px 40px rgba(0,0,0,0.4)';
        panel.style.backdropFilter = 'blur(8px)';
        panel.style.fontFamily = 'Inter, Arial, sans-serif';
        panel.style.color = '#fff';

        document.body.appendChild(panel);
        applyAfkPanelPosition(panel);
        constrainAfkPanelToViewport(panel, false);
        return panel;
    }

    function removeAfkPanel() {
        const panel = document.getElementById(AFK_PANEL_ID);
        if (panel) {
            panel.remove();
        }
        afkMessageDraft = null;
    }

    /**
     * Prépare les données dérivées utilisées par le rendu du panneau AFK.
     *
     * @returns {AfkPanelViewModel}
     */
    function getAfkPanelViewModel() {
        const activityCount = afkActivityRecords.length;
        const unreadCount = afkActivityRecords.filter((record) => !record.isRead).length;
        const readCount = Math.max(0, activityCount - unreadCount);
        const autoReplyEnabled = afkState.autoReplyEnabled === true;
        const autoReplyActive = isAfkAutoReplyEnabled();
        const autoReplyWindowExpired = autoReplyActive && isAfkAutoReplyWindowExpired();

        return {
            statusLabel: afkState.enabled
                ? `Actif sur ${escapeHtml(afkState.contextLabel || 'ce chat')}`
                : 'Inactif',
            currentAfkMessage: escapeHtml(
                afkMessageDraft !== null
                    ? String(afkMessageDraft).slice(0, MAX_AFK_AUTO_REPLY_MESSAGE_LENGTH)
                    : (afkState.autoReplyMessage || DEFAULT_AFK_AUTO_REPLY_MESSAGE)
            ),
            activityCount,
            unreadCount,
            readCount,
            autoReplyEnabled,
            autoReplyActive,
            autoReplyWindowExpired,
            muteMentionSound: afkState.muteMentionSound === true,
            toggleLabel: isAfkEnabledForCurrentContext()
                ? 'Désactiver ici'
                : (afkState.enabled ? 'Basculer ici' : 'Activer ici')
        };
    }

    function renderAfkPanelCloseButton() {
        if (afkState.enabled) return '';

        return `
            <button
                type="button"
                data-tm-afk-action="hide-panel"
                title="Masquer le panneau AFK"
                aria-label="Masquer le panneau AFK"
                style="
                    border:none;
                    background:#27272a;
                    color:#fff;
                    width:30px;
                    height:30px;
                    border-radius:10px;
                    cursor:pointer;
                    font-size:18px;
                    line-height:1;
                    flex:0 0 auto;
                "
            >×</button>
        `;
    }

    function renderAfkPanelHeader(viewModel) {
        return `
            <div
                data-tm-afk-drag-handle="1"
                style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:12px;cursor:move;user-select:none;"
            >
                <div style="flex:1 1 auto;min-width:0;">
                    <div style="font-size:15px;font-weight:700;">Mode AFK</div>
                    <div style="margin-top:4px;font-size:11px;color:${afkState.enabled ? '#86efac' : '#a1a1aa'};">${viewModel.statusLabel}</div>
                </div>
                <div style="display:flex;align-items:flex-start;gap:8px;flex:0 0 auto;">
                    <div style="font-size:11px;color:#a1a1aa;text-align:right;line-height:1.4;">
                        ${formatAfkShortcutLabel()}
                    </div>
                    ${renderAfkPanelCloseButton()}
                </div>
            </div>
        `;
    }

    function renderAfkPanelReplySection(viewModel) {
        return `
            <div style="padding:12px;border-radius:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);margin-bottom:12px;">
                <div style="font-size:12px;font-weight:700;color:#d4d4d8;">Réponse automatique</div>
                <div style="margin-top:8px;font-size:11px;color:#a1a1aa;line-height:1.45;">
                    Le suivi AFK peut rester actif sans répondre automatiquement. La réponse auto ne part que si la case ci-dessous est cochée.
                </div>
                <label style="display:flex;align-items:center;gap:8px;margin-top:10px;font-size:12px;color:#e4e4e7;cursor:${afkState.enabled ? 'pointer' : 'default'};">
                    <input
                        id="tm-afk-auto-reply-enabled"
                        type="checkbox"
                        ${viewModel.autoReplyEnabled ? 'checked' : ''}
                        ${afkState.enabled ? '' : 'disabled'}
                        style="width:14px;height:14px;cursor:${afkState.enabled ? 'pointer' : 'not-allowed'};"
                    >
                    <span>Activer réponse automatique</span>
                </label>
                <div style="margin-top:8px;font-size:11px;color:${viewModel.autoReplyWindowExpired ? '#facc15' : '#71717a'};line-height:1.45;">
                    ${!afkState.enabled
                        ? (viewModel.autoReplyEnabled
                            ? 'La réponse automatique sera appliquée à la prochaine activation AFK.'
                            : 'Active d’abord le mode AFK pour pouvoir autoriser les réponses automatiques.')
                        : !viewModel.autoReplyEnabled
                            ? 'Réponses automatiques désactivées. Ce choix sera conservé à la prochaine activation AFK.'
                            : viewModel.autoReplyWindowExpired
                                ? 'Les réponses automatiques sont coupées après 30 minutes d’inactivité, mais les messages continuent d’être enregistrés.'
                                : 'Les réponses automatiques s’arrêtent d’elles-mêmes après 30 minutes d’inactivité, mais le suivi des messages continue.'}
                </div>
                <label style="display:flex;align-items:center;gap:8px;margin-top:10px;font-size:12px;color:#e4e4e7;cursor:pointer;">
                    <input
                        id="tm-afk-mute-mention-sound-enabled"
                        type="checkbox"
                        ${viewModel.muteMentionSound ? 'checked' : ''}
                        style="width:14px;height:14px;cursor:pointer;"
                    >
                    <span>Couper le son des alertes pendant l’AFK</span>
                </label>
                <div style="margin-top:8px;font-size:11px;color:#71717a;line-height:1.45;">
                    Les mentions restent enregistrées dans le suivi AFK. Ce choix sera conservé entre les activations.
                </div>
                <textarea id="tm-afk-message-input" rows="3" maxlength="${MAX_AFK_AUTO_REPLY_MESSAGE_LENGTH}" style="
                    width:100%;
                    margin-top:10px;
                    min-height:88px;
                    resize:vertical;
                    background:#18181b;
                    color:#fff;
                    border:1px solid rgba(255,255,255,0.10);
                    border-radius:10px;
                    padding:10px 12px;
                    outline:none;
                    line-height:1.45;
                ">${viewModel.currentAfkMessage}</textarea>
                <div style="margin-top:8px;font-size:11px;color:#71717a;line-height:1.45;">
                    Message personnalisable, limité à ${MAX_AFK_AUTO_REPLY_MESSAGE_LENGTH} caractères.
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-top:10px;">
                    <div style="font-size:11px;color:#71717a;">
                        Pseudo ciblé : <span style="color:#fff;font-weight:600;">${escapeHtml(getAfkWatchedUsername() || 'non configuré')}</span>
                    </div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        <button type="button" data-tm-afk-action="save-message" style="
                            border:none;
                            background:#2563eb;
                            color:#fff;
                            border-radius:10px;
                            padding:8px 10px;
                            cursor:pointer;
                            font-size:12px;
                            font-weight:600;
                        ">Enregistrer</button>
                        <button type="button" data-tm-afk-action="toggle" style="
                            border:none;
                            background:${afkState.enabled ? '#14532d' : '#3f3f46'};
                            color:#fff;
                            border-radius:10px;
                            padding:8px 10px;
                            cursor:pointer;
                            font-size:12px;
                            font-weight:600;
                        ">${viewModel.toggleLabel}</button>
                        <button type="button" data-tm-afk-action="clear" style="
                            border:none;
                            background:#3f3f46;
                            color:#fca5a5;
                            border-radius:10px;
                            padding:8px 10px;
                            cursor:pointer;
                            font-size:12px;
                            font-weight:600;
                        ">Effacer</button>
                    </div>
                </div>
            </div>
        `;
    }

    function renderAfkPanelRecord(record) {
        return `
            <div style="padding:10px 12px;border-radius:12px;background:${record.isRead ? 'rgba(255,255,255,0.03)' : 'rgba(59,130,246,0.08)'};border:1px solid ${record.isRead ? 'rgba(255,255,255,0.08)' : 'rgba(59,130,246,0.16)'};opacity:${record.isRead ? '0.82' : '1'};">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap;">
                    <div style="font-size:12px;font-weight:700;color:#e0f2fe;">${escapeHtml(record.displayUsername)}</div>
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                        <span style="display:inline-flex;align-items:center;padding:3px 7px;border-radius:999px;background:${record.isRead ? 'rgba(113,113,122,0.18)' : 'rgba(250,204,21,0.14)'};border:1px solid ${record.isRead ? 'rgba(113,113,122,0.28)' : 'rgba(250,204,21,0.22)'};color:${record.isRead ? '#d4d4d8' : '#fde68a'};font-size:10px;font-weight:700;">${escapeHtml(getAfkReadStatusLabel(record))}</span>
                        <span style="display:inline-flex;align-items:center;padding:3px 7px;border-radius:999px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.22);color:#bbf7d0;font-size:10px;font-weight:700;">${escapeHtml(getAfkReasonLabel(record.reason))}</span>
                        <span style="font-size:10px;color:#a1a1aa;">${escapeHtml(formatAfkRecordTimestamp(record))}</span>
                    </div>
                </div>
                <div style="margin-top:8px;font-size:12px;line-height:1.45;color:#e4e4e7;white-space:pre-wrap;word-break:break-word;">${escapeHtml(record.messageText || '(message vide)')}</div>
                ${record.replyContextText ? `
                    <div style="margin-top:6px;font-size:11px;color:#c4b5fd;">
                        Contexte réponse : ${escapeHtml(record.replyContextText)}
                    </div>
                ` : ''}
                <div style="margin-top:8px;font-size:10px;color:${record.autoReplySent ? '#86efac' : '#a1a1aa'};">
                    ${escapeHtml(getAfkAutoReplyStatusLabel(record))}
                </div>
                <div style="margin-top:4px;font-size:10px;color:#71717a;">
                    ${escapeHtml(record.contextLabel || 'Contexte inconnu')}
                </div>
                <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px;">
                    <button
                        type="button"
                        data-tm-afk-record-action="toggle-read"
                        data-tm-afk-record-id="${escapeHtml(record.id)}"
                        style="
                            border:none;
                            background:${record.isRead ? '#3b82f6' : '#3f3f46'};
                            color:#fff;
                            border-radius:10px;
                            padding:7px 10px;
                            cursor:pointer;
                            font-size:11px;
                            font-weight:600;
                        "
                    >${record.isRead ? 'Remettre non lu' : 'Marquer lu'}</button>
                </div>
            </div>
        `;
    }

    function renderAfkPanelRecordsSection(viewModel) {
        return `
            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px;">
                <div style="font-size:12px;font-weight:700;color:#d4d4d8;">Messages à relire</div>
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end;">
                    ${viewModel.unreadCount > 2 ? `
                        <button
                            type="button"
                            data-tm-afk-action="mark-all-read"
                            style="
                                border:none;
                                background:#3b82f6;
                                color:#fff;
                                border-radius:999px;
                                padding:6px 10px;
                                cursor:pointer;
                                font-size:11px;
                                font-weight:600;
                            "
                        >Marquer tout lu</button>
                    ` : ''}
                    <div style="font-size:11px;color:#a1a1aa;text-align:right;line-height:1.4;">
                        ${viewModel.unreadCount} non lu${viewModel.unreadCount > 1 ? 's' : ''} · ${viewModel.readCount} lu${viewModel.readCount > 1 ? 's' : ''}
                    </div>
                </div>
            </div>

            <div id="tm-afk-records" style="display:grid;gap:8px;">
                ${afkActivityRecords.length === 0
                    ? '<div style="font-size:12px;color:#a1a1aa;padding:8px 2px;">Aucun message AFK enregistré pour le moment.</div>'
                    : afkActivityRecords.map((record) => renderAfkPanelRecord(record)).join('')}
            </div>
        `;
    }

    function buildAfkPanelHtml(viewModel) {
        return `
            ${renderAfkPanelHeader(viewModel)}
            ${renderAfkPanelReplySection(viewModel)}
            ${renderAfkPanelRecordsSection(viewModel)}
        `;
    }

    function getAfkPanelElements(panel) {
        return {
            saveMessageBtn: panel.querySelector('[data-tm-afk-action="save-message"]'),
            toggleBtn: panel.querySelector('[data-tm-afk-action="toggle"]'),
            clearBtn: panel.querySelector('[data-tm-afk-action="clear"]'),
            markAllReadBtn: panel.querySelector('[data-tm-afk-action="mark-all-read"]'),
            hidePanelBtn: panel.querySelector('[data-tm-afk-action="hide-panel"]'),
            afkMessageInput: panel.querySelector('#tm-afk-message-input'),
            autoReplyEnabledInput: panel.querySelector('#tm-afk-auto-reply-enabled'),
            muteMentionSoundInput: panel.querySelector('#tm-afk-mute-mention-sound-enabled'),
            dragHandle: panel.querySelector('[data-tm-afk-drag-handle="1"]'),
            recordToggleButtons: Array.from(panel.querySelectorAll('[data-tm-afk-record-action="toggle-read"]'))
        };
    }

    function bindAfkPanelRecordEvents(elements) {
        elements.recordToggleButtons.forEach((button) => {
            if (!(button instanceof HTMLButtonElement)) return;

            button.addEventListener('click', () => {
                const recordId = button.getAttribute('data-tm-afk-record-id') || '';
                const nextIsRead = button.textContent?.includes('Remettre') !== true;
                const result = setAfkActivityRecordReadState(recordId, nextIsRead);
                showToast(result.message, !result.ok);
            });
        });
    }

    function bindAfkPanelDrag(panel, dragHandle) {
        if (!(dragHandle instanceof HTMLElement)) return;

        let dragState = null;

        function finishDrag() {
            if (!dragState) return;
            constrainAfkPanelToViewport(panel);
            stopDrag();
        }

        function stopDrag() {
            dragState = null;
            document.removeEventListener('mousemove', handleDrag, true);
            document.removeEventListener('mouseup', finishDrag, true);
        }

        function handleDrag(event) {
            if (!dragState) return;

            const nextLeft = dragState.startLeft + (event.clientX - dragState.startX);
            const nextTop = dragState.startTop + (event.clientY - dragState.startY);

            panel.style.left = `${nextLeft}px`;
            panel.style.top = `${nextTop}px`;
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
        }

        dragHandle.addEventListener('mousedown', (event) => {
            if (event.button !== 0) return;
            if (event.target instanceof Element && event.target.closest('button, textarea, input, a, select, label')) return;

            const rect = panel.getBoundingClientRect();
            dragState = {
                startX: event.clientX,
                startY: event.clientY,
                startLeft: rect.left,
                startTop: rect.top
            };

            document.addEventListener('mousemove', handleDrag, true);
            document.addEventListener('mouseup', finishDrag, true);
            event.preventDefault();
        });
    }

    function bindAfkPanelEvents(panel, elements) {
        elements.saveMessageBtn?.addEventListener('click', () => {
            updateAfkAutoReplyMessage(elements.afkMessageInput instanceof HTMLTextAreaElement ? elements.afkMessageInput.value : '');
            showToast('Message AFK enregistré.');
        });

        elements.toggleBtn?.addEventListener('click', () => {
            const result = toggleAfkModeForCurrentContext();
            showToast(result.message, !result.ok);
        });

        elements.clearBtn?.addEventListener('click', () => {
            clearAfkActivityRecords();
            showToast('Historique AFK effacé.');
        });

        elements.markAllReadBtn?.addEventListener('click', () => {
            const result = markAllAfkActivityRecordsRead();
            showToast(result.message, !result.ok);
        });

        elements.autoReplyEnabledInput?.addEventListener('change', () => {
            if (!(elements.autoReplyEnabledInput instanceof HTMLInputElement)) return;
            const result = updateAfkAutoReplyEnabled(elements.autoReplyEnabledInput.checked);
            showToast(result.message, !result.ok);
        });

        elements.muteMentionSoundInput?.addEventListener('change', () => {
            if (!(elements.muteMentionSoundInput instanceof HTMLInputElement)) return;
            const result = updateAfkMuteMentionSound(elements.muteMentionSoundInput.checked);
            showToast(result.message, !result.ok);
        });

        elements.hidePanelBtn?.addEventListener('click', () => {
            saveAfkPanelHidden(true);
            removeAfkPanel();
            showToast('Panneau AFK masqué.');
        });

        elements.afkMessageInput?.addEventListener('keydown', (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                event.preventDefault();
                updateAfkAutoReplyMessage(elements.afkMessageInput.value);
                showToast('Message AFK enregistré.');
            }
        });

        elements.afkMessageInput?.addEventListener('input', () => {
            afkMessageDraft = elements.afkMessageInput.value.slice(0, MAX_AFK_AUTO_REPLY_MESSAGE_LENGTH);
        });

        bindAfkPanelRecordEvents(elements);
        bindAfkPanelDrag(panel, elements.dragHandle);
    }

    /**
     * Rend ou retire le panneau AFK selon le contexte courant, puis réattache ses interactions.
     *
     * @returns {void}
     */
    function renderAfkPanel() {
        if (!shouldDisplayAfkPanelForCurrentPage()) {
            removeAfkPanel();
            return;
        }

        if (isAfkEnabledForCurrentContext() && afkPanelHidden) {
            saveAfkPanelHidden(false);
        }

        if (!afkState.enabled && afkPanelHidden) {
            removeAfkPanel();
            return;
        }

        const panel = getOrCreateAfkPanel();
        if (!(panel instanceof HTMLElement)) return;
        const existingAfkMessageInput = panel.querySelector('#tm-afk-message-input');
        if (
            existingAfkMessageInput instanceof HTMLTextAreaElement &&
            document.activeElement === existingAfkMessageInput
        ) {
            afkMessageDraft = existingAfkMessageInput.value.slice(0, MAX_AFK_AUTO_REPLY_MESSAGE_LENGTH);
            return;
        }

        const viewModel = getAfkPanelViewModel();
        panel.innerHTML = buildAfkPanelHtml(viewModel);
        const elements = getAfkPanelElements(panel);

        bindAfkPanelEvents(panel, elements);
        applyAfkPanelPosition(panel);
        constrainAfkPanelToViewport(panel, false);
    }

    function toggleAfkModeForCurrentContext() {
        if (!isSupportedPage()) {
            return { ok: false, message: 'Mode AFK disponible seulement sur l’accueil ou la page chat.' };
        }

        const watchedUsername = getAfkWatchedUsername();
        if (!watchedUsername) {
            renderAfkPanel();
            return {
                ok: false,
                message: 'Renseigne ton pseudo dans les réglages de mentions avant d’activer le mode AFK.'
            };
        }

        const currentContextKey = getCurrentChatContextKey();
        const currentContextLabel = getCurrentContextLabel();

        if (isAfkEnabledForCurrentContext()) {
            return disableAfkModeForCurrentContext();
        }

        saveAfkState({
            ...afkState,
            enabled: true,
            ownerTabId: afkTabId,
            contextKey: currentContextKey,
            contextLabel: currentContextLabel,
            username: watchedUsername,
            activatedAt: afkState.autoReplyEnabled === true ? Date.now() : 0,
            lastAutoReplyAt: 0,
            perUserReplyAt: {}
        });
        saveAfkPanelHidden(false);
        afkSeenMessageKeys.clear();
        clearAfkReplayProtection();
        seedAfkSeenMessagesFromCurrentRoot();
        renderAfkPanel();

        return {
            ok: true,
            message: afkState.autoReplyEnabled === true
                ? `Mode AFK activé pour ${currentContextLabel}. Réponses auto activées.`
                : `Mode AFK activé pour ${currentContextLabel}. Réponses auto désactivées.`
        };
    }

    function maybeHandleAfkMessage(messageEl) {
        if (!(messageEl instanceof HTMLElement)) return;
        if (!isAfkEnabledForCurrentContext()) return;

        const signature = getMentionNotificationSignature(messageEl);
        const messageKey = buildAfkMessageKey(signature);
        if (!messageKey) return;
        if (afkSeenMessageKeys.has(messageKey)) return;

        if (isAfkReplayProtectionActive()) {
            afkSeenMessageKeys.add(messageKey);
            return;
        }

        afkSeenMessageKeys.add(messageKey);

        const watchedUsername = getAfkWatchedUsername();
        const targetingInfo = getAfkTargetingInfo(messageEl, watchedUsername);
        if (!targetingInfo.matched) return;
        if (!targetingInfo.senderUsername) return;
        if (targetingInfo.senderUsername === watchedUsername) return;

        const now = Date.now();
        const lastReplyAtForUser = Math.max(0, Number(afkState.perUserReplyAt?.[targetingInfo.senderUsername]) || 0);
        const autoReplyMessage = `@${targetingInfo.senderDisplayName || targetingInfo.senderUsername} ${normalizeAfkAutoReplyMessage(afkState.autoReplyMessage)}`;
        const autoReplyEnabled = isAfkAutoReplyEnabled();
        let autoReplySent = false;
        let autoReplyStatus = '';

        if (!watchedUsername) {
            autoReplyStatus = 'missing-username';
        } else if (!autoReplyEnabled) {
            autoReplyStatus = 'disabled';
        } else if (isAfkAutoReplyWindowExpired(now)) {
            autoReplyStatus = 'inactive-timeout';
        } else if (lastReplyAtForUser > 0 && now - lastReplyAtForUser < AFK_AUTO_REPLY_PER_USER_COOLDOWN_MS) {
            autoReplyStatus = 'already-replied';
        } else if (afkState.lastAutoReplyAt > 0 && now - afkState.lastAutoReplyAt < AFK_AUTO_REPLY_GLOBAL_COOLDOWN_MS) {
            autoReplyStatus = 'cooldown';
        } else {
            const sendResult = sendAutomatedChatMessage(autoReplyMessage);
            if (sendResult.ok) {
                autoReplySent = true;
                autoReplyStatus = 'sent';
                saveAfkState({
                    ...afkState,
                    lastAutoReplyAt: now,
                    perUserReplyAt: {
                        ...afkState.perUserReplyAt,
                        [targetingInfo.senderUsername]: now
                    }
                });
            } else {
                autoReplyStatus = sendResult.message === 'Champ de texte non trouvé.'
                    ? 'input-unavailable'
                    : 'send-failed';
            }
        }

        upsertAfkActivityRecord({
            id: `${signature.hash}-${signature.messageTimestampKey || now}`,
            contextKey: afkState.contextKey,
            contextLabel: afkState.contextLabel || getCurrentContextLabel(),
            username: targetingInfo.senderUsername,
            displayUsername: targetingInfo.senderDisplayName || targetingInfo.senderUsername,
            messageText: targetingInfo.messageText,
            replyContextText: targetingInfo.replyContextText,
            reason: targetingInfo.reason,
            messageTimestamp: getMessageTimestampText(messageEl),
            capturedAt: now,
            autoReplySent,
            autoReplyStatus,
            autoReplyText: autoReplySent ? autoReplyMessage : '',
            signatureHash: signature.hash,
            signatureTimestampKey: signature.messageTimestampKey
        });
    }

    function ensureMentionAnimationStyle() {
        if (document.getElementById(MENTION_STYLE_ID)) return;
        if (!document.head) return;

        const style = document.createElement('style');
        style.id = MENTION_STYLE_ID;
        style.textContent = `
            @keyframes tm-torr9-mention-pulse {
                0%, 100% {
                    background: var(--tm-mention-bg-soft);
                    box-shadow:
                        inset 3px 0 0 var(--tm-mention-color),
                        0 0 0 0 var(--tm-mention-glow-soft);
                    filter: brightness(1) saturate(1);
                }
                50% {
                    background: var(--tm-mention-bg-strong);
                    box-shadow:
                        inset 3px 0 0 var(--tm-mention-color),
                        0 0 0 3px var(--tm-mention-glow-strong),
                        0 0 24px -4px var(--tm-mention-glow-strong);
                    filter: brightness(1.18) saturate(1.45);
                }
            }
        `;

        document.head.appendChild(style);
    }

    function ensureModalScrollbarStyle() {
        if (document.getElementById(MODAL_SCROLLBAR_STYLE_ID)) return;
        if (!document.head) return;

        const style = document.createElement('style');
        style.id = MODAL_SCROLLBAR_STYLE_ID;
        style.textContent = `
            #${MODAL_ID}[data-tm-scrollable-modal="1"] {
                scrollbar-width: thin;
                scrollbar-color: rgba(148,163,184,0.62) rgba(255,255,255,0.06);
                scrollbar-gutter: stable both-edges;
            }

            #${MODAL_ID}[data-tm-scrollable-modal="1"]::-webkit-scrollbar {
                width: 12px;
            }

            #${MODAL_ID}[data-tm-scrollable-modal="1"]::-webkit-scrollbar-track {
                background: rgba(255,255,255,0.05);
                border-radius: 999px;
            }

            #${MODAL_ID}[data-tm-scrollable-modal="1"]::-webkit-scrollbar-thumb {
                background: linear-gradient(180deg, rgba(96,165,250,0.78), rgba(129,140,248,0.78));
                border-radius: 999px;
                border: 2px solid rgba(24,24,27,0.98);
            }

            #${MODAL_ID}[data-tm-scrollable-modal="1"]::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(180deg, rgba(125,211,252,0.88), rgba(167,139,250,0.88));
            }
        `;

        document.head.appendChild(style);
    }

    function applyScrollableModalStyle(modal) {
        if (!(modal instanceof HTMLElement)) return;

        ensureModalScrollbarStyle();
        modal.setAttribute('data-tm-scrollable-modal', '1');
        modal.style.overflowY = 'scroll';
        modal.style.overflowX = 'hidden';
    }

    function updateHomeCollapseButton() {
        const button = document.getElementById(HOME_COLLAPSE_BUTTON_ID);
        if (!(button instanceof HTMLButtonElement)) return;

        button.textContent = homeChatCollapsed ? 'Afficher' : 'Cacher';
        button.title = homeChatCollapsed
            ? 'Réafficher la shoutbox d’accueil'
            : 'Masquer la shoutbox d’accueil';
        button.setAttribute('aria-pressed', homeChatCollapsed ? 'true' : 'false');
    }

    function needsHomepageCollapseUiRefresh(container = getHomepageChatContainer()) {
        if (!isHomePage()) return false;
        if (!(container instanceof HTMLElement)) return false;

        const header = getHomepageChatHeader(container);
        const rightArea = header?.lastElementChild;
        const button = document.getElementById(HOME_COLLAPSE_BUTTON_ID);
        const expectedState = homeChatCollapsed ? '1' : '0';

        return (
            !(button instanceof HTMLButtonElement) ||
            !(rightArea instanceof HTMLElement) ||
            button.parentElement !== rightArea ||
            container.dataset.tmHomeCollapsed !== expectedState
        );
    }

    function syncHomepageCollapseUi(force = false) {
        if (!isHomePage()) return;

        const container = getHomepageChatContainer();
        if (!(container instanceof HTMLElement)) return;

        if (!force && !needsHomepageCollapseUiRefresh(container)) {
            updateHomeCollapseButton();
            return;
        }

        applyHomepageChatCollapsedState();
    }

    function ensureHomepageCollapseButton() {
        if (!isHomePage()) return;

        const header = getHomepageChatHeader();
        if (!header) return;

        const rightArea = header.lastElementChild;
        if (!(rightArea instanceof HTMLElement)) return;

        rightArea.style.display = 'flex';
        rightArea.style.alignItems = 'center';
        rightArea.style.gap = '8px';

        let button = document.getElementById(HOME_COLLAPSE_BUTTON_ID);
        if (!(button instanceof HTMLButtonElement)) {
            button = document.createElement('button');
            button.id = HOME_COLLAPSE_BUTTON_ID;
            button.type = 'button';
            button.style.border = '1px solid rgba(255,255,255,0.08)';
            button.style.background = 'rgba(39,39,42,0.95)';
            button.style.color = '#e4e4e7';
            button.style.borderRadius = '999px';
            button.style.padding = '4px 10px';
            button.style.cursor = 'pointer';
            button.style.fontSize = '11px';
            button.style.fontWeight = '600';
            button.style.lineHeight = '1.2';

            button.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleHomepageChatCollapsed();
            });
        }

        if (button.parentElement !== rightArea) {
            rightArea.appendChild(button);
        }

        updateHomeCollapseButton();
    }

    function applyHomepageChatCollapsedState() {
        if (!isHomePage()) return;

        const container = getHomepageChatContainer();
        if (!(container instanceof HTMLElement)) return;

        ensureHomepageCollapseButton();

        const sections = Array.from(container.children).slice(1);

        if (homeChatCollapsed) {
            container.dataset.tmHomeCollapsed = '1';
            container.style.height = 'auto';
            container.style.minHeight = '0';
            container.style.maxHeight = 'none';
            container.style.overflow = 'hidden';

            sections.forEach((section) => {
                if (section instanceof HTMLElement) {
                    section.style.display = 'none';
                }
            });
        } else {
            container.dataset.tmHomeCollapsed = '0';
            container.style.removeProperty('height');
            container.style.removeProperty('min-height');
            container.style.removeProperty('max-height');
            container.style.removeProperty('overflow');

            sections.forEach((section) => {
                if (section instanceof HTMLElement) {
                    section.style.removeProperty('display');
                }
            });
        }

        updateHomeCollapseButton();
        applyHomeChatPopoverState();
    }

    function toggleHomepageChatCollapsed(forceValue = !homeChatCollapsed) {
        saveHomeChatCollapsed(forceValue);
        applyHomepageChatCollapsedState();

        if (isHomePage()) {
            if (homeChatCollapsed) {
                stopObserver();
            } else {
                processAllMessages();
                startObserver();
            }
        }

        showToast(homeChatCollapsed ? 'Shoutbox d’accueil repliée.' : 'Shoutbox d’accueil réaffichée.');
    }

    function applyBoxPosition(position = null) {
        if (!statsBox) return;
        const pos = normalizeStatsBoxPosition(position) || loadPosition();

        if (Object.prototype.hasOwnProperty.call(pos, 'leftPx') && Object.prototype.hasOwnProperty.call(pos, 'topPx')) {
            statsBox.style.left = `${Math.max(0, pos.leftPx)}px`;
            statsBox.style.top = `${Math.max(0, pos.topPx)}px`;
            statsBox.style.right = 'auto';
            statsBox.style.bottom = 'auto';
            return;
        }

        statsBox.style.left = 'auto';
        statsBox.style.top = 'auto';
        statsBox.style.right = `${clamp(pos.rightPercent, 0, MAX_STATS_RIGHT_PERCENT)}%`;
        statsBox.style.bottom = `${clamp(pos.bottomPercent, 0, MAX_STATS_BOTTOM_PERCENT)}%`;
    }

    function applyStatsBoxSize(size = null) {
        if (!statsBox) return;

        const normalizedSize = normalizeStatsBoxSize(size) || loadStatsBoxSize();
        statsBox.style.width = `${normalizedSize?.widthPx || DEFAULT_STATS_BOX_WIDTH_PX}px`;

        if (normalizedSize?.heightPx) {
            statsBox.style.height = `${normalizedSize.heightPx}px`;
            return;
        }

        statsBox.style.removeProperty('height');
    }

    function constrainStatsBoxToViewport(persistPosition = true, persistSize = false) {
        if (!(statsBox instanceof HTMLElement)) return;
        if (statsBox.style.display === 'none') return;

        const margin = 12;
        const maxWidth = Math.max(MIN_STATS_BOX_WIDTH_PX, window.innerWidth - margin * 2);
        const maxHeight = Math.max(MIN_STATS_BOX_HEIGHT_PX, window.innerHeight - margin * 2);

        if (statsDisplayMode !== STATS_DISPLAY_MODE_MINI) {
            const currentWidth = Math.max(MIN_STATS_BOX_WIDTH_PX, Math.round(statsBox.offsetWidth || Number.parseFloat(statsBox.style.width) || DEFAULT_STATS_BOX_WIDTH_PX));
            const nextWidth = clamp(currentWidth, MIN_STATS_BOX_WIDTH_PX, maxWidth);
            statsBox.style.width = `${nextWidth}px`;

            if (statsBox.style.height && statsBox.style.height !== 'auto') {
                const currentHeight = Math.max(MIN_STATS_BOX_HEIGHT_PX, Math.round(statsBox.offsetHeight || Number.parseFloat(statsBox.style.height) || MIN_STATS_BOX_HEIGHT_PX));
                const nextHeight = clamp(currentHeight, MIN_STATS_BOX_HEIGHT_PX, maxHeight);
                statsBox.style.height = `${nextHeight}px`;

                if (persistSize) {
                    saveStatsBoxSize({
                        widthPx: nextWidth,
                        heightPx: nextHeight
                    });
                }
            }
        }

        const rect = statsBox.getBoundingClientRect();
        const currentLeft = statsBox.style.left && statsBox.style.left !== 'auto'
            ? Number.parseFloat(statsBox.style.left) || rect.left
            : rect.left;
        const currentTop = statsBox.style.top && statsBox.style.top !== 'auto'
            ? Number.parseFloat(statsBox.style.top) || rect.top
            : rect.top;
        const nextLeft = clamp(currentLeft, margin, Math.max(margin, window.innerWidth - rect.width - margin));
        const nextTop = clamp(currentTop, margin, Math.max(margin, window.innerHeight - rect.height - margin));

        statsBox.style.left = `${nextLeft}px`;
        statsBox.style.top = `${nextTop}px`;
        statsBox.style.right = 'auto';
        statsBox.style.bottom = 'auto';

        if (persistPosition) {
            savePosition({
                leftPx: nextLeft,
                topPx: nextTop
            });
        }
    }

    function ensureStatsBoxResizeHandle() {
        if (!(statsBox instanceof HTMLElement)) return null;

        let resizeHandle = statsBox.querySelector('[data-tm-stats-resize-handle="1"]');
        if (resizeHandle instanceof HTMLElement) return resizeHandle;

        resizeHandle = document.createElement('div');
        resizeHandle.setAttribute('data-tm-stats-resize-handle', '1');
        resizeHandle.title = 'Redimensionner la stats box';
        resizeHandle.style.position = 'absolute';
        resizeHandle.style.right = '2px';
        resizeHandle.style.bottom = '2px';
        resizeHandle.style.width = '16px';
        resizeHandle.style.height = '16px';
        resizeHandle.style.borderRadius = '0 0 12px 0';
        resizeHandle.style.cursor = 'nwse-resize';
        resizeHandle.style.background = 'linear-gradient(135deg, transparent 0 44%, rgba(255,255,255,0.14) 44% 56%, transparent 56% 100%)';
        resizeHandle.style.opacity = '0.9';
        resizeHandle.style.zIndex = '2';

        statsBox.appendChild(resizeHandle);
        return resizeHandle;
    }

    function applyStatsBoxDisplayModeState() {
        if (!statsBox) return;
        const resizeHandle = ensureStatsBoxResizeHandle();

        if (statsDisplayMode === STATS_DISPLAY_MODE_MINI) {
            statsBox.style.width = 'auto';
            statsBox.style.maxWidth = 'calc(100vw - 24px)';
            statsBox.style.maxHeight = 'none';
            statsBox.style.overflow = 'hidden';
            statsBox.style.overflowY = 'hidden';
            statsBox.style.overflowX = 'hidden';
            statsBox.style.height = 'auto';
            statsBox.style.minWidth = '0';
            statsBox.style.minHeight = '0';
            statsBox.style.padding = '8px 10px';
            statsBox.style.borderRadius = '999px';
            if (resizeHandle instanceof HTMLElement) {
                resizeHandle.style.display = 'none';
            }
            return;
        }

        statsBox.style.minWidth = `${MIN_STATS_BOX_WIDTH_PX}px`;
        statsBox.style.minHeight = `${MIN_STATS_BOX_HEIGHT_PX}px`;
        statsBox.style.maxWidth = 'calc(100vw - 24px)';
        statsBox.style.maxHeight = 'calc(100vh - 24px)';
        statsBox.style.overflow = 'hidden';
        statsBox.style.overflowY = 'auto';
        statsBox.style.overflowX = 'hidden';
        statsBox.style.padding = '12px';
        statsBox.style.borderRadius = '14px';
        if (resizeHandle instanceof HTMLElement) {
            resizeHandle.style.display = 'block';
        }
        applyStatsBoxSize();
    }

    function applyStatsBoxVisibilityState() {
        if (!statsBox) return;
        statsBox.style.display = statsHidden ? 'none' : 'block';
    }

    function createStatsBox() {
        if (!isSupportedPage()) return;

        const existing = document.getElementById(PANEL_ID);
        if (existing) {
            statsBox = existing;
            statsContent = existing.firstElementChild;
            ensureStatsBoxResizeHandle();
            bindStatsBoxEvents();
            applyStatsBoxDisplayModeState();
            applyStatsBoxVisibilityState();
            applyBoxPosition();
            updateStatsBox();
            constrainStatsBoxToViewport(false, false);
            return;
        }

        statsBox = document.createElement('div');
        statsBox.id = PANEL_ID;
        statsBox.style.position = 'fixed';
        statsBox.style.zIndex = '999999';
        statsBox.style.width = `${DEFAULT_STATS_BOX_WIDTH_PX}px`;
        statsBox.style.maxWidth = 'calc(100vw - 24px)';
        statsBox.style.maxHeight = '50vh';
        statsBox.style.overflowY = 'auto';
        statsBox.style.padding = '12px';
        statsBox.style.borderRadius = '14px';
        statsBox.style.background = 'rgba(24, 24, 27, 0.92)';
        statsBox.style.backdropFilter = 'blur(8px)';
        statsBox.style.border = '1px solid rgba(255,255,255,0.08)';
        statsBox.style.boxShadow = '0 10px 30px rgba(0,0,0,0.35)';
        statsBox.style.fontFamily = 'Inter, Arial, sans-serif';
        statsBox.style.boxSizing = 'border-box';

        statsContent = document.createElement('div');
        statsBox.appendChild(statsContent);
        ensureStatsBoxResizeHandle();

        document.body.appendChild(statsBox);

        bindStatsBoxEvents();
        applyStatsBoxDisplayModeState();
        applyStatsBoxVisibilityState();
        applyBoxPosition();
        updateStatsBox();
        constrainStatsBoxToViewport(false, false);
    }

    function removeStatsBox() {
        if (statsUpdateFrame !== null) {
            window.cancelAnimationFrame(statsUpdateFrame);
            statsUpdateFrame = null;
        }

        if (statsBoxResizeObserver) {
            statsBoxResizeObserver.disconnect();
            statsBoxResizeObserver = null;
        }

        const existing = document.getElementById(PANEL_ID);
        if (existing) existing.remove();
        statsBox = null;
        statsContent = null;
    }

    function bindStatsBoxEvents() {
        if (!statsBox || statsBox.dataset.tmBound === '1') return;

        statsBox.dataset.tmBound = '1';
        statsBox.addEventListener('click', handleStatsBoxActionClick);

        let dragState = null;
        let resizeState = null;

        function stopPointerInteractions() {
            dragState = null;
            resizeState = null;
            document.removeEventListener('mousemove', handlePointerMove, true);
            document.removeEventListener('mouseup', finishPointerInteraction, true);
        }

        function finishPointerInteraction() {
            if (resizeState) {
                saveStatsBoxSize({
                    widthPx: Math.round(statsBox.offsetWidth || DEFAULT_STATS_BOX_WIDTH_PX),
                    heightPx: Math.round(statsBox.offsetHeight || MIN_STATS_BOX_HEIGHT_PX)
                });
                constrainStatsBoxToViewport(true, false);
                stopPointerInteractions();
                return;
            }

            if (dragState) {
                constrainStatsBoxToViewport(true, false);
            }

            stopPointerInteractions();
        }

        function handlePointerMove(event) {
            if (resizeState) {
                const nextWidth = clamp(
                    resizeState.startWidth + (event.clientX - resizeState.startX),
                    MIN_STATS_BOX_WIDTH_PX,
                    Math.max(MIN_STATS_BOX_WIDTH_PX, window.innerWidth - 24)
                );
                const nextHeight = clamp(
                    resizeState.startHeight + (event.clientY - resizeState.startY),
                    MIN_STATS_BOX_HEIGHT_PX,
                    Math.max(MIN_STATS_BOX_HEIGHT_PX, window.innerHeight - 24)
                );

                statsBox.style.width = `${Math.round(nextWidth)}px`;
                statsBox.style.height = `${Math.round(nextHeight)}px`;
                return;
            }

            if (!dragState) return;

            const nextLeft = dragState.startLeft + (event.clientX - dragState.startX);
            const nextTop = dragState.startTop + (event.clientY - dragState.startY);

            statsBox.style.left = `${Math.round(nextLeft)}px`;
            statsBox.style.top = `${Math.round(nextTop)}px`;
            statsBox.style.right = 'auto';
            statsBox.style.bottom = 'auto';
        }

        statsBox.addEventListener('mousedown', (event) => {
            if (event.button !== 0) return;

            const target = event.target instanceof Element ? event.target : null;
            if (!target) return;

            const resizeHandle = target.closest('[data-tm-stats-resize-handle="1"]');
            if (resizeHandle && statsDisplayMode !== STATS_DISPLAY_MODE_MINI) {
                const rect = statsBox.getBoundingClientRect();
                resizeState = {
                    startX: event.clientX,
                    startY: event.clientY,
                    startWidth: rect.width,
                    startHeight: rect.height
                };

                document.addEventListener('mousemove', handlePointerMove, true);
                document.addEventListener('mouseup', finishPointerInteraction, true);
                event.preventDefault();
                return;
            }

            const dragHandle = target.closest('[data-tm-stats-drag-handle="1"]');
            if (!dragHandle) return;
            if (target.closest('button, input, textarea, select, a, label')) return;

            const rect = statsBox.getBoundingClientRect();
            dragState = {
                startX: event.clientX,
                startY: event.clientY,
                startLeft: rect.left,
                startTop: rect.top
            };

            document.addEventListener('mousemove', handlePointerMove, true);
            document.addEventListener('mouseup', finishPointerInteraction, true);
            event.preventDefault();
        });

        if ('ResizeObserver' in window) {
            statsBoxResizeObserver = new ResizeObserver(() => {
                if (!(statsBox instanceof HTMLElement)) return;
                if (statsDisplayMode === STATS_DISPLAY_MODE_MINI) return;
                if (!statsBox.style.height || statsBox.style.height === 'auto') return;

                saveStatsBoxSize({
                    widthPx: Math.round(statsBox.offsetWidth || DEFAULT_STATS_BOX_WIDTH_PX),
                    heightPx: Math.round(statsBox.offsetHeight || MIN_STATS_BOX_HEIGHT_PX)
                });
            });
            statsBoxResizeObserver.observe(statsBox);
        }
    }

    function getLogicalUsername(messageEl) {
        const direct = getUsernameFromMessage(messageEl);
        if (direct) return direct;

        let prev = messageEl.previousElementSibling;
        while (prev) {
            if (isChatMessage(prev)) {
                const prevUser = getUsernameFromMessage(prev);
                if (prevUser) return prevUser;
            }
            prev = prev.previousElementSibling;
        }

        return null;
    }

    function clearDebugStyle(messageEl) {
        messageEl.style.removeProperty('background');
        messageEl.style.removeProperty('outline');
        messageEl.style.removeProperty('box-shadow');
        messageEl.style.removeProperty('animation');
        messageEl.style.removeProperty('filter');
        messageEl.style.removeProperty('--tm-mention-color');
        messageEl.style.removeProperty('--tm-mention-glow-soft');
        messageEl.style.removeProperty('--tm-mention-glow-strong');
        messageEl.style.removeProperty('--tm-mention-bg-soft');
        messageEl.style.removeProperty('--tm-mention-bg-strong');
        messageEl.removeAttribute('title');
        messageEl.removeAttribute('data-tm-debug-user');
        messageEl.removeAttribute('data-tm-highlight-user');
        messageEl.removeAttribute('data-tm-mention-highlight');

        const blinkState = mentionBlinkStates.get(messageEl);
        if (blinkState?.timeoutId) {
            clearTimeout(blinkState.timeoutId);
            mentionBlinkStates.delete(messageEl);
        }
    }

    function applyHighlightStyle(messageEl, username, highlightConfig) {
        const color = normalizeHexColor(highlightConfig?.color, DEFAULT_HIGHLIGHT_COLOR);
        const opacityPercent = parseOpacityPercentInput(highlightConfig?.opacityPercent, DEFAULT_HIGHLIGHT_OPACITY);
        const baseAlpha = opacityPercent / 100;
        const accentColor = hexToRgba(color, Math.min(1, baseAlpha * 5.15));
        const edgeColor = hexToRgba(color, Math.min(1, baseAlpha * 7));

        messageEl.style.removeProperty('display');
        messageEl.style.background = hexToRgba(color, baseAlpha);
        messageEl.style.outline = `1px solid ${accentColor}`;
        messageEl.style.boxShadow = `inset 3px 0 0 ${edgeColor}`;
        messageEl.setAttribute('data-tm-highlight-user', username);
        messageEl.title = `Mis en avant : ${username}`;
    }

    function applyMentionHighlightStyle(messageEl) {
        const color = normalizeHexColor(mentionSettings.color, DEFAULT_MENTION_COLOR);
        const opacityPercent = parseOpacityPercentInput(mentionSettings.opacityPercent, DEFAULT_MENTION_OPACITY);
        const baseAlpha = opacityPercent / 100;
        const accentColor = hexToRgba(color, Math.min(1, baseAlpha * 4.55));
        const blinkSeconds = parseBlinkSecondsInput(mentionSettings.blinkSeconds, DEFAULT_MENTION_BLINK_SECONDS);
        const keepHighlightAfterBlink = mentionSettings.keepHighlightAfterBlink !== false;
        const highlightedUsername = normalizeName(getLogicalUsername(messageEl) || '');
        const fallbackHighlightConfig = highlightedUsername ? highlightedUsers[highlightedUsername] : null;
        const signature = `${color}|${opacityPercent}|${blinkSeconds}|${keepHighlightAfterBlink ? 'keep' : 'off'}`;
        const existingState = mentionBlinkStates.get(messageEl);

        ensureMentionAnimationStyle();

        if (existingState?.signature === signature && existingState.timeoutId === null && existingState.persistHighlight !== true) {
            return;
        }

        messageEl.style.removeProperty('display');
        messageEl.style.background = hexToRgba(color, baseAlpha);
        messageEl.style.outline = `1px solid ${accentColor}`;
        messageEl.style.boxShadow = `inset 3px 0 0 ${accentColor}`;
        messageEl.style.setProperty('--tm-mention-color', accentColor);
        messageEl.style.setProperty('--tm-mention-glow-soft', hexToRgba(color, Math.min(1, baseAlpha * 1.22)));
        messageEl.style.setProperty('--tm-mention-glow-strong', hexToRgba(color, Math.min(1, baseAlpha * 3.22)));
        messageEl.style.setProperty('--tm-mention-bg-soft', hexToRgba(color, Math.min(1, baseAlpha * 0.33)));
        messageEl.style.setProperty('--tm-mention-bg-strong', hexToRgba(color, Math.min(1, baseAlpha * 1.78)));
        messageEl.setAttribute('data-tm-mention-highlight', mentionSettings.username);
        messageEl.title = `Mention @${mentionSettings.username}`;

        if (blinkSeconds <= 0) {
            messageEl.style.removeProperty('animation');
            if (existingState?.timeoutId) clearTimeout(existingState.timeoutId);
            mentionBlinkStates.set(messageEl, { signature, timeoutId: null, persistHighlight: true });
            return;
        }

        if (existingState?.signature === signature) return;
        if (existingState?.timeoutId) clearTimeout(existingState.timeoutId);

        // Tr4ker applique ses propres styles sur les lignes de message.
        // La priorité empêche ces styles de neutraliser l'animation userscript.
        messageEl.style.setProperty(
            'animation',
            'tm-torr9-mention-pulse 0.9s ease-in-out infinite',
            'important'
        );

        const timeoutId = window.setTimeout(() => {
            messageEl.style.removeProperty('animation');

            if (keepHighlightAfterBlink) {
                messageEl.style.background = hexToRgba(color, baseAlpha);
                messageEl.style.outline = `1px solid ${accentColor}`;
                messageEl.style.boxShadow = `inset 3px 0 0 ${accentColor}`;
                messageEl.style.removeProperty('filter');
                mentionBlinkStates.set(messageEl, { signature, timeoutId: null, persistHighlight: true });
                return;
            }

            messageEl.style.removeProperty('background');
            messageEl.style.removeProperty('outline');
            messageEl.style.removeProperty('box-shadow');
            messageEl.style.removeProperty('filter');
            messageEl.style.removeProperty('--tm-mention-color');
            messageEl.style.removeProperty('--tm-mention-glow-soft');
            messageEl.style.removeProperty('--tm-mention-glow-strong');
            messageEl.style.removeProperty('--tm-mention-bg-soft');
            messageEl.style.removeProperty('--tm-mention-bg-strong');
            messageEl.removeAttribute('title');
            messageEl.removeAttribute('data-tm-mention-highlight');

            if (fallbackHighlightConfig && highlightedUsername) {
                applyHighlightStyle(messageEl, highlightedUsername, fallbackHighlightConfig);
            }

            mentionBlinkStates.set(messageEl, { signature, timeoutId: null, persistHighlight: false });
        }, blinkSeconds * 1000);

        mentionBlinkStates.set(messageEl, { signature, timeoutId, persistHighlight: true });
    }

    async function playMentionNotificationSound(
        soundStyle = mentionSettings.soundStyle,
        customSoundUrl = mentionSettings.soundCustomUrl
    ) {
        const normalizedStyle = normalizeMentionSoundStyle(soundStyle);
        const normalizedCustomUrl = normalizeMentionSoundCustomUrl(customSoundUrl);

        if (normalizedStyle === 'custom') {
            if (!normalizedCustomUrl) return false;

            try {
                const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
                if (!AudioContextCtor) return false;

                if (!mentionSoundContext) {
                    mentionSoundContext = new AudioContextCtor();
                }

                if (mentionSoundContext.state === 'suspended') {
                    await mentionSoundContext.resume();
                }

                let audioBufferPromise = mentionSoundBufferCache.get(normalizedCustomUrl);
                if (!audioBufferPromise) {
                    // Le fichier est récupéré par Tampermonkey puis décodé en
                    // mémoire. Aucun élément <audio> ne charge l'URL depuis la
                    // page : la CSP media-src de Tr4ker ne peut donc pas le bloquer.
                    audioBufferPromise = requestExternalArrayBuffer(normalizedCustomUrl)
                        .then((audioData) => mentionSoundContext.decodeAudioData(audioData.slice(0)))
                        .catch((error) => {
                            mentionSoundBufferCache.delete(normalizedCustomUrl);
                            throw error;
                        });
                    mentionSoundBufferCache.set(normalizedCustomUrl, audioBufferPromise);
                }

                const audioBuffer = await audioBufferPromise;
                const source = mentionSoundContext.createBufferSource();
                const gainNode = mentionSoundContext.createGain();
                source.buffer = audioBuffer;
                gainNode.gain.value = 1;
                source.connect(gainNode);
                gainNode.connect(mentionSoundContext.destination);
                source.start();
                return true;
            } catch (e) {
                return false;
            }
        }

        const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextCtor) return false;

        if (!mentionSoundContext) {
            mentionSoundContext = new AudioContextCtor();
        }

        if (mentionSoundContext.state === 'suspended') {
            try {
                await mentionSoundContext.resume();
            } catch (e) {
                return false;
            }
        }

        const now = mentionSoundContext.currentTime;

        function scheduleTone({
            type = 'sine',
            startOffset = 0,
            duration = 0.24,
            fromFrequency = 880,
            toFrequency = 1320,
            peakGain = 0.1,
            attack = 0.015,
            releaseOffset = null
        }) {
            const startTime = now + Math.max(0, startOffset);
            const stopTime = startTime + Math.max(0.05, duration);
            const oscillator = mentionSoundContext.createOscillator();
            const gainNode = mentionSoundContext.createGain();

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(fromFrequency, startTime);
            oscillator.frequency.exponentialRampToValueAtTime(
                Math.max(40, toFrequency),
                stopTime
            );

            gainNode.gain.setValueAtTime(0.0001, startTime);
            gainNode.gain.exponentialRampToValueAtTime(
                Math.max(0.0002, peakGain),
                startTime + Math.min(attack, duration / 2)
            );
            gainNode.gain.exponentialRampToValueAtTime(
                0.0001,
                releaseOffset === null ? stopTime : startTime + Math.min(duration, releaseOffset)
            );

            oscillator.connect(gainNode);
            gainNode.connect(mentionSoundContext.destination);
            oscillator.start(startTime);
            oscillator.stop(stopTime);
        }

        if (normalizedStyle === 'soft') {
            scheduleTone({
                type: 'triangle',
                duration: 0.34,
                fromFrequency: 440,
                toFrequency: 700,
                peakGain: 0.075,
                attack: 0.018,
                releaseOffset: 0.3
            });
        } else if (normalizedStyle === 'bell') {
            scheduleTone({
                type: 'triangle',
                duration: 0.48,
                fromFrequency: 1040,
                toFrequency: 1680,
                peakGain: 0.095,
                attack: 0.01,
                releaseOffset: 0.4
            });
            scheduleTone({
                type: 'sine',
                startOffset: 0.025,
                duration: 0.42,
                fromFrequency: 1560,
                toFrequency: 2280,
                peakGain: 0.048,
                attack: 0.008,
                releaseOffset: 0.32
            });
        } else if (normalizedStyle === 'double') {
            scheduleTone({
                type: 'square',
                duration: 0.16,
                fromFrequency: 620,
                toFrequency: 980,
                peakGain: 0.07,
                attack: 0.01,
                releaseOffset: 0.12
            });
            scheduleTone({
                type: 'square',
                startOffset: 0.2,
                duration: 0.17,
                fromFrequency: 760,
                toFrequency: 1180,
                peakGain: 0.082,
                attack: 0.01,
                releaseOffset: 0.12
            });
        } else {
            scheduleTone({
                type: 'sine',
                duration: 0.26,
                fromFrequency: 920,
                toFrequency: 1560,
                peakGain: 0.09,
                attack: 0.012,
                releaseOffset: 0.22
            });
        }

        return true;
    }

    function maybeNotifyMention(messageEl) {
        if (!(messageEl instanceof HTMLElement)) return;
        if (isAfkMentionSoundMutedForCurrentContext()) {
            mentionSoundNotifiedMessages.add(messageEl);
            logMentionDebug('skip: muted by AFK setting, message recorded as handled');
            return;
        }
        if (!isMentionSoundEnabledForCurrentPage()) {
            logMentionDebug('skip: sound disabled or out of scope');
            return;
        }
        if (mentionSoundNotifiedMessages.has(messageEl)) {
            logMentionDebug('skip: message element already handled for this session');
            return;
        }

        const signature = getMentionNotificationSignature(messageEl);
        logMentionDebug('candidate', {
            signature,
            lastMentionSoundRecord,
            recentMentionSoundRecordsCount: recentMentionSoundRecords.length,
            lastMentionSoundAt,
            messageText: getMessageTextContent(messageEl),
            messageTimestamp: getMessageTimestampText(messageEl)
        });

        if (signature && hasRememberedMentionSoundRecord(signature)) {
            logMentionDebug('skip: already covered by recent history', {
                signature,
                recentMentionSoundRecordsCount: recentMentionSoundRecords.length
            });
            mentionSoundNotifiedMessages.add(messageEl);
            return;
        }

        if (
            signature &&
            lastMentionSoundRecord &&
            (
                (
                    signature.messageTimestampKey > 0 &&
                    lastMentionSoundRecord.messageTimestampKey > 0 &&
                    signature.messageTimestampKey < lastMentionSoundRecord.messageTimestampKey
                ) ||
                (
                    signature.messageTimestampKey === lastMentionSoundRecord.messageTimestampKey &&
                    signature.hash === lastMentionSoundRecord.hash
                ) ||
                (
                    (
                        signature.messageTimestampKey <= 0 ||
                        lastMentionSoundRecord.messageTimestampKey <= 0
                    ) &&
                    signature.hash === lastMentionSoundRecord.hash
                )
            )
        ) {
            logMentionDebug('skip: already covered by last record', {
                signature,
                lastMentionSoundRecord
            });
            rememberMentionSoundRecord({
                hash: signature.hash,
                messageTimestamp: signature.messageTimestamp,
                messageTimestampKey: signature.messageTimestampKey,
                notifiedAt: lastMentionSoundRecord.notifiedAt
            });
            mentionSoundNotifiedMessages.add(messageEl);
            return;
        }

        mentionSoundNotifiedMessages.add(messageEl);

        const cooldownSeconds = parseMentionSoundCooldownInput(
            mentionSettings.soundCooldownSeconds,
            DEFAULT_MENTION_SOUND_COOLDOWN_SECONDS
        );
        const now = Date.now();

        if (cooldownSeconds > 0 && now - lastMentionSoundAt < cooldownSeconds * 1000) {
            logMentionDebug('skip: cooldown active', {
                signature,
                cooldownSeconds,
                now,
                lastMentionSoundAt,
                remainingMs: Math.max(0, cooldownSeconds * 1000 - (now - lastMentionSoundAt))
            });
            if (signature) {
                saveLastMentionSoundRecord({
                    hash: signature.hash,
                    messageTimestamp: signature.messageTimestamp,
                    messageTimestampKey: signature.messageTimestampKey,
                    notifiedAt: lastMentionSoundAt
                });
                rememberMentionSoundRecord({
                    hash: signature.hash,
                    messageTimestamp: signature.messageTimestamp,
                    messageTimestampKey: signature.messageTimestampKey,
                    notifiedAt: lastMentionSoundAt
                });
            }
            return;
        }

        const previousLastMentionSoundAt = lastMentionSoundAt;
        if (signature) {
            logMentionDebug('record: pre-play', {
                signature,
                previousLastMentionSoundAt,
                attemptAt: now
            });
            saveLastMentionSoundRecord({
                hash: signature.hash,
                messageTimestamp: signature.messageTimestamp,
                messageTimestampKey: signature.messageTimestampKey,
                notifiedAt: previousLastMentionSoundAt
            });
            rememberMentionSoundRecord({
                hash: signature.hash,
                messageTimestamp: signature.messageTimestamp,
                messageTimestampKey: signature.messageTimestampKey,
                notifiedAt: previousLastMentionSoundAt
            });
        }

        lastMentionSoundAt = now;
        void playMentionNotificationSound(mentionSettings.soundStyle, mentionSettings.soundCustomUrl).then((played) => {
            if (!played) {
                logMentionDebug('play result: failed', {
                    signature,
                    attemptedAt: now,
                    previousLastMentionSoundAt
                });
                if (lastMentionSoundAt === now) {
                    lastMentionSoundAt = previousLastMentionSoundAt;
                }
                return;
            }
            if (!signature) return;
            logMentionDebug('play result: success', {
                signature,
                notifiedAt: now
            });
            saveLastMentionSoundRecord({
                hash: signature.hash,
                messageTimestamp: signature.messageTimestamp,
                messageTimestampKey: signature.messageTimestampKey,
                notifiedAt: now
            });
            rememberMentionSoundRecord({
                hash: signature.hash,
                messageTimestamp: signature.messageTimestamp,
                messageTimestampKey: signature.messageTimestampKey,
                notifiedAt: now
            });
        });
    }

    function hideOrShowMessage(messageEl, options = {}) {
        const allowMentionSound = options.allowMentionSound === true;
        const allowMentionAndHighlight = options.allowMentionAndHighlight !== false;
        applyMessageTypography(messageEl);
        syncMessageActionsAnchorVars(messageEl);
        syncMessageReactionQuickAccessButtons(messageEl);
        syncMessageReplyContextHover(messageEl);
        updateMessageTextBlockUrls(messageEl);

        const username = getLogicalUsername(messageEl);

        if (!username) {
            messageEl.style.removeProperty('display');
            clearDebugStyle(messageEl);
            return;
        }

        const normalized = normalizeName(username);
        const highlightConfig = highlightedUsers[normalized];
        const mentionsWatchedUser = messageMentionsWatchedUser(messageEl);

        if (hiddenUsers.has(normalized)) {
            incrementBlockedCount(normalized, messageEl);

            if (debugMode) {
                messageEl.style.removeProperty('display');
                messageEl.style.background = 'rgba(255, 0, 0, 0.14)';
                messageEl.style.outline = '1px solid rgba(255, 80, 80, 0.65)';
                messageEl.setAttribute('data-tm-debug-user', normalized);
                messageEl.title = `Bloqué détecté : ${normalized}`;
            } else {
                clearDebugStyle(messageEl);
                messageEl.style.display = 'none';
            }
        } else if (allowMentionAndHighlight && mentionsWatchedUser) {
            clearDebugStyle(messageEl);
            applyMentionHighlightStyle(messageEl);
            if (allowMentionSound) {
                maybeNotifyMention(messageEl);
            }
        } else if (allowMentionAndHighlight && highlightConfig) {
            clearDebugStyle(messageEl);
            applyHighlightStyle(messageEl, normalized, highlightConfig);
        } else {
            messageEl.style.removeProperty('display');
            clearDebugStyle(messageEl);
        }

        maybeHandleAfkMessage(messageEl);
    }

    function processAllMessages() {
        if (isHomePage() && homeChatCollapsed) return;

        applyChatPageScrollbarState();

        const root = getActiveChatRoot();
        if (!root) return;
        const allowMentionAndHighlight = isMentionAndHighlightContextAllowed();

        const allDivs = root.querySelectorAll('div');
        allDivs.forEach(el => {
            if (isChatMessage(el)) {
                hideOrShowMessage(el, {
                    allowMentionSound: false,
                    allowMentionAndHighlight
                });
            }
        });

        scheduleStatsBoxUpdate();
    }

    function processNode(node) {
        if (isHomePage() && homeChatCollapsed) return;

        const root = getActiveChatRoot();
        if (!root) return;
        if (!(node instanceof HTMLElement)) return;
        if (node !== root && !root.contains(node) && node !== document.body) return;
        if (node.closest(`#${PANEL_ID}, #${AFK_PANEL_ID}, #${MODAL_ID}, #${OVERLAY_ID}, #${IMAGE_VIEWER_MODAL_ID}, #${IMAGE_VIEWER_OVERLAY_ID}, #${TOAST_ID}`)) return;
        const allowMentionAndHighlight = isMentionAndHighlightContextAllowed();

        if (isChatMessage(node)) {
            hideOrShowMessage(node, {
                allowMentionSound: true,
                allowMentionAndHighlight
            });
        }

        node.querySelectorAll?.('div').forEach(el => {
            if (isChatMessage(el)) {
                hideOrShowMessage(el, {
                    allowMentionSound: true,
                    allowMentionAndHighlight
                });
            }
        });

        scheduleStatsBoxUpdate();
    }

    function addOrToggleUser(usernameRaw) {
        const username = normalizeName(usernameRaw);
        if (!username) return { ok: false, message: 'Pseudo vide.' };

        if (hiddenUsers.has(username)) {
            hiddenUsers.delete(username);
            saveHiddenUsers();
            processAllMessages();
            updateStatsBox();
            return { ok: true, message: `Utilisateur réaffiché : ${usernameRaw}` };
        } else {
            hiddenUsers.add(username);
            saveHiddenUsers();
            processAllMessages();
            updateStatsBox();
            return { ok: true, message: `Utilisateur masqué : ${usernameRaw}` };
        }
    }

    function addOrUpdateHighlightedUser(usernameRaw, colorRaw, opacityPercentRaw) {
        const username = normalizeName(usernameRaw);
        if (!username) return { ok: false, message: 'Pseudo vide.' };

        const color = normalizeHexColor(colorRaw);
        const opacityPercent = parseOpacityPercentInput(opacityPercentRaw, DEFAULT_HIGHLIGHT_OPACITY);
        const hadHighlight = !!highlightedUsers[username];

        highlightedUsers[username] = { color, opacityPercent };
        saveHighlightedUsers();
        processAllMessages();
        updateStatsBox();

        return {
            ok: true,
            message: hadHighlight
                ? `Couleur mise à jour pour ${usernameRaw}`
                : `Utilisateur mis en avant : ${usernameRaw}`
        };
    }

    function removeHighlightedUser(usernameRaw) {
        const username = normalizeName(usernameRaw);
        if (!username) return { ok: false, message: 'Pseudo vide.' };
        if (!highlightedUsers[username]) return { ok: false, message: 'Pseudo non mis en avant.' };

        delete highlightedUsers[username];
        saveHighlightedUsers();
        processAllMessages();
        updateStatsBox();

        return { ok: true, message: `Mise en avant retirée : ${usernameRaw}` };
    }

    function updateMentionSettings(
        usernameRaw,
        colorRaw,
        opacityPercentRaw,
        blinkSecondsRaw,
        keepHighlightAfterBlinkRaw,
        includeReplyContextRaw,
        soundScopeRaw,
        soundStyleRaw,
        soundCustomUrlRaw,
        soundCooldownSecondsRaw
    ) {
        const username = normalizeName(usernameRaw);
        const color = normalizeHexColor(colorRaw, DEFAULT_MENTION_COLOR);
        const opacityPercent = parseOpacityPercentInput(opacityPercentRaw, DEFAULT_MENTION_OPACITY);
        const blinkSeconds = parseBlinkSecondsInput(blinkSecondsRaw, DEFAULT_MENTION_BLINK_SECONDS);
        const keepHighlightAfterBlink = !!keepHighlightAfterBlinkRaw;
        const includeReplyContext = !!includeReplyContextRaw;
        const soundScope = normalizeMentionSoundScope(soundScopeRaw);
        const soundStyle = normalizeMentionSoundStyle(soundStyleRaw);
        const soundCustomUrl = normalizeMentionSoundCustomUrl(soundCustomUrlRaw);
        const soundCooldownSeconds = parseMentionSoundCooldownInput(
            soundCooldownSecondsRaw,
            DEFAULT_MENTION_SOUND_COOLDOWN_SECONDS
        );

        saveMentionSettings({
            username,
            color,
            opacityPercent,
            blinkSeconds,
            keepHighlightAfterBlink,
            includeReplyContext,
            soundScope,
            soundStyle,
            soundCustomUrl,
            soundCooldownSeconds
        });
        processAllMessages();
        updateStatsBox();

        if (!mentionSettings.username) {
            return { ok: true, message: 'Surveillance des mentions désactivée.' };
        }

        return {
            ok: true,
            message: isMentionSoundScopeEnabled(mentionSettings.soundScope)
                ? `Mentions surveillées pour @${mentionSettings.username} avec son`
                : `Mentions surveillées pour @${mentionSettings.username}`
        };
    }

    function closeImageCatalogDeleteConfirmation(confirmed = false) {
        if (typeof imageCatalogDeleteConfirmationClose === 'function') {
            imageCatalogDeleteConfirmationClose(confirmed);
        }
    }

    function confirmImageCatalogRemoteDeletion(record) {
        closeImageCatalogDeleteConfirmation(false);

        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.id = IMAGE_CATALOG_DELETE_CONFIRMATION_ID;
            dialog.setAttribute('role', 'dialog');
            dialog.setAttribute('aria-modal', 'true');
            dialog.setAttribute('aria-label', 'Confirmation de suppression ImgBB');
            dialog.style.position = 'fixed';
            dialog.style.inset = '0';
            dialog.style.zIndex = '1000002';
            dialog.style.display = 'flex';
            dialog.style.alignItems = 'center';
            dialog.style.justifyContent = 'center';
            dialog.style.padding = '12px';
            dialog.style.background = 'rgba(0,0,0,0.52)';
            dialog.innerHTML = `
                <div data-tm-image-delete-confirmation-card="1" style="
                    width:min(400px, 100%);
                    background:#18181b;
                    border:1px solid rgba(255,255,255,0.12);
                    border-radius:16px;
                    box-shadow:0 20px 50px rgba(0,0,0,0.5);
                    padding:18px;
                    color:#fff;
                    font-family:Inter,Arial,sans-serif;
                ">
                    <div style="font-size:14px;font-weight:700;">Supprimer l’image ImgBB ?</div>
                    <div data-tm-image-delete-confirmation-description="1" style="margin-top:8px;font-size:12px;line-height:1.5;color:#d4d4d8;"></div>
                    <div style="display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:16px;">
                        <button type="button" data-tm-image-delete-confirmation-cancel="1" style="border:none;background:#3f3f46;color:#fff;border-radius:9px;padding:9px 11px;cursor:pointer;font-weight:600;">Annuler</button>
                        <button type="button" data-tm-image-delete-confirmation-confirm="1" style="border:none;background:#b91c1c;color:#fff;border-radius:9px;padding:9px 11px;cursor:pointer;font-weight:700;">Supprimer</button>
                    </div>
                </div>
            `;

            const description = dialog.querySelector('[data-tm-image-delete-confirmation-description="1"]');
            if (description instanceof HTMLElement) {
                description.textContent = `L’image « ${record?.title || 'sans titre'} » sera supprimée sur ImgBB. L’entrée locale ne sera retirée qu’après vérification.`;
            }

            const finish = (confirmed) => {
                if (!dialog.isConnected && imageCatalogDeleteConfirmationClose !== finish) return;
                document.removeEventListener('keydown', onKeyDown, true);
                dialog.remove();
                if (imageCatalogDeleteConfirmationClose === finish) {
                    imageCatalogDeleteConfirmationClose = null;
                }
                resolve(confirmed === true);
            };
            const onKeyDown = (event) => {
                if (event.key !== 'Escape') return;
                event.preventDefault();
                event.stopPropagation();
                finish(false);
            };

            imageCatalogDeleteConfirmationClose = finish;
            dialog.addEventListener('click', (event) => {
                if (event.target === dialog) finish(false);
                event.stopPropagation();
            });
            dialog.querySelector('[data-tm-image-delete-confirmation-cancel="1"]')?.addEventListener('click', () => finish(false));
            const confirmButton = dialog.querySelector('[data-tm-image-delete-confirmation-confirm="1"]');
            confirmButton?.addEventListener('click', () => finish(true));
            document.addEventListener('keydown', onKeyDown, true);
            document.body.appendChild(dialog);
            if (confirmButton instanceof HTMLButtonElement) confirmButton.focus();
        });
    }

    function closeSettingsModal() {
        closeImageCatalogDeleteConfirmation(false);
        const modal = document.getElementById(MODAL_ID);
        const overlay = document.getElementById(OVERLAY_ID);
        if (modal) modal.remove();
        if (overlay) overlay.remove();
        modalOpen = false;
        hideImagePreview();
        applyChatFontScale(loadChatFontScale());
        applyStatsBoxDisplayModeState();
        applyStatsBoxVisibilityState();
        syncHomepageCollapseUi(true);
        applyBoxPosition(loadPosition());
        constrainStatsBoxToViewport(false, false);
        updateStatsBox();
    }

    function getSettingsModalElements(modal) {
        return {
            closeBtn: modal.querySelector('#tm-close-modal'),
            userInput: modal.querySelector('#tm-user-input'),
            phrasesConfigureBtn: modal.querySelector('#tm-phrases-configure'),
            phrasesSummary: modal.querySelector('#tm-phrases-summary'),
            scriptConfigExportBtn: modal.querySelector('#tm-script-config-export'),
            scriptConfigImportBtn: modal.querySelector('#tm-script-config-import'),
            scriptConfigImportFileInput: modal.querySelector('#tm-script-config-import-file'),
            toggleBtn: modal.querySelector('#tm-user-toggle'),
            phrasesEnabledToggle: modal.querySelector('#tm-phrases-enabled-toggle'),
            klipyGifsToggle: modal.querySelector('#tm-klipy-gifs-toggle'),
            imageHostingEnabledToggle: modal.querySelector('#tm-image-hosting-enabled-toggle'),
            imageHostingExpanded: modal.querySelector('#tm-image-hosting-expanded'),
            imgbbApiKeyInput: modal.querySelector('#tm-imgbb-api-key-input'),
            imgbbApiKeySaveBtn: modal.querySelector('#tm-imgbb-api-key-save'),
            imgbbApiKeyLinkBtn: modal.querySelector('#tm-imgbb-api-key-link'),
            imageHostingExpirationSelect: modal.querySelector('#tm-image-hosting-expiration-select'),
            imageUploadDropzone: modal.querySelector('#tm-image-upload-dropzone'),
            imageUploadPickBtn: modal.querySelector('#tm-image-upload-pick'),
            imageUploadFileInput: modal.querySelector('#tm-image-upload-file-input'),
            imageDirectUrlInput: modal.querySelector('#tm-image-direct-url-input'),
            imageDirectUrlAddBtn: modal.querySelector('#tm-image-direct-url-add'),
            imageCatalogPurgeBtn: modal.querySelector('#tm-image-catalog-purge'),
            imageCatalogClearBtn: modal.querySelector('#tm-image-catalog-clear'),
            imageCatalogList: modal.querySelector('#tm-image-catalog-list'),
            imageCatalogStatus: modal.querySelector('#tm-image-catalog-status'),
            quickAccessModeSelect: modal.querySelector('#tm-quick-access-mode'),
            emojiQuickAccessLimitInput: modal.querySelector('#tm-emoji-quick-access-limit'),
            reactionQuickAccessLimitInput: modal.querySelector('#tm-reaction-quick-access-limit'),
            manualEmojiFavoritesList: modal.querySelector('#tm-manual-emoji-favorites-list'),
            manualReactionFavoritesList: modal.querySelector('#tm-manual-reaction-favorites-list'),
            manualEmojiFavoritesClearBtn: modal.querySelector('#tm-manual-emoji-favorites-clear'),
            manualReactionFavoritesClearBtn: modal.querySelector('#tm-manual-reaction-favorites-clear'),
            emojiUsageHistoryOpenBtn: modal.querySelector('#tm-emoji-usage-history-open'),
            emojiUsageHistoryPanel: modal.querySelector('#tm-emoji-usage-history-panel'),
            emojiUsageHistoryCloseBtn: modal.querySelector('#tm-emoji-usage-history-close'),
            emojiUsageHistoryResetBtn: modal.querySelector('#tm-emoji-usage-history-reset'),
            emojiUsageHistoryEmojiList: modal.querySelector('#tm-emoji-usage-history-emoji-list'),
            reactionUsageHistoryReactionList: modal.querySelector('#tm-emoji-usage-history-reaction-list'),
            hiddenUsersList: modal.querySelector('#tm-hidden-users-list'),
            highlightUserInput: modal.querySelector('#tm-highlight-user-input'),
            highlightColorInput: modal.querySelector('#tm-highlight-color-input'),
            highlightOpacityInput: modal.querySelector('#tm-highlight-opacity-input'),
            highlightOpacityValue: modal.querySelector('#tm-highlight-opacity-value'),
            highlightPreview: modal.querySelector('#tm-highlight-preview'),
            highlightPreviewMeta: modal.querySelector('#tm-highlight-preview-meta'),
            highlightPreviewText: modal.querySelector('#tm-highlight-preview-text'),
            highlightSaveBtn: modal.querySelector('#tm-highlight-save'),
            highlightRemoveBtn: modal.querySelector('#tm-highlight-remove'),
            highlightUsersList: modal.querySelector('#tm-highlight-users-list'),
            mentionUserInput: modal.querySelector('#tm-mention-user-input'),
            mentionColorInput: modal.querySelector('#tm-mention-color-input'),
            mentionOpacityInput: modal.querySelector('#tm-mention-opacity-input'),
            mentionOpacityValue: modal.querySelector('#tm-mention-opacity-value'),
            mentionBlinkInput: modal.querySelector('#tm-mention-blink-input'),
            mentionPreview: modal.querySelector('#tm-mention-preview'),
            mentionPreviewMeta: modal.querySelector('#tm-mention-preview-meta'),
            mentionPreviewText: modal.querySelector('#tm-mention-preview-text'),
            mentionKeepHighlightToggle: modal.querySelector('#tm-mention-keep-highlight-toggle'),
            mentionIncludeReplyToggle: modal.querySelector('#tm-mention-include-reply-toggle'),
            mentionSoundScopeGroup: modal.querySelector('#tm-mention-sound-scope-group'),
            mentionSoundScopeButtons: Array.from(modal.querySelectorAll('[data-tm-mention-sound-scope]')),
            mentionSoundOptions: modal.querySelector('#tm-mention-sound-options'),
            mentionSoundStyleSelect: modal.querySelector('#tm-mention-sound-style-select'),
            mentionSoundCustomUrlInput: modal.querySelector('#tm-mention-sound-custom-url-input'),
            mentionSoundCooldownInput: modal.querySelector('#tm-mention-sound-cooldown-input'),
            mentionSoundTestBtn: modal.querySelector('#tm-mention-sound-test'),
            mentionSaveBtn: modal.querySelector('#tm-mention-save'),
            fontSizeRange: modal.querySelector('#tm-font-size-range'),
            fontSizeValue: modal.querySelector('#tm-font-size-value'),
            fontSizeDecreaseBtn: modal.querySelector('#tm-font-size-decrease'),
            fontSizeIncreaseBtn: modal.querySelector('#tm-font-size-increase'),
            fontSizeSaveBtn: modal.querySelector('#tm-font-size-save'),
            fontSizeResetBtn: modal.querySelector('#tm-font-size-reset'),
            linkifyUrlsToggle: modal.querySelector('#tm-linkify-urls-toggle'),
            chatScrollbarToggle: modal.querySelector('#tm-chat-scrollbar-toggle'),
            messageActionsLeftToggle: modal.querySelector('#tm-message-actions-left-toggle'),
            chatInputToolbarInlineToggle: modal.querySelector('#tm-chat-input-toolbar-inline-toggle'),
            chatInputToolbarAlignRightToggle: modal.querySelector('#tm-chat-input-toolbar-align-right-toggle'),
            embedUrlImagesToggle: modal.querySelector('#tm-embed-url-images-toggle'),
            resetStatsLayoutBtn: modal.querySelector('#tm-reset-stats-layout'),
            hideStatsToggle: modal.querySelector('#tm-hide-stats-toggle'),
            debugToggle: modal.querySelector('#tm-debug-toggle'),
            homeCollapseToggle: modal.querySelector('#tm-home-collapse-toggle-setting'),
            feedback: modal.querySelector('#tm-feedback')
        };
    }

    function getSelectedSettingsMentionSoundScope(elements) {
        return normalizeMentionSoundScope(
            elements.mentionSoundScopeGroup?.getAttribute('data-tm-sound-scope') || mentionSettings.soundScope
        );
    }

    function syncSettingsMentionSoundControls(elements) {
        const soundScope = getSelectedSettingsMentionSoundScope(elements);
        const soundEnabled = isMentionSoundScopeEnabled(soundScope);
        const customSoundSelected = elements.mentionSoundStyleSelect?.value === 'custom';

        if (elements.mentionSoundScopeGroup instanceof HTMLElement) {
            elements.mentionSoundScopeGroup.setAttribute('data-tm-sound-scope', soundScope);
        }

        elements.mentionSoundScopeButtons.forEach((button) => {
            if (!(button instanceof HTMLButtonElement)) return;

            const isActive = normalizeMentionSoundScope(button.getAttribute('data-tm-mention-sound-scope')) === soundScope;
            button.style.background = isActive ? '#166534' : '#27272a';
            button.style.borderColor = isActive ? 'rgba(74,222,128,0.42)' : 'rgba(255,255,255,0.08)';
            button.style.color = isActive ? '#ecfdf5' : '#e4e4e7';
            button.style.boxShadow = isActive ? 'inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(34,197,94,0.12)' : 'none';
        });

        if (elements.mentionSoundOptions instanceof HTMLElement) {
            elements.mentionSoundOptions.style.display = soundEnabled ? 'flex' : 'none';
        }

        if (elements.mentionSoundStyleSelect instanceof HTMLSelectElement) {
            elements.mentionSoundStyleSelect.disabled = !soundEnabled;
        }

        if (elements.mentionSoundCooldownInput instanceof HTMLInputElement) {
            elements.mentionSoundCooldownInput.disabled = !soundEnabled;
        }

        if (elements.mentionSoundCustomUrlInput instanceof HTMLInputElement) {
            elements.mentionSoundCustomUrlInput.disabled = !soundEnabled || !customSoundSelected;
        }

        if (elements.mentionSoundTestBtn instanceof HTMLButtonElement) {
            elements.mentionSoundTestBtn.disabled = !soundEnabled;
            elements.mentionSoundTestBtn.style.cursor = soundEnabled ? 'pointer' : 'not-allowed';
        }
    }

    function syncSettingsHighlightPreview(elements) {
        const opacityPercent = parseOpacityPercentInput(
            elements.highlightOpacityInput?.value,
            DEFAULT_HIGHLIGHT_OPACITY
        );
        const previewColor = normalizeHexColor(elements.highlightColorInput?.value, DEFAULT_HIGHLIGHT_COLOR);
        const previewAlpha = opacityPercent / 100;
        const previewAccent = hexToRgba(previewColor, Math.min(1, previewAlpha * 5.15));
        const previewUsername = normalizeName(elements.highlightUserInput?.value || '') || 'pseudo';

        if (elements.highlightOpacityInput instanceof HTMLInputElement) {
            elements.highlightOpacityInput.value = String(opacityPercent);
        }

        if (elements.highlightOpacityValue instanceof HTMLElement) {
            elements.highlightOpacityValue.textContent = `${opacityPercent}%`;
        }

        if (elements.highlightPreview instanceof HTMLElement) {
            elements.highlightPreview.style.background = hexToRgba(previewColor, previewAlpha);
            elements.highlightPreview.style.border = `1px solid ${previewAccent}`;
            elements.highlightPreview.style.boxShadow = `inset 3px 0 0 ${previewAccent}`;
        }

        if (elements.highlightPreviewMeta instanceof HTMLElement) {
            elements.highlightPreviewMeta.textContent = `Mise en avant : ${previewUsername}`;
        }

        if (elements.highlightPreviewText instanceof HTMLElement) {
            elements.highlightPreviewText.textContent = `Exemple de message de ${previewUsername} mis en avant.`;
        }
    }

    function syncSettingsMentionPreview(elements) {
        const previewColor = normalizeHexColor(elements.mentionColorInput?.value, DEFAULT_MENTION_COLOR);
        const previewOpacity = parseOpacityPercentInput(elements.mentionOpacityInput?.value, mentionSettings.opacityPercent);
        const previewAlpha = previewOpacity / 100;
        const previewAccent = hexToRgba(previewColor, Math.min(1, previewAlpha * 4.55));
        const previewUsername = normalizeName(elements.mentionUserInput?.value || '') || 'moi';

        if (elements.mentionOpacityInput instanceof HTMLInputElement) {
            elements.mentionOpacityInput.value = String(previewOpacity);
        }

        if (elements.mentionOpacityValue instanceof HTMLElement) {
            elements.mentionOpacityValue.textContent = `${previewOpacity}%`;
        }

        if (elements.mentionPreview instanceof HTMLElement) {
            elements.mentionPreview.style.background = hexToRgba(previewColor, previewAlpha);
            elements.mentionPreview.style.border = `1px solid ${previewAccent}`;
            elements.mentionPreview.style.boxShadow = `inset 3px 0 0 ${previewAccent}`;
        }

        if (elements.mentionPreviewMeta instanceof HTMLElement) {
            elements.mentionPreviewMeta.textContent = `Mention @${previewUsername}`;
        }

        if (elements.mentionPreviewText instanceof HTMLElement) {
            elements.mentionPreviewText.textContent = `Exemple de message contenant @${previewUsername}.`;
        }
    }

    function refreshSettingsHiddenUsersList(elements, setFeedback) {
        if (!(elements.hiddenUsersList instanceof HTMLElement)) return;

        const users = [...hiddenUsers].sort((a, b) => a.localeCompare(b, 'fr'));
        elements.hiddenUsersList.innerHTML = '';

        if (users.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = '(aucun)';
            empty.style.fontSize = '12px';
            empty.style.color = '#a1a1aa';
            elements.hiddenUsersList.appendChild(empty);
            return;
        }

        for (const user of users) {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.textContent = user;
            chip.style.border = '1px solid rgba(59,130,246,0.25)';
            chip.style.background = 'rgba(59,130,246,0.10)';
            chip.style.color = '#93c5fd';
            chip.style.borderRadius = '999px';
            chip.style.padding = '6px 10px';
            chip.style.fontSize = '12px';
            chip.style.cursor = 'pointer';
            chip.style.lineHeight = '1.2';

            chip.addEventListener('click', () => {
                if (!(elements.userInput instanceof HTMLInputElement)) return;
                elements.userInput.value = user;
                elements.userInput.focus();
                elements.userInput.select();
                setFeedback(`Pseudo chargé : ${user}`);
            });

            elements.hiddenUsersList.appendChild(chip);
        }
    }

    function createSettingsUsageHistoryItem({ count, title, src, fallbackText = '', isReaction = false }) {
        const item = document.createElement('div');
        item.title = title;
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.justifyContent = 'flex-start';
        item.style.gap = '6px';
        item.style.minWidth = '0';
        item.style.padding = '5px 6px';
        item.style.borderRadius = '10px';
        item.style.background = 'rgba(255,255,255,0.03)';
        item.style.border = '1px solid rgba(255,255,255,0.05)';

        if (src) {
            const image = document.createElement('img');
            image.alt = fallbackText || 'emoji';
            image.src = src;
            image.style.width = '18px';
            image.style.height = '18px';
            image.style.objectFit = 'contain';
            image.style.flex = '0 0 auto';
            item.appendChild(image);
        } else {
            const badge = document.createElement('span');
            const compactFallbackText = Array.from(String(fallbackText || '').trim()).slice(0, 2).join('') || (isReaction ? '•' : '?');
            badge.textContent = compactFallbackText;
            badge.style.display = 'inline-flex';
            badge.style.alignItems = 'center';
            badge.style.justifyContent = 'center';
            badge.style.width = '18px';
            badge.style.height = '18px';
            badge.style.flex = '0 0 18px';
            badge.style.borderRadius = '999px';
            badge.style.background = 'rgba(255,255,255,0.08)';
            badge.style.color = '#f4f4f5';
            badge.style.fontSize = isReaction ? '13px' : '11px';
            badge.style.fontWeight = '700';
            badge.style.lineHeight = '1';
            item.appendChild(badge);
        }

        const countBadge = document.createElement('span');
        countBadge.textContent = `${count}`;
        countBadge.style.fontSize = '11px';
        countBadge.style.fontWeight = '700';
        countBadge.style.color = '#f4f4f5';
        countBadge.style.lineHeight = '1';
        countBadge.style.whiteSpace = 'nowrap';
        countBadge.style.overflow = 'hidden';
        countBadge.style.textOverflow = 'ellipsis';

        item.appendChild(countBadge);
        return item;
    }

    function createSettingsManualFavoriteItem(record, isReaction = false, index = 0, total = 0) {
        const wrapper = document.createElement('div');
        wrapper.style.display = 'inline-flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.justifyContent = 'center';
        wrapper.style.cursor = total > 1 ? 'grab' : 'default';
        wrapper.draggable = total > 1;
        wrapper.setAttribute('data-tm-manual-favorite-kind', isReaction ? 'reaction' : 'emoji');
        wrapper.setAttribute('data-tm-manual-favorite-index', String(index));
        wrapper.title = total > 1
            ? 'Maintiens le clic puis glisse pour déplacer ce favori. Clique sur le favori pour le retirer.'
            : 'Clique sur le favori pour le retirer.';

        const item = document.createElement('button');
        item.type = 'button';
        item.title = isReaction
            ? 'Retirer cette réaction des favoris manuels'
            : 'Retirer cet emoji des favoris manuels';
        item.style.display = 'inline-flex';
        item.style.alignItems = 'center';
        item.style.justifyContent = 'center';
        item.style.width = isReaction ? '28px' : '34px';
        item.style.height = isReaction ? '28px' : '34px';
        item.style.padding = '0';
        item.style.border = '1px solid rgba(251,191,36,0.22)';
        item.style.background = 'rgba(113,63,18,0.22)';
        item.style.color = '#fef3c7';
        item.style.borderRadius = isReaction ? '8px' : '999px';
        item.style.cursor = total > 1 ? 'grab' : 'pointer';
        item.style.lineHeight = '1';

        const src = String(record?.src || '').trim();
        if (src) {
            const image = document.createElement('img');
            image.src = src;
            image.alt = record?.alt || record?.title || 'favori';
            image.style.width = isReaction ? '16px' : '22px';
            image.style.height = isReaction ? '16px' : '22px';
            image.style.objectFit = 'contain';
            image.style.pointerEvents = 'none';
            item.appendChild(image);
        } else {
            const label = document.createElement('span');
            const labelText = isReaction
                ? buildReactionQuickAccessLabel(record)
                : buildEmojiInsertionText(record);
            label.textContent = Array.from(labelText || '?').slice(0, isReaction ? 2 : 5).join('');
            label.style.fontSize = isReaction && label.textContent.length > 1 ? '10px' : '12px';
            label.style.fontWeight = '700';
            label.style.pointerEvents = 'none';
            item.appendChild(label);
        }

        item.addEventListener('click', () => {
            const result = isReaction
                ? toggleManualReactionFavoriteRecord(record)
                : toggleManualEmojiFavoriteRecord(record);
            showToast(result.message, !result.ok);
        });

        wrapper.addEventListener('dragstart', (event) => {
            if (total <= 1) return;

            wrapper.style.opacity = '0.52';
            wrapper.style.cursor = 'grabbing';
            event.dataTransfer?.setData('text/plain', JSON.stringify({
                kind: isReaction ? 'reaction' : 'emoji',
                index
            }));
            if (event.dataTransfer) {
                event.dataTransfer.effectAllowed = 'move';
            }
        });

        wrapper.addEventListener('dragend', () => {
            wrapper.style.opacity = '1';
            wrapper.style.cursor = total > 1 ? 'grab' : 'default';
        });

        wrapper.addEventListener('dragover', (event) => {
            if (total <= 1) return;

            event.preventDefault();
            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = 'move';
            }
            wrapper.style.outline = '2px solid rgba(96,165,250,0.72)';
            wrapper.style.outlineOffset = '3px';
        });

        wrapper.addEventListener('dragleave', () => {
            wrapper.style.removeProperty('outline');
            wrapper.style.removeProperty('outline-offset');
        });

        wrapper.addEventListener('drop', (event) => {
            if (total <= 1) return;

            event.preventDefault();
            wrapper.style.removeProperty('outline');
            wrapper.style.removeProperty('outline-offset');

            let payload = null;
            try {
                payload = JSON.parse(event.dataTransfer?.getData('text/plain') || '{}');
            } catch (e) {
                payload = null;
            }

            const payloadKind = String(payload?.kind || '');
            const sourceIndex = Number(payload?.index);
            if (payloadKind !== (isReaction ? 'reaction' : 'emoji') || !Number.isInteger(sourceIndex)) {
                return;
            }

            const moved = isReaction
                ? reorderManualReactionFavorite(sourceIndex, index)
                : reorderManualEmojiFavorite(sourceIndex, index);
            if (moved) showToast('Favori déplacé.');
        });

        wrapper.appendChild(item);
        return wrapper;
    }

    function refreshSettingsManualFavoriteList(list, records, isReaction = false) {
        if (!(list instanceof HTMLElement)) return;

        list.innerHTML = '';

        if (records.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = isReaction ? 'Aucune réaction choisie.' : 'Aucun emoji choisi.';
            empty.style.fontSize = '12px';
            empty.style.color = '#a1a1aa';
            empty.style.padding = '5px 0';
            list.appendChild(empty);
            return;
        }

        records.forEach((record, index) => {
            list.appendChild(createSettingsManualFavoriteItem(record, isReaction, index, records.length));
        });
    }

    function refreshSettingsManualQuickAccessLists(elements) {
        refreshSettingsManualFavoriteList(elements.manualEmojiFavoritesList, manualEmojiFavorites, false);
        refreshSettingsManualFavoriteList(elements.manualReactionFavoritesList, manualReactionFavorites, true);
    }

    function syncSettingsImageHostingExpandedState(elements) {
        if (elements.imageHostingEnabledToggle instanceof HTMLInputElement) {
            elements.imageHostingEnabledToggle.checked = imageHostingEnabled;
        }

        if (elements.imageHostingExpanded instanceof HTMLElement) {
            elements.imageHostingExpanded.style.display = imageHostingEnabled ? 'block' : 'none';
        }

        if (elements.imgbbApiKeyInput instanceof HTMLInputElement) {
            elements.imgbbApiKeyInput.value = imgbbApiKey;
        }

        if (elements.imageHostingExpirationSelect instanceof HTMLSelectElement) {
            elements.imageHostingExpirationSelect.value = String(imageHostingExpirationSeconds);
        }
    }

    function createSettingsImageCatalogItem(record, elements, controls) {
        const item = document.createElement('div');
        item.style.display = 'grid';
        item.style.gridTemplateColumns = '64px minmax(0, 1fr)';
        item.style.gap = '10px';
        item.style.alignItems = 'start';
        item.style.padding = '9px';
        item.style.borderRadius = '12px';
        item.style.background = 'rgba(255,255,255,0.03)';
        item.style.border = '1px solid rgba(255,255,255,0.06)';

        const thumb = document.createElement('img');
        thumb.src = record.thumbUrl || record.url;
        thumb.alt = record.title || 'Image';
        thumb.loading = 'lazy';
        thumb.referrerPolicy = 'no-referrer';
        thumb.style.width = '64px';
        thumb.style.height = '64px';
        thumb.style.objectFit = 'cover';
        thumb.style.borderRadius = '10px';
        thumb.style.background = '#09090b';
        thumb.style.border = '1px solid rgba(255,255,255,0.06)';
        thumb.addEventListener('error', () => {
            const result = removeImageCatalogRecord(record.id);
            if (result.ok) {
                controls.refreshImageCatalogList();
                controls.setFeedback('Image invalide retirée automatiquement du catalogue.');
            }
        }, { once: true });

        const body = document.createElement('div');
        body.style.minWidth = '0';

        const title = document.createElement('div');
        title.textContent = record.title || 'Image';
        title.title = record.title || record.url;
        title.style.fontSize = '12px';
        title.style.fontWeight = '700';
        title.style.color = '#f4f4f5';
        title.style.overflow = 'hidden';
        title.style.textOverflow = 'ellipsis';
        title.style.whiteSpace = 'nowrap';

        const meta = document.createElement('div');
        const metaParts = [
            record.source === 'imgbb' ? 'ImgBB' : 'Lien direct',
            record.width && record.height ? `${record.width}×${record.height}` : '',
            record.size ? formatFileSize(record.size) : '',
            record.expiresAt ? `expire ${formatImageCatalogDate(record.expiresAt)}` : 'permanent'
        ].filter(Boolean);
        meta.textContent = metaParts.join(' · ');
        meta.style.marginTop = '4px';
        meta.style.fontSize = '10px';
        meta.style.color = '#a1a1aa';
        meta.style.lineHeight = '1.35';

        const url = document.createElement('div');
        url.textContent = record.url;
        url.title = record.url;
        url.style.marginTop = '5px';
        url.style.fontSize = '10px';
        url.style.color = '#67e8f9';
        url.style.overflow = 'hidden';
        url.style.textOverflow = 'ellipsis';
        url.style.whiteSpace = 'nowrap';

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '6px';
        actions.style.flexWrap = 'wrap';
        actions.style.marginTop = '8px';

        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.textContent = 'Copier';
        copyBtn.style.border = 'none';
        copyBtn.style.background = '#2563eb';
        copyBtn.style.color = '#fff';
        copyBtn.style.borderRadius = '8px';
        copyBtn.style.padding = '6px 8px';
        copyBtn.style.cursor = 'pointer';
        copyBtn.style.fontSize = '11px';
        copyBtn.style.fontWeight = '600';
        copyBtn.addEventListener('click', async () => {
            const copied = await copyTextToClipboard(record.url);
            controls.setFeedback(copied ? 'Lien image copié.' : 'Copie impossible.', !copied);
        });

        const insertBtn = document.createElement('button');
        insertBtn.type = 'button';
        insertBtn.textContent = 'Insérer';
        insertBtn.style.border = 'none';
        insertBtn.style.background = '#0f766e';
        insertBtn.style.color = '#fff';
        insertBtn.style.borderRadius = '8px';
        insertBtn.style.padding = '6px 8px';
        insertBtn.style.cursor = 'pointer';
        insertBtn.style.fontSize = '11px';
        insertBtn.style.fontWeight = '600';
        insertBtn.addEventListener('click', () => {
            const result = insertTextIntoChatInput(getChatInput(), buildImageEmbedMarkup(record.url), 'Image insérée.');
            controls.setFeedback(result.message, !result.ok);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.textContent = record.deleteUrl ? 'Supprimer' : 'Retirer';
        deleteBtn.title = record.deleteUrl
            ? 'Supprimer via ImgBB, vérifier que l’image ne charge plus, puis retirer l’entrée locale'
            : 'Retirer seulement cette entrée du catalogue local';
        deleteBtn.style.border = 'none';
        deleteBtn.style.background = '#3f3f46';
        deleteBtn.style.color = '#fca5a5';
        deleteBtn.style.borderRadius = '8px';
        deleteBtn.style.padding = '6px 8px';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.fontSize = '11px';
        deleteBtn.style.fontWeight = '600';
        deleteBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (record.deleteUrl) {
                const confirmed = await confirmImageCatalogRemoteDeletion(record);
                if (!confirmed) return;
                controls.setImageCatalogFeedback('Suppression ImgBB en cours, vérification du lien image...');
            }

            deleteBtn.disabled = true;
            deleteBtn.style.opacity = '0.65';
            deleteBtn.textContent = 'Suppression…';
            const result = await deleteImageCatalogRecord(record);
            controls.refreshImageCatalogList();
            controls.setImageCatalogFeedback(result.message, !result.ok);
        });

        actions.appendChild(copyBtn);
        actions.appendChild(insertBtn);
        actions.appendChild(deleteBtn);
        body.appendChild(title);
        body.appendChild(meta);
        body.appendChild(url);
        body.appendChild(actions);
        item.appendChild(thumb);
        item.appendChild(body);
        return item;
    }

    function refreshSettingsImageCatalogList(elements, controls) {
        if (!(elements.imageCatalogList instanceof HTMLElement)) return;

        const modal = elements.imageCatalogList.closest(`#${MODAL_ID}`);
        const previousScrollTop = modal instanceof HTMLElement ? modal.scrollTop : null;
        saveImageCatalog(imageCatalog);
        elements.imageCatalogList.innerHTML = '';

        if (imageCatalog.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = 'Aucune image enregistrée pour le moment.';
            empty.style.fontSize = '12px';
            empty.style.color = '#a1a1aa';
            empty.style.padding = '5px 0';
            elements.imageCatalogList.appendChild(empty);
        } else {
            imageCatalog.forEach((record) => {
                elements.imageCatalogList.appendChild(createSettingsImageCatalogItem(record, elements, controls));
            });
        }

        // Dans une modale à colonnes, reconstruire le catalogue peut provoquer
        // un reflow et donner l'impression que la section ImgBB s'est fermée.
        // On garde donc précisément la position de lecture de la modale.
        if (modal instanceof HTMLElement && previousScrollTop !== null) {
            window.requestAnimationFrame(() => {
                if (modal.isConnected) modal.scrollTop = previousScrollTop;
            });
        }
    }

    async function purgeInvalidImageCatalogRecords(elements, controls) {
        const records = pruneImageCatalogRecords(imageCatalog);
        if (records.length === 0) {
            saveImageCatalog([]);
            controls.refreshImageCatalogList();
            return { ok: true, message: 'Catalogue déjà vide.' };
        }

        controls.setFeedback('Vérification des liens images...');

        const checkedRecords = [];
        let removedCount = imageCatalog.length - records.length;

        for (const record of records) {
            const validation = await validateImageUrl(
                addImageUrlCacheBuster(record.url),
                IMAGE_URL_VALIDATION_TIMEOUT_MS
            );
            if (!validation.ok) {
                removedCount += 1;
                continue;
            }

            checkedRecords.push({
                ...record,
                width: validation.width || record.width,
                height: validation.height || record.height,
                lastCheckedAt: Date.now()
            });
        }

        saveImageCatalog(checkedRecords);
        controls.refreshImageCatalogList();

        return {
            ok: true,
            message: removedCount > 0
                ? `${removedCount} image${removedCount > 1 ? 's' : ''} expirée${removedCount > 1 ? 's' : ''} ou invalide${removedCount > 1 ? 's' : ''} retirée${removedCount > 1 ? 's' : ''}.`
                : 'Catalogue vérifié, aucun lien mort.'
        };
    }

    async function uploadImageFilesFromSettings(files, elements, controls) {
        const imageFiles = extractImageFilesFromFileList(files);
        if (imageFiles.length === 0) {
            controls.setFeedback('Aucune image à uploader.', true);
            return;
        }

        if (!normalizeImgBbApiKey(imgbbApiKey)) {
            controls.setFeedback('Enregistre une clé API ImgBB avant l’upload.', true);
            elements.imgbbApiKeyInput?.focus();
            return;
        }

        let uploadedCount = 0;

        for (const file of imageFiles) {
            controls.setFeedback(`Upload ImgBB en cours : ${file.name || 'image'}...`);
            try {
                const record = await uploadImageFileToImgBb(file, imageHostingExpirationSeconds);
                const result = addImageCatalogRecord(record);
                if (!result.ok) throw new Error(result.message);
                uploadedCount += 1;
                controls.refreshImageCatalogList();
            } catch (e) {
                controls.setFeedback(e?.message || 'Upload ImgBB impossible.', true);
                return;
            }
        }

        controls.setFeedback(`${uploadedCount} image${uploadedCount > 1 ? 's' : ''} uploadée${uploadedCount > 1 ? 's' : ''} et cataloguée${uploadedCount > 1 ? 's' : ''}.`);
    }

    function refreshSettingsHighlightedUsersList(elements, setFeedback) {
        if (!(elements.highlightUsersList instanceof HTMLElement)) return;

        const users = Object.entries(highlightedUsers)
            .sort((a, b) => a[0].localeCompare(b[0], 'fr'));

        elements.highlightUsersList.innerHTML = '';

        if (users.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = '(aucun)';
            empty.style.fontSize = '12px';
            empty.style.color = '#a1a1aa';
            elements.highlightUsersList.appendChild(empty);
            return;
        }

        for (const [user, config] of users) {
            const color = normalizeHexColor(config?.color, DEFAULT_HIGHLIGHT_COLOR);
            const opacityPercent = parseOpacityPercentInput(config?.opacityPercent, DEFAULT_HIGHLIGHT_OPACITY);
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.textContent = user;
            chip.style.border = `1px solid ${hexToRgba(color, 0.38)}`;
            chip.style.background = hexToRgba(color, opacityPercent / 100);
            chip.style.color = color;
            chip.style.borderRadius = '999px';
            chip.style.padding = '6px 10px';
            chip.style.fontSize = '12px';
            chip.style.cursor = 'pointer';
            chip.style.lineHeight = '1.2';

            chip.addEventListener('click', () => {
                if (!(elements.highlightUserInput instanceof HTMLInputElement) || !(elements.highlightColorInput instanceof HTMLInputElement)) {
                    return;
                }

                elements.highlightUserInput.value = user;
                elements.highlightColorInput.value = normalizeHexColor(color);
                if (elements.highlightOpacityInput instanceof HTMLInputElement) {
                    elements.highlightOpacityInput.value = String(opacityPercent);
                }
                syncSettingsHighlightPreview(elements);
                elements.highlightUserInput.focus();
                elements.highlightUserInput.select();
                setFeedback(`Mise en avant chargee : ${user}`);
            });

            elements.highlightUsersList.appendChild(chip);
        }
    }

    function refreshSettingsEmojiUsageList(elements) {
        if (!(elements.emojiUsageHistoryEmojiList instanceof HTMLElement)) return;

        const entries = getTopEmojiUsageRecords(Object.keys(emojiUsageCounts).length);
        elements.emojiUsageHistoryEmojiList.innerHTML = '';

        if (entries.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = 'Aucun emoji utilise pour le moment.';
            empty.style.gridColumn = '1 / -1';
            empty.style.fontSize = '12px';
            empty.style.color = '#a1a1aa';
            empty.style.padding = '6px 2px';
            elements.emojiUsageHistoryEmojiList.appendChild(empty);
            return;
        }

        entries.forEach((entry) => {
            const item = createSettingsUsageHistoryItem({
                count: getEmojiUsageCount(entry),
                title: `${entry.title || entry.alt || entry.src} · ${entry.count} clic${entry.count > 1 ? 's' : ''}`,
                src: entry.src || '',
                fallbackText: entry.title || entry.alt || ''
            });
            elements.emojiUsageHistoryEmojiList.appendChild(item);
        });
    }

    function refreshSettingsReactionUsageList(elements) {
        const reactionList = elements.reactionUsageHistoryReactionList || elements.emojiUsageHistoryReactionList;
        if (!(reactionList instanceof HTMLElement)) return;

        const entries = getTopReactionUsageRecords(Object.keys(reactionUsageCounts).length);
        reactionList.innerHTML = '';

        if (entries.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = 'Aucune reaction utilisee pour le moment.';
            empty.style.gridColumn = '1 / -1';
            empty.style.fontSize = '12px';
            empty.style.color = '#a1a1aa';
            empty.style.padding = '6px 2px';
            reactionList.appendChild(empty);
            return;
        }

        entries.forEach((entry) => {
            const item = createSettingsUsageHistoryItem({
                count: getReactionUsageCount(entry),
                title: `${entry.label || entry.title || entry.alt || entry.src} · ${entry.count} clic${entry.count > 1 ? 's' : ''}`,
                src: entry.src || '',
                fallbackText: entry.title || entry.alt || entry.label || '',
                isReaction: true
            });
            reactionList.appendChild(item);
        });
    }

    function applyMentionSettingsToModalInputs(elements) {
        if (elements.mentionUserInput instanceof HTMLInputElement) {
            elements.mentionUserInput.value = mentionSettings.username;
        }
        if (elements.mentionColorInput instanceof HTMLInputElement) {
            elements.mentionColorInput.value = mentionSettings.color;
        }
        if (elements.mentionOpacityInput instanceof HTMLInputElement) {
            elements.mentionOpacityInput.value = String(mentionSettings.opacityPercent);
        }
        if (elements.mentionBlinkInput instanceof HTMLInputElement) {
            elements.mentionBlinkInput.value = String(mentionSettings.blinkSeconds);
        }
        if (elements.mentionKeepHighlightToggle instanceof HTMLInputElement) {
            elements.mentionKeepHighlightToggle.checked = mentionSettings.keepHighlightAfterBlink;
        }
        if (elements.mentionIncludeReplyToggle instanceof HTMLInputElement) {
            elements.mentionIncludeReplyToggle.checked = mentionSettings.includeReplyContext;
        }
        if (elements.mentionSoundScopeGroup instanceof HTMLElement) {
            elements.mentionSoundScopeGroup.setAttribute('data-tm-sound-scope', mentionSettings.soundScope || DEFAULT_MENTION_SOUND_SCOPE);
        }
        if (elements.mentionSoundStyleSelect instanceof HTMLSelectElement) {
            elements.mentionSoundStyleSelect.value = mentionSettings.soundStyle;
        }
        if (elements.mentionSoundCustomUrlInput instanceof HTMLInputElement) {
            elements.mentionSoundCustomUrlInput.value = mentionSettings.soundCustomUrl || '';
        }
        if (elements.mentionSoundCooldownInput instanceof HTMLInputElement) {
            elements.mentionSoundCooldownInput.value = String(mentionSettings.soundCooldownSeconds);
        }

        syncSettingsMentionPreview(elements);
        syncSettingsMentionSoundControls(elements);
    }

    /**
     * Construit l'API interne de la modale de paramètres pour mutualiser feedback et rafraîchissements UI.
     *
     * @param {Object.<string, Element|null>} elements
     * @returns {Object}
     */
    function createSettingsModalController(elements) {
        function setFeedback(message, isError = false) {
            if (!(elements.feedback instanceof HTMLElement)) return;
            elements.feedback.textContent = message;
            elements.feedback.style.color = isError ? '#fca5a5' : '#93c5fd';
        }

        function setImageCatalogFeedback(message, isError = false) {
            setFeedback(message, isError);
            if (!(elements.imageCatalogStatus instanceof HTMLElement)) return;
            elements.imageCatalogStatus.textContent = message;
            elements.imageCatalogStatus.style.color = isError ? '#fca5a5' : '#93c5fd';
        }

        function syncSavedPhrasesMainSummary() {
            if (elements.phrasesSummary instanceof HTMLElement) {
                elements.phrasesSummary.textContent = formatSavedPhrasesSummaryLabel();
            }
        }

        function syncFontSizeValueLabel() {
            if (elements.fontSizeValue instanceof HTMLElement && elements.fontSizeRange instanceof HTMLInputElement) {
                elements.fontSizeValue.textContent = `${elements.fontSizeRange.value}%`;
            }
        }

        function setPreviewFontScale(scale) {
            if (!(elements.fontSizeRange instanceof HTMLInputElement)) return;
            elements.fontSizeRange.value = formatChatFontScalePercent(scale);
            syncFontSizeValueLabel();
            applyChatFontScale(scale);
        }

        const controller = {
            setFeedback,
            setImageCatalogFeedback,
            syncSavedPhrasesMainSummary,
            getSelectedMentionSoundScope: () => getSelectedSettingsMentionSoundScope(elements),
            syncMentionSoundControlsState: () => syncSettingsMentionSoundControls(elements),
            syncHighlightOpacityValue: () => syncSettingsHighlightPreview(elements),
            syncMentionOpacityPreview: () => syncSettingsMentionPreview(elements),
            refreshHiddenUsersList: () => refreshSettingsHiddenUsersList(elements, setFeedback),
            refreshHighlightedUsersList: () => refreshSettingsHighlightedUsersList(elements, setFeedback),
            refreshEmojiUsageList: () => refreshSettingsEmojiUsageList(elements),
            refreshReactionUsageList: () => refreshSettingsReactionUsageList(elements),
            refreshManualQuickAccessLists: () => refreshSettingsManualQuickAccessLists(elements),
            refreshImageCatalogList: () => refreshSettingsImageCatalogList(elements, controller),
            syncImageHostingExpandedState: () => syncSettingsImageHostingExpandedState(elements),
            syncFontSizeValueLabel,
            setPreviewFontScale,
            applyMentionSettingsToInputs: () => applyMentionSettingsToModalInputs(elements)
        };

        return controller;
    }

    function initializeSettingsModal(elements, controls) {
        controls.refreshHiddenUsersList();
        controls.refreshHighlightedUsersList();
        controls.refreshEmojiUsageList();
        controls.refreshReactionUsageList();
        controls.refreshManualQuickAccessLists();
        controls.syncImageHostingExpandedState();
        controls.refreshImageCatalogList();
        elements.userInput?.focus();
        controls.syncHighlightOpacityValue();
        controls.syncMentionSoundControlsState();
        controls.syncMentionOpacityPreview();
        controls.syncFontSizeValueLabel();
    }

    function bindSettingsModalBlacklistEvents(elements, controls) {
        elements.toggleBtn?.addEventListener('click', () => {
            const result = addOrToggleUser(elements.userInput?.value);
            controls.setFeedback(result.message, !result.ok);
            controls.refreshHiddenUsersList();
            elements.userInput?.focus();
            elements.userInput?.select();
        });

        elements.userInput?.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            elements.toggleBtn?.click();
        });

        elements.highlightSaveBtn?.addEventListener('click', () => {
            const result = addOrUpdateHighlightedUser(
                elements.highlightUserInput?.value,
                elements.highlightColorInput?.value,
                elements.highlightOpacityInput?.value
            );
            controls.setFeedback(result.message, !result.ok);
            controls.refreshHighlightedUsersList();
            elements.highlightUserInput?.focus();
            elements.highlightUserInput?.select();
        });

        elements.highlightRemoveBtn?.addEventListener('click', () => {
            const result = removeHighlightedUser(elements.highlightUserInput?.value);
            controls.setFeedback(result.message, !result.ok);
            controls.refreshHighlightedUsersList();
            elements.highlightUserInput?.focus();
            elements.highlightUserInput?.select();
        });

        elements.highlightUserInput?.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            elements.highlightSaveBtn?.click();
        });
        elements.highlightUserInput?.addEventListener('input', controls.syncHighlightOpacityValue);
        elements.highlightColorInput?.addEventListener('input', controls.syncHighlightOpacityValue);
        elements.highlightOpacityInput?.addEventListener('input', controls.syncHighlightOpacityValue);
    }

    function bindSettingsModalMentionEvents(elements, controls) {
        elements.mentionSaveBtn?.addEventListener('click', () => {
            const result = updateMentionSettings(
                elements.mentionUserInput?.value,
                elements.mentionColorInput?.value,
                elements.mentionOpacityInput?.value,
                elements.mentionBlinkInput?.value,
                elements.mentionKeepHighlightToggle?.checked,
                elements.mentionIncludeReplyToggle?.checked,
                controls.getSelectedMentionSoundScope(),
                elements.mentionSoundStyleSelect?.value,
                elements.mentionSoundCustomUrlInput?.value,
                elements.mentionSoundCooldownInput?.value
            );

            controls.applyMentionSettingsToInputs();
            controls.setFeedback(result.message, !result.ok);
        });

        elements.mentionUserInput?.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            elements.mentionSaveBtn?.click();
        });
        elements.mentionUserInput?.addEventListener('input', controls.syncMentionOpacityPreview);
        elements.mentionColorInput?.addEventListener('input', controls.syncMentionOpacityPreview);
        elements.mentionOpacityInput?.addEventListener('input', controls.syncMentionOpacityPreview);
        elements.mentionBlinkInput?.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            elements.mentionSaveBtn?.click();
        });
        elements.mentionSoundCooldownInput?.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            elements.mentionSaveBtn?.click();
        });
        elements.mentionSoundCustomUrlInput?.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            elements.mentionSaveBtn?.click();
        });

        elements.mentionSoundScopeButtons.forEach((button) => {
            if (!(button instanceof HTMLButtonElement)) return;
            button.addEventListener('click', () => {
                const scope = normalizeMentionSoundScope(button.getAttribute('data-tm-mention-sound-scope'));
                elements.mentionSoundScopeGroup?.setAttribute('data-tm-sound-scope', scope);
                controls.syncMentionSoundControlsState();
            });
        });
        elements.mentionSoundStyleSelect?.addEventListener('change', controls.syncMentionSoundControlsState);
        elements.mentionSoundTestBtn?.addEventListener('click', async () => {
            if (!isMentionSoundScopeEnabled(controls.getSelectedMentionSoundScope())) return;

            const played = await playMentionNotificationSound(
                elements.mentionSoundStyleSelect?.value,
                elements.mentionSoundCustomUrlInput?.value
            );
            controls.setFeedback(
                played ? 'Son de notification testé.' : 'Impossible de jouer le son pour le moment.',
                !played
            );
        });
    }

    function bindSettingsModalAccessibilityEvents(elements, controls) {
        elements.fontSizeRange?.addEventListener('input', () => {
            controls.syncFontSizeValueLabel();
            applyChatFontScale(parseChatFontScalePercentInput(elements.fontSizeRange.value, chatFontScale));
        });
        elements.fontSizeDecreaseBtn?.addEventListener('click', () => {
            const nextScale = parseChatFontScalePercentInput(
                Number(elements.fontSizeRange?.value || formatChatFontScalePercent()) - 5,
                chatFontScale
            );
            controls.setPreviewFontScale(nextScale);
        });
        elements.fontSizeIncreaseBtn?.addEventListener('click', () => {
            const nextScale = parseChatFontScalePercentInput(
                Number(elements.fontSizeRange?.value || formatChatFontScalePercent()) + 5,
                chatFontScale
            );
            controls.setPreviewFontScale(nextScale);
        });
        elements.fontSizeSaveBtn?.addEventListener('click', () => {
            const nextScale = parseChatFontScalePercentInput(
                elements.fontSizeRange?.value || formatChatFontScalePercent(),
                chatFontScale
            );
            saveChatFontScale(nextScale);
            applyChatFontScale();
            controls.setPreviewFontScale(chatFontScale);
            controls.setFeedback(`Taille de police enregistrée : ${formatChatFontScalePercent()}%.`);
        });
        elements.fontSizeResetBtn?.addEventListener('click', () => {
            saveChatFontScale(DEFAULT_CHAT_FONT_SCALE);
            applyChatFontScale();
            controls.setPreviewFontScale(chatFontScale);
            controls.setFeedback('Taille de police réinitialisée.');
        });
    }

    function bindSettingsModalConfigEvents(elements, controls) {
        elements.phrasesConfigureBtn?.addEventListener('click', openSavedPhrasesConfigModal);
        elements.scriptConfigExportBtn?.addEventListener('click', () => {
            const result = downloadScriptConfigExport();
            controls.setFeedback(result.message, !result.ok);
        });
        elements.scriptConfigImportBtn?.addEventListener('click', () => {
            elements.scriptConfigImportFileInput?.click();
        });
        elements.scriptConfigImportFileInput?.addEventListener('change', async () => {
            const selectedFile = elements.scriptConfigImportFileInput instanceof HTMLInputElement
                ? elements.scriptConfigImportFileInput.files?.[0]
                : null;
            if (!selectedFile) return;

            try {
                const fileContent = await selectedFile.text();
                const parsedContent = JSON.parse(fileContent);
                const result = importScriptConfiguration(parsedContent);

                if (result.ok) {
                    closeSettingsModal();
                    showToast(result.message);
                } else {
                    controls.setFeedback(result.message, true);
                }
            } catch (e) {
                controls.setFeedback('Import impossible : fichier JSON invalide.', true);
            } finally {
                if (elements.scriptConfigImportFileInput instanceof HTMLInputElement) {
                    elements.scriptConfigImportFileInput.value = '';
                }
            }
        });
    }

    function bindSettingsModalImageHostingEvents(elements, controls) {
        elements.imageHostingEnabledToggle?.addEventListener('change', () => {
            saveImageHostingEnabled(elements.imageHostingEnabledToggle.checked);
            controls.syncImageHostingExpandedState();
            controls.refreshImageCatalogList();
            if (imageHostingEnabled) {
                injectImageUploadToolbar();
            } else {
                removeImageUploadToolbar();
            }
            controls.setFeedback(
                imageHostingEnabled
                    ? 'Hébergement d’images activé.'
                    : 'Hébergement d’images désactivé.'
            );
        });

        elements.imgbbApiKeySaveBtn?.addEventListener('click', () => {
            saveImgBbApiKey(elements.imgbbApiKeyInput?.value);
            controls.syncImageHostingExpandedState();
            controls.setFeedback(imgbbApiKey ? 'Clé API ImgBB enregistrée.' : 'Clé API ImgBB retirée.');
        });

        elements.imgbbApiKeyInput?.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            elements.imgbbApiKeySaveBtn?.click();
        });

        elements.imgbbApiKeyLinkBtn?.addEventListener('click', () => {
            window.open(IMGBB_API_KEY_URL, '_blank', 'noopener,noreferrer');
            controls.setFeedback('Page ImgBB ouverte pour récupérer une clé API.');
        });

        elements.imageHostingExpirationSelect?.addEventListener('change', () => {
            saveImageHostingExpirationSeconds(elements.imageHostingExpirationSelect.value);
            controls.syncImageHostingExpandedState();
            controls.setFeedback(`Durée de vie par défaut : ${formatImageHostingExpirationLabel()}.`);
        });

        elements.imageUploadPickBtn?.addEventListener('click', () => {
            elements.imageUploadFileInput?.click();
        });

        elements.imageUploadFileInput?.addEventListener('change', async () => {
            const files = elements.imageUploadFileInput instanceof HTMLInputElement
                ? elements.imageUploadFileInput.files
                : null;
            await uploadImageFilesFromSettings(files, elements, controls);
            if (elements.imageUploadFileInput instanceof HTMLInputElement) {
                elements.imageUploadFileInput.value = '';
            }
        });

        elements.imageUploadDropzone?.addEventListener('dragover', (event) => {
            event.preventDefault();
            if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
            if (elements.imageUploadDropzone instanceof HTMLElement) {
                elements.imageUploadDropzone.style.borderColor = 'rgba(125,211,252,0.88)';
                elements.imageUploadDropzone.style.background = 'rgba(14,165,233,0.16)';
            }
        });

        elements.imageUploadDropzone?.addEventListener('dragleave', () => {
            if (elements.imageUploadDropzone instanceof HTMLElement) {
                elements.imageUploadDropzone.style.borderColor = 'rgba(56,189,248,0.46)';
                elements.imageUploadDropzone.style.background = 'rgba(14,165,233,0.08)';
            }
        });

        elements.imageUploadDropzone?.addEventListener('drop', async (event) => {
            event.preventDefault();
            if (elements.imageUploadDropzone instanceof HTMLElement) {
                elements.imageUploadDropzone.style.borderColor = 'rgba(56,189,248,0.46)';
                elements.imageUploadDropzone.style.background = 'rgba(14,165,233,0.08)';
            }

            await uploadImageFilesFromSettings(extractImageFilesFromDataTransfer(event.dataTransfer), elements, controls);
        });

        elements.imageUploadDropzone?.addEventListener('paste', async (event) => {
            const files = extractImageFilesFromDataTransfer(event.clipboardData);
            if (files.length === 0) return;
            event.preventDefault();
            await uploadImageFilesFromSettings(files, elements, controls);
        });

        elements.imageDirectUrlAddBtn?.addEventListener('click', async () => {
            const url = elements.imageDirectUrlInput instanceof HTMLInputElement
                ? elements.imageDirectUrlInput.value
                : '';
            controls.setFeedback('Validation du lien image...');
            const result = await addManualImageCatalogUrl(url);
            controls.refreshImageCatalogList();
            controls.setFeedback(result.message, !result.ok);
            if (result.ok && elements.imageDirectUrlInput instanceof HTMLInputElement) {
                elements.imageDirectUrlInput.value = '';
            }
        });

        elements.imageDirectUrlInput?.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            elements.imageDirectUrlAddBtn?.click();
        });

        elements.imageCatalogPurgeBtn?.addEventListener('click', async () => {
            controls.setImageCatalogFeedback('Vérification des liens images...');
            const result = await purgeInvalidImageCatalogRecords(elements, controls);
            controls.setImageCatalogFeedback(result.message, !result.ok);
        });

        elements.imageCatalogClearBtn?.addEventListener('click', () => {
            const confirmed = window.confirm('Vider le catalogue local ? Les images hébergées ne seront pas supprimées.');
            if (!confirmed) return;
            saveImageCatalog([]);
            controls.refreshImageCatalogList();
            controls.setFeedback('Catalogue local vidé.');
        });
    }

    function openSettingsEmojiUsageHistory(elements, controls) {
        if (!(elements.emojiUsageHistoryPanel instanceof HTMLElement)) return;

        controls.refreshEmojiUsageList();
        controls.refreshReactionUsageList();
        elements.emojiUsageHistoryPanel.style.display = 'block';
    }

    function closeSettingsEmojiUsageHistory(elements) {
        if (!(elements.emojiUsageHistoryPanel instanceof HTMLElement)) return;

        elements.emojiUsageHistoryPanel.style.display = 'none';
    }

    function bindSettingsModalEmojiQuickAccessEvents(elements, controls) {
        const syncQuickAccessInput = (input, currentValue) => {
            if (!(input instanceof HTMLInputElement)) return currentValue;

            const nextValue = parseQuickAccessLimit(input.value, currentValue);
            input.value = String(nextValue);
            return nextValue;
        };

        elements.quickAccessModeSelect?.addEventListener('change', () => {
            saveQuickAccessMode(elements.quickAccessModeSelect?.value);
            controls.setFeedback(
                quickAccessMode === QUICK_ACCESS_MODE_MANUAL
                    ? 'Mode manuel activé pour les emojis rapides.'
                    : 'Mode automatique activé pour les emojis rapides.'
            );
        });

        elements.emojiQuickAccessLimitInput?.addEventListener('change', () => {
            const nextValue = syncQuickAccessInput(elements.emojiQuickAccessLimitInput, emojiQuickAccessLimit);
            saveEmojiQuickAccessLimit(nextValue);
            controls.setFeedback(`Nombre d’emojis favoris enregistré : ${emojiQuickAccessLimit}.`);
        });

        elements.reactionQuickAccessLimitInput?.addEventListener('change', () => {
            const nextValue = syncQuickAccessInput(elements.reactionQuickAccessLimitInput, reactionQuickAccessLimit);
            saveReactionQuickAccessLimit(nextValue);
            controls.setFeedback(`Nombre de réactions favorites enregistré : ${reactionQuickAccessLimit}.`);
        });

        elements.manualEmojiFavoritesClearBtn?.addEventListener('click', () => {
            saveManualEmojiFavorites([]);
            controls.refreshManualQuickAccessLists();
            controls.setFeedback('Favoris emojis manuels vidés.');
        });

        elements.manualReactionFavoritesClearBtn?.addEventListener('click', () => {
            saveManualReactionFavorites([]);
            controls.refreshManualQuickAccessLists();
            controls.setFeedback('Favoris réactions manuels vidés.');
        });

        elements.emojiUsageHistoryOpenBtn?.addEventListener('click', () => {
            openSettingsEmojiUsageHistory(elements, controls);
        });

        elements.emojiUsageHistoryCloseBtn?.addEventListener('click', () => {
            closeSettingsEmojiUsageHistory(elements);
        });

        elements.emojiUsageHistoryResetBtn?.addEventListener('click', () => {
            resetEmojiUsageCounts();
            resetReactionUsageCounts();
            controls.refreshEmojiUsageList();
            controls.refreshReactionUsageList();
            controls.setFeedback('Compteurs d’emojis et de réactions réinitialisés.');
        });
    }

    function bindSettingsModalFeatureToggleEvents(elements, controls, currentPageLabel) {
        elements.phrasesEnabledToggle?.addEventListener('change', () => {
            saveSavedPhrasesEnabled(elements.phrasesEnabledToggle.checked);
            controls.syncSavedPhrasesMainSummary();

            if (savedPhrasesEnabled) {
                injectSavedPhrasesToolbar();
                controls.setFeedback('Réponses rapides activées.');
                return;
            }

            removeSavedPhrasesToolbar();
            controls.setFeedback('Réponses rapides désactivées.');
        });

        elements.klipyGifsToggle?.addEventListener('change', () => {
            saveKlipyGifsEnabled(elements.klipyGifsToggle.checked);

            if (klipyGifsEnabled) {
                injectKlipyGifToolbar();
                controls.setFeedback('Bouton GIF Klipy activé.');
                return;
            }

            removeKlipyGifToolbar();
            controls.setFeedback('Bouton GIF Klipy désactivé.');
        });

        elements.linkifyUrlsToggle?.addEventListener('change', () => {
            saveLinkifyUrlsEnabled(elements.linkifyUrlsToggle.checked);
            processAllMessages();
            controls.setFeedback(
                linkifyUrlsEnabled ? 'URLs cliquables activées.' : 'URLs cliquables désactivées.'
            );
        });

        elements.chatScrollbarToggle?.addEventListener('change', () => {
            saveChatScrollbarEnabled(elements.chatScrollbarToggle.checked);
            applyChatPageScrollbarState();
            controls.setFeedback(chatScrollbarEnabled ? 'Ascenseur du chat activé.' : 'Ascenseur du chat désactivé.');
        });

        elements.messageActionsLeftToggle?.addEventListener('change', () => {
            saveMessageActionsLeftEnabled(elements.messageActionsLeftToggle.checked);
            applyMessageActionsPositionState();
            processAllMessages();
            controls.setFeedback(
                messageActionsLeftEnabled
                    ? 'Actions natives des messages déplacées à gauche.'
                    : 'Actions natives des messages replacées à droite.'
            );
        });

        elements.chatInputToolbarInlineToggle?.addEventListener('change', () => {
            saveChatInputToolbarInline(elements.chatInputToolbarInlineToggle.checked);
            applyChatInputToolbarAlignmentState();
            controls.setFeedback(
                chatInputToolbarInline
                    ? 'Barre d’outils du chat déplacée sur la même ligne que l’input.'
                    : 'Barre d’outils du chat replacée au-dessus de l’input.'
            );
        });

        elements.chatInputToolbarAlignRightToggle?.addEventListener('change', () => {
            saveChatInputToolbarAlignRight(elements.chatInputToolbarAlignRightToggle.checked);
            applyChatInputToolbarAlignmentState();
            controls.setFeedback(
                chatInputToolbarAlignRight
                    ? (chatInputToolbarInline
                        ? 'Barre d’outils du chat alignée à droite de l’input.'
                        : 'Barre d’outils du chat alignée à droite au-dessus de l’input.')
                    : (chatInputToolbarInline
                        ? 'Barre d’outils du chat alignée à gauche de l’input.'
                        : 'Barre d’outils du chat alignée à gauche au-dessus de l’input.')
            );
        });

        elements.embedUrlImagesToggle?.addEventListener('change', () => {
            saveEmbedUrlImagesEnabled(elements.embedUrlImagesToggle.checked);
            processAllMessages();
            controls.setFeedback(
                embedUrlImagesEnabled
                    ? 'Prévisualisation des images au survol activée.'
                    : 'Prévisualisation des images au survol désactivée.'
            );
        });

        elements.hideStatsToggle?.addEventListener('change', () => {
            saveStatsHidden(elements.hideStatsToggle.checked);
            applyStatsBoxVisibilityState();
            controls.setFeedback(
                statsHidden
                    ? `Stats box masquée pour ${currentPageLabel}.`
                    : `Stats box affichée pour ${currentPageLabel}.`
            );
        });

        elements.resetStatsLayoutBtn?.addEventListener('click', () => {
            resetPosition();
            resetStatsBoxSize();
            applyStatsBoxDisplayModeState();
            applyBoxPosition(loadPosition());
            constrainStatsBoxToViewport(false, false);
            updateStatsBox();
            controls.setFeedback(`Taille et position de la stats box réinitialisées pour ${currentPageLabel}.`);
        });

        elements.debugToggle?.addEventListener('change', () => {
            saveDebugMode(elements.debugToggle.checked);
            processAllMessages();
            updateStatsBox();
            controls.setFeedback(debugMode ? 'Mode debug activé.' : 'Mode debug désactivé.');
        });

        elements.homeCollapseToggle?.addEventListener('change', () => {
            toggleHomepageChatCollapsed(elements.homeCollapseToggle.checked);
            controls.setFeedback(homeChatCollapsed ? 'Shoutbox d’accueil repliée.' : 'Shoutbox d’accueil réaffichée.');
        });
    }

    function bindSettingsModalEvents(modal, overlay, elements, controls, currentPageLabel) {
        elements.closeBtn?.addEventListener('click', closeSettingsModal);
        overlay.addEventListener('click', closeSettingsModal);

        bindSettingsModalBlacklistEvents(elements, controls);
        bindSettingsModalMentionEvents(elements, controls);
        bindSettingsModalAccessibilityEvents(elements, controls);
        bindSettingsModalConfigEvents(elements, controls);
        bindSettingsModalImageHostingEvents(elements, controls);
        bindSettingsModalEmojiQuickAccessEvents(elements, controls);
        bindSettingsModalFeatureToggleEvents(elements, controls, currentPageLabel);

        modal.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            if (elements.emojiUsageHistoryPanel instanceof HTMLElement && elements.emojiUsageHistoryPanel.style.display !== 'none') {
                closeSettingsEmojiUsageHistory(elements);
                return;
            }
            closeSettingsModal();
        });
    }

    function createSettingsCheckboxInputStyle(accentColor) {
        return `
            width:16px;
            height:16px;
            accent-color:${accentColor};
            cursor:pointer;
            flex-shrink:0;
        `;
    }

    function getSettingsModalStyles(settingsColumnCount) {
        const settingsCheckboxLabelStyle = `
            display:flex;
            align-items:center;
            gap:10px;
            cursor:pointer;
            font-size:12px;
            color:#d4d4d8;
        `;

        return {
            settingsColumnCount,
            settingsCardStyle: `
                display:inline-block;
                width:100%;
                padding:12px;
                margin:0 0 14px 0;
                border-radius:14px;
                background:rgba(255,255,255,0.03);
                border:1px solid rgba(255,255,255,0.06);
                box-sizing:border-box;
                break-inside:avoid;
                vertical-align:top;
            `,
            settingsFullWidthCardStyle: `
                width:100%;
                padding:12px;
                margin:0 0 14px 0;
                border-radius:14px;
                background:rgba(255,255,255,0.03);
                border:1px solid rgba(255,255,255,0.06);
                box-sizing:border-box;
            `,
            settingsCheckboxLabelStyle,
            settingsCheckboxLabelWithMarginStyle: `
                ${settingsCheckboxLabelStyle}
                margin-top:12px;
            `,
            accessibilityCheckboxAccentColor: '#06b6d4'
        };
    }

    function renderSettingsModalHeader(currentPageLabel) {
        return `
            <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px;">
                <div>
                    <div style="font-size:16px;font-weight:700;">Paramètres chat</div>
                    <div style="font-size:12px;color:#a1a1aa;margin-top:4px;">Vue actuelle : ${currentPageLabel}</div>
                </div>
                <button id="tm-close-modal" style="
                    border:none;
                    background:#27272a;
                    color:#fff;
                    width:34px;
                    height:34px;
                    border-radius:10px;
                    cursor:pointer;
                    font-size:18px;
                    line-height:1;
                ">×</button>
            </div>
        `;
    }

    function renderSettingsTipsCard(isChatView, settingsFullWidthCardStyle) {
        return `
            <div style="${settingsFullWidthCardStyle}">
                <div style="font-size:13px;font-weight:700;margin-bottom:10px;">Astuces</div>

                <div style="display:grid;gap:10px;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));">
                    <div style="padding:10px 12px;border-radius:12px;background:rgba(37,99,235,0.12);border:1px solid rgba(37,99,235,0.24);">
                        <div style="font-size:12px;font-weight:700;color:#dbeafe;">Ctrl+Alt+C ou Ctrl+Cmd+C</div>
                        <div style="margin-top:4px;font-size:11px;color:#93c5fd;line-height:1.45;">
                            Ouvre directement cette page de paramètres.
                        </div>
                    </div>

                    <div style="padding:10px 12px;border-radius:12px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.24);">
                        <div style="font-size:12px;font-weight:700;color:#bbf7d0;">${formatAfkShortcutLabel()}</div>
                        <div style="margin-top:4px;font-size:11px;color:#86efac;line-height:1.45;">
                            Active ou coupe le mode AFK sur le chat en cours, avec historique dédié des mentions et réponses.
                        </div>
                    </div>

                    <div style="padding:10px 12px;border-radius:12px;background:rgba(124,58,237,0.14);border:1px solid rgba(139,92,246,0.26);">
                        <div style="font-size:12px;font-weight:700;color:#ddd6fe;">Ctrl+Alt+R ou Ctrl+Cmd+R</div>
                        <div style="margin-top:4px;font-size:11px;color:#c4b5fd;line-height:1.45;">
                            Ouvre directement les réponses rapides. Utilise ensuite les flèches, Home, End et Entrée pour naviguer sans souris.
                        </div>
                    </div>

                    <div style="padding:10px 12px;border-radius:12px;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.24);">
                        <div style="font-size:12px;font-weight:700;color:#fde68a;">Alt+clic sur un pseudo</div>
                        <div style="margin-top:4px;font-size:11px;color:#fcd34d;line-height:1.45;">
                            Ajoute ou retire rapidement un utilisateur de la blacklist.
                        </div>
                    </div>

                    <div style="padding:10px 12px;border-radius:12px;background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.24);">
                        <div style="font-size:12px;font-weight:700;color:#fde68a;">Maj+clic dans un picker</div>
                        <div style="margin-top:4px;font-size:11px;color:#fcd34d;line-height:1.45;">
                            En mode manuel, ajoute ou retire un emoji ou une réaction des favoris. Dans les paramètres, clique sur un favori pour le retirer ou maintiens le clic puis glisse pour changer son ordre.
                        </div>
                    </div>

                    <div style="padding:10px 12px;border-radius:12px;background:rgba(14,165,233,0.12);border:1px solid rgba(56,189,248,0.24);">
                        <div style="font-size:12px;font-weight:700;color:#bae6fd;">Upload image</div>
                        <div style="margin-top:4px;font-size:11px;color:#7dd3fc;line-height:1.45;">
                            Active l’hébergement d’images pour afficher Up-Img. Tu peux coller une image dans l’input, la glisser dans la pop-up ou choisir un fichier. La clé ImgBB sert à uploader, et le catalogue accepte aussi les liens directs. Les liens expirés ou invalides sont purgés.
                        </div>
                    </div>

                    <div style="padding:10px 12px;border-radius:12px;background:rgba(124,58,237,0.14);border:1px solid rgba(139,92,246,0.26);">
                        <div style="font-size:12px;font-weight:700;color:#ddd6fe;">Exporter la config avant nettoyage navigateur</div>
                        <div style="margin-top:4px;font-size:11px;color:#c4b5fd;line-height:1.45;">
                            Pense à exporter la configuration du script avant de supprimer les données du navigateur, changer de profil ou réinstaller Tampermonkey.
                        </div>
                    </div>

                    ${isChatView ? `
                    <div style="padding:10px 12px;border-radius:12px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.24);">
                        <div style="font-size:12px;font-weight:700;color:#bbf7d0;">Double-clic sur un message</div>
                        <div style="margin-top:4px;font-size:11px;color:#86efac;line-height:1.45;">
                            Lance la réponse au message sans passer par le bouton d’action.
                        </div>
                    </div>

                    <div style="padding:10px 12px;border-radius:12px;background:rgba(6,182,212,0.12);border:1px solid rgba(6,182,212,0.24);">
                        <div style="font-size:12px;font-weight:700;color:#a5f3fc;">Clic long sur un message</div>
                        <div style="margin-top:4px;font-size:11px;color:#67e8f9;line-height:1.45;">
                            Ouvre les réactions, avec le picker repositionné à droite du pointeur.
                        </div>
                    </div>
                    ` : `
                    <div style="padding:10px 12px;border-radius:12px;background:rgba(63,63,70,0.6);border:1px solid rgba(255,255,255,0.08);">
                        <div style="font-size:12px;font-weight:700;color:#f4f4f5;">Raccourcis du chat dédié</div>
                        <div style="margin-top:4px;font-size:11px;color:#a1a1aa;line-height:1.45;">
                            Les gestes double-clic pour répondre et clic long pour réagir ne sont actifs que sur la page chat, pas sur la shout de l’accueil.
                        </div>
                    </div>
                    `}
                </div>
            </div>
        `;
    }

    function renderSettingsHomeCard(homeView, settingsCardStyle, settingsCheckboxLabelStyle) {
        if (!homeView) return '';

        return `
            <div style="${settingsCardStyle}">
                <div style="font-size:13px;font-weight:700;margin-bottom:10px;">Page d’accueil</div>

                <label style="${settingsCheckboxLabelStyle}">
                    <input id="tm-home-collapse-toggle-setting" type="checkbox" ${homeChatCollapsed ? 'checked' : ''} style="${createSettingsCheckboxInputStyle('#22c55e')}">
                    <span>Masquer la shoutbox</span>
                </label>

                <div style="margin-top:8px;font-size:11px;color:#71717a;line-height:1.45;">
                    Permet de masquer la shoutbox sur la page d’accueil.
                </div>
            </div>
        `;
    }

    function renderSettingsStatsCard(currentPageLabel, settingsCardStyle, settingsCheckboxLabelWithMarginStyle) {
        return `
            <div style="${settingsCardStyle}">
                <div style="font-size:13px;font-weight:700;margin-bottom:10px;">Stats box (${currentPageLabel})</div>

                <div style="font-size:11px;color:#71717a;line-height:1.5;">
                    Glisse l’en-tête de la stats box pour la déplacer, puis attrape son coin inférieur droit pour la redimensionner. La position et la taille sont mémorisées séparément pour ${currentPageLabel}.
                </div>

                <label style="${settingsCheckboxLabelWithMarginStyle}">
                    <input id="tm-hide-stats-toggle" type="checkbox" ${statsHidden ? 'checked' : ''} style="${createSettingsCheckboxInputStyle('#f59e0b')}">
                    <span>Masquer complètement la stats box</span>
                </label>

                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
                    <button id="tm-reset-stats-layout" style="
                        border:none;
                        background:#3f3f46;
                        color:#fff;
                        border-radius:10px;
                        padding:10px 12px;
                        cursor:pointer;
                        font-weight:600;
                    ">Réinitialiser taille et position</button>
                </div>
            </div>
        `;
    }

    function renderSettingsAccessibilityCard(currentPageLabel, isChatView, styles) {
        return `
            <div style="${styles.settingsCardStyle}">
                <div style="font-size:13px;font-weight:700;margin-bottom:10px;">Accessibilité</div>

                <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                    <div style="font-size:12px;color:#c4c4c8;">
                        Taille de police shoutbox
                    </div>
                    <div id="tm-font-size-value" style="
                        min-width:52px;
                        text-align:right;
                        font-size:12px;
                        color:#f4f4f5;
                        font-weight:700;
                    ">${formatChatFontScalePercent()}%</div>
                </div>

                <input id="tm-font-size-range" type="range" min="${MIN_CHAT_FONT_SCALE * 100}" max="${MAX_CHAT_FONT_SCALE * 100}" step="5" value="${formatChatFontScalePercent()}"
                    style="
                        width:100%;
                        margin-top:12px;
                        accent-color:#38bdf8;
                        cursor:pointer;
                    ">

                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
                    <button id="tm-font-size-decrease" style="
                        border:none;
                        background:#3f3f46;
                        color:#fff;
                        border-radius:10px;
                        padding:10px 12px;
                        cursor:pointer;
                        font-weight:600;
                    ">A-</button>

                    <button id="tm-font-size-increase" style="
                        border:none;
                        background:#0f766e;
                        color:#fff;
                        border-radius:10px;
                        padding:10px 12px;
                        cursor:pointer;
                        font-weight:600;
                    ">A+</button>

                    <button id="tm-font-size-save" style="
                        border:none;
                        background:#2563eb;
                        color:#fff;
                        border-radius:10px;
                        padding:10px 12px;
                        cursor:pointer;
                        font-weight:600;
                    ">Enregistrer</button>

                    <button id="tm-font-size-reset" style="
                        border:none;
                        background:#3f3f46;
                        color:#fff;
                        border-radius:10px;
                        padding:10px 12px;
                        cursor:pointer;
                        font-weight:600;
                    ">Réinitialiser la police</button>
                </div>

                <div style="margin-top:8px;font-size:11px;color:#71717a;line-height:1.45;">
                    Agrandit ou réduit les pseudos et les messages dans la shoutbox.
                </div>

                <label style="${styles.settingsCheckboxLabelWithMarginStyle}">
                    <input id="tm-linkify-urls-toggle" type="checkbox" ${linkifyUrlsEnabled ? 'checked' : ''} style="${createSettingsCheckboxInputStyle(styles.accessibilityCheckboxAccentColor)}">
                    <span>Rendre les URLs cliquables</span>
                </label>

                <div style="margin-top:8px;font-size:11px;color:#71717a;line-height:1.45;">
                    Détecte les liens dans les messages et les transforme en liens cliquables.
                </div>

                ${isChatView ? `
                <label style="${styles.settingsCheckboxLabelWithMarginStyle}">
                    <input id="tm-chat-scrollbar-toggle" type="checkbox" ${chatScrollbarEnabled ? 'checked' : ''} style="${createSettingsCheckboxInputStyle(styles.accessibilityCheckboxAccentColor)}">
                    <span>Afficher l’ascenseur du chat</span>
                </label>

                <div style="margin-top:8px;font-size:11px;color:#71717a;line-height:1.45;">
                    Ajoute une scrollbar visible uniquement sur la zone de messages de la page chat.
                </div>
                ` : ''}

                <label style="${styles.settingsCheckboxLabelWithMarginStyle}">
                    <input id="tm-message-actions-left-toggle" type="checkbox" ${messageActionsLeftEnabled ? 'checked' : ''} style="${createSettingsCheckboxInputStyle(styles.accessibilityCheckboxAccentColor)}">
                    <span>Actions des messages à gauche</span>
                </label>

                <div style="margin-top:8px;font-size:11px;color:#71717a;line-height:1.45;">
                    Déplace les boutons Réagir / Répondre qui apparaissent au survol vers la gauche du bloc message. Utile seulement sur la page chat.
                </div>

                <label style="${styles.settingsCheckboxLabelWithMarginStyle}">
                    <input id="tm-chat-input-toolbar-inline-toggle" type="checkbox" ${chatInputToolbarInline ? 'checked' : ''} style="${createSettingsCheckboxInputStyle(styles.accessibilityCheckboxAccentColor)}">
                    <span>Boutons du chat sur la même ligne que l’input</span>
                </label>

                <div style="margin-top:8px;font-size:11px;color:#71717a;line-height:1.45;">
                    Désactivé par défaut : la barre d’outils reste au-dessus du champ. Active cette option pour placer les boutons à côté de l’input.
                </div>

                <label style="${styles.settingsCheckboxLabelWithMarginStyle}">
                    <input id="tm-chat-input-toolbar-align-right-toggle" type="checkbox" ${chatInputToolbarAlignRight ? 'checked' : ''} style="${createSettingsCheckboxInputStyle(styles.accessibilityCheckboxAccentColor)}">
                    <span>Aligner les boutons du chat à droite</span>
                </label>

                <div style="margin-top:8px;font-size:11px;color:#71717a;line-height:1.45;">
                    Décoché : boutons à gauche. Coché : boutons à droite, que la barre soit au-dessus du champ ou sur la même ligne.
                </div>

                <label style="${styles.settingsCheckboxLabelWithMarginStyle}">
                    <input id="tm-embed-url-images-toggle" type="checkbox" ${embedUrlImagesEnabled ? 'checked' : ''} style="${createSettingsCheckboxInputStyle(styles.accessibilityCheckboxAccentColor)}">
                    <span>Prévisualiser les liens directs d'images au survol</span>
                </label>

                <div style="margin-top:8px;font-size:11px;color:#71717a;line-height:1.45;">
                    Affiche un aperçu flottant uniquement pour les URLs qui pointent directement vers un fichier image.
                </div>

            </div>
        `;
    }

    function renderSettingsSavedPhrasesCard(settingsCardStyle, settingsCheckboxLabelStyle) {
        return `
            <div style="${settingsCardStyle}">
                <div style="font-size:13px;font-weight:700;margin-bottom:10px;">Phrases sauvegardées</div>

                <label style="${settingsCheckboxLabelStyle}">
                    <input id="tm-phrases-enabled-toggle" type="checkbox" ${savedPhrasesEnabled ? 'checked' : ''} style="${createSettingsCheckboxInputStyle('#8b5cf6')}">
                    <span>Activer les réponses rapides</span>
                </label>

                <div id="tm-phrases-summary" style="margin-top:10px;font-size:12px;color:#a1a1aa;line-height:1.5;">
                    ${formatSavedPhrasesSummaryLabel()}
                </div>

                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
                    <button id="tm-phrases-configure" style="
                        border:none;
                        background:#7c3aed;
                        color:#fff;
                        border-radius:10px;
                        padding:10px 12px;
                        cursor:pointer;
                        font-weight:600;
                    ">Configurer</button>
                </div>

                <div style="margin-top:8px;font-size:11px;color:#71717a;line-height:1.4;">
                    Ouvre une fenêtre dédiée pour ajouter, retirer et gérer les réponses rapides.
                </div>
            </div>
        `;
    }

    function renderSettingsConfigCard(settingsCardStyle) {
        return `
            <div style="${settingsCardStyle}">
                <div style="font-size:13px;font-weight:700;margin-bottom:10px;">Sauvegarde configuration</div>

                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button id="tm-script-config-export" style="
                        border:none;
                        background:#2563eb;
                        color:#fff;
                        border-radius:10px;
                        padding:10px 12px;
                        cursor:pointer;
                        font-weight:600;
                    ">Exporter la config</button>

                    <button id="tm-script-config-import" style="
                        border:none;
                        background:#3f3f46;
                        color:#fff;
                        border-radius:10px;
                        padding:10px 12px;
                        cursor:pointer;
                        font-weight:600;
                    ">Importer une config</button>
                </div>

                <input id="tm-script-config-import-file" type="file" accept="application/json,.json" style="display:none;">

                <div style="margin-top:8px;font-size:11px;color:#71717a;line-height:1.45;">
                    Sauvegarde tes réglages principaux, ta blacklist, tes mises en avant, tes réponses rapides ainsi que les positions et tailles mémorisées. L’historique AFK temporaire n’est pas repris.
                </div>
            </div>
        `;
    }

    function renderSettingsGifCard(settingsCardStyle, settingsCheckboxLabelStyle) {
        return `
            <div style="${settingsCardStyle}">
                <div style="font-size:13px;font-weight:700;margin-bottom:10px;">GIF Klipy</div>

                <label style="${settingsCheckboxLabelStyle}">
                    <input id="tm-klipy-gifs-toggle" type="checkbox" ${klipyGifsEnabled ? 'checked' : ''} style="${createSettingsCheckboxInputStyle('#22c55e')}">
                    <span>Activer le bouton GIF Klipy</span>
                </label>

                <div style="margin-top:10px;font-size:12px;color:#a1a1aa;line-height:1.5;">
                    Permet d’utiliser un picker GIF directement depuis le chat.
                </div>
            </div>
        `;
    }

    function renderImageHostingExpirationOptions() {
        return [
            [0, 'Permanent'],
            [600, '10 min'],
            [3600, '1 h'],
            [86400, '1 jour'],
            [604800, '7 jours'],
            [2592000, '30 jours'],
            [15552000, '180 jours']
        ].map(([value, label]) => `
            <option value="${value}" ${imageHostingExpirationSeconds === value ? 'selected' : ''}>${label}</option>
        `).join('');
    }

    function renderSettingsImageHostingCard(settingsCardStyle, settingsCheckboxLabelStyle) {
        const catalogCount = imageCatalog.length;

        return `
            <div style="${settingsCardStyle}">
                <div style="font-size:13px;font-weight:700;margin-bottom:10px;">Hébergement d’images</div>

                <label style="${settingsCheckboxLabelStyle}">
                    <input id="tm-image-hosting-enabled-toggle" type="checkbox" ${imageHostingEnabled ? 'checked' : ''} style="${createSettingsCheckboxInputStyle('#0ea5e9')}">
                    <span>Activer l’upload ImgBB et le catalogue</span>
                </label>

                <div style="margin-top:10px;font-size:12px;color:#a1a1aa;line-height:1.5;">
                    ${catalogCount} image${catalogCount > 1 ? 's' : ''} dans le catalogue. Les liens expirés sont retirés automatiquement.
                </div>

                <div id="tm-image-hosting-expanded" style="display:${imageHostingEnabled ? 'block' : 'none'};margin-top:12px;">
                    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                        <input id="tm-imgbb-api-key-input" type="password" placeholder="Clé API ImgBB" value="${escapeHtml(imgbbApiKey)}"
                            autocomplete="off"
                            style="
                                flex:1 1 190px;
                                min-width:0;
                                background:#18181b;
                                color:#fff;
                                border:1px solid rgba(255,255,255,0.10);
                                border-radius:10px;
                                padding:10px 12px;
                                outline:none;
                            ">

                        <button id="tm-imgbb-api-key-save" type="button" style="
                            border:none;
                            background:#2563eb;
                            color:#fff;
                            border-radius:10px;
                            padding:10px 12px;
                            cursor:pointer;
                            font-weight:600;
                        ">Enregistrer</button>

                        <button
                            id="tm-imgbb-api-key-link"
                            type="button"
                            title="Créez-vous un compte sur ImgBB, connectez-vous, puis cliquez sur ce bouton pour aller récupérer votre clé API."
                            aria-label="Créez-vous un compte sur ImgBB, connectez-vous, puis cliquez sur ce bouton pour aller récupérer votre clé API."
                            style="
                            border:none;
                            background:#3f3f46;
                            color:#fff;
                            border-radius:10px;
                            padding:10px 12px;
                            cursor:pointer;
                            font-weight:600;
                        ">Get my API key</button>
                    </div>

                    <label style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:12px;font-size:12px;color:#d4d4d8;">
                        <span>Durée de vie par défaut</span>
                        <select id="tm-image-hosting-expiration-select" style="
                            min-width:130px;
                            background:#18181b;
                            color:#fff;
                            border:1px solid rgba(255,255,255,0.10);
                            border-radius:10px;
                            padding:8px 10px;
                            outline:none;
                            font-weight:600;
                        ">
                            ${renderImageHostingExpirationOptions()}
                        </select>
                    </label>

                    <div style="margin-top:8px;font-size:11px;color:#71717a;line-height:1.45;">
                        ImgBB supprimera automatiquement les uploads temporaires. Le catalogue purge aussi les entrées quand la durée arrive à échéance ou quand le lien ne charge plus.
                    </div>

                    <div id="tm-image-upload-dropzone" tabindex="0" style="
                        margin-top:12px;
                        padding:14px;
                        border-radius:14px;
                        border:1px dashed rgba(56,189,248,0.46);
                        background:rgba(14,165,233,0.08);
                        color:#e0f2fe;
                        outline:none;
                    ">
                        <div style="font-size:12px;font-weight:700;">Coller ou glisser une image ici</div>
                        <div style="margin-top:5px;font-size:11px;color:#93c5fd;line-height:1.45;">
                            Presse-papier, drag & drop ou sélection fichier. Taille max ImgBB : ${formatFileSize(IMAGE_UPLOAD_MAX_BYTES)}.
                        </div>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
                            <button id="tm-image-upload-pick" type="button" style="
                                border:none;
                                background:#0284c7;
                                color:#fff;
                                border-radius:10px;
                                padding:9px 11px;
                                cursor:pointer;
                                font-weight:600;
                                font-size:12px;
                            ">Choisir image</button>
                            <input id="tm-image-upload-file-input" type="file" accept="image/*" multiple style="display:none;">
                        </div>
                    </div>

                    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:12px;">
                        <input id="tm-image-direct-url-input" type="url" placeholder="https://.../image"
                            style="
                                flex:1 1 220px;
                                min-width:0;
                                background:#18181b;
                                color:#fff;
                                border:1px solid rgba(255,255,255,0.10);
                                border-radius:10px;
                                padding:10px 12px;
                                outline:none;
                            ">
                        <button id="tm-image-direct-url-add" type="button" style="
                            border:none;
                            background:#0f766e;
                            color:#fff;
                            border-radius:10px;
                            padding:10px 12px;
                            cursor:pointer;
                            font-weight:600;
                        ">Ajouter lien</button>
                    </div>

                    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-top:14px;">
                        <div style="font-size:12px;font-weight:700;color:#d4d4d8;">Catalogue</div>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;">
                            <button id="tm-image-catalog-purge" type="button" style="
                                border:none;
                                background:#3f3f46;
                                color:#fff;
                                border-radius:999px;
                                padding:7px 10px;
                                cursor:pointer;
                                font-weight:600;
                                font-size:11px;
                            ">Vérifier / purger</button>
                            <button id="tm-image-catalog-clear" type="button" style="
                                border:none;
                                background:#3f3f46;
                                color:#fca5a5;
                                border-radius:999px;
                                padding:7px 10px;
                                cursor:pointer;
                                font-weight:600;
                                font-size:11px;
                            ">Vider local</button>
                        </div>
                    </div>

                    <div id="tm-image-catalog-list" style="display:grid;gap:8px;margin-top:10px;"></div>
                    <div id="tm-image-catalog-status" aria-live="polite" style="min-height:18px;margin-top:8px;font-size:11px;line-height:1.4;color:#71717a;"></div>
                </div>
            </div>
        `;
    }

    function renderSettingsEmojiQuickAccessCard(settingsCardStyle) {
        return `
            <div style="${settingsCardStyle}">
                <div style="font-size:13px;font-weight:700;margin-bottom:10px;">Emojis rapides</div>

                <div style="font-size:12px;color:#a1a1aa;line-height:1.5;">
                    Affiche des favoris automatiques selon l’usage, ou une liste choisie manuellement.
                </div>

                <label style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:12px;font-size:12px;color:#d4d4d8;">
                    <span>Mode des favoris</span>
                    <select id="tm-quick-access-mode" style="
                        min-width:130px;
                        background:#18181b;
                        color:#fff;
                        border:1px solid rgba(255,255,255,0.10);
                        border-radius:10px;
                        padding:8px 10px;
                        outline:none;
                        font-weight:600;
                    ">
                        <option value="${QUICK_ACCESS_MODE_AUTO}" ${quickAccessMode === QUICK_ACCESS_MODE_AUTO ? 'selected' : ''}>Automatique</option>
                        <option value="${QUICK_ACCESS_MODE_MANUAL}" ${quickAccessMode === QUICK_ACCESS_MODE_MANUAL ? 'selected' : ''}>Manuel</option>
                    </select>
                </label>

                <div style="display:grid;gap:10px;margin-top:12px;">
                    <label style="display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:12px;color:#d4d4d8;">
                        <span>Nombre d’emojis favoris</span>
                        <input id="tm-emoji-quick-access-limit" type="number" min="0" max="9" step="1" value="${emojiQuickAccessLimit}" style="
                            width:62px;
                            background:#18181b;
                            color:#fff;
                            border:1px solid rgba(255,255,255,0.10);
                            border-radius:10px;
                            padding:8px 10px;
                            outline:none;
                            text-align:center;
                            font-weight:600;
                        ">
                    </label>

                    <label style="display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:12px;color:#d4d4d8;">
                        <span>Nombre de réactions favorites</span>
                        <input id="tm-reaction-quick-access-limit" type="number" min="0" max="9" step="1" value="${reactionQuickAccessLimit}" style="
                            width:62px;
                            background:#18181b;
                            color:#fff;
                            border:1px solid rgba(255,255,255,0.10);
                            border-radius:10px;
                            padding:8px 10px;
                            outline:none;
                            text-align:center;
                            font-weight:600;
                        ">
                    </label>
                </div>

                <div style="display:grid;gap:8px;margin-top:12px;">
                    <div style="font-size:11px;color:#a1a1aa;line-height:1.45;">
                        En mode manuel, Maj+clic dans le picker natif ajoute ou retire un favori. Alt+clic marche aussi si ton système ne l’intercepte pas.
                        Maintiens puis glisse un favori ci-dessous pour changer son ordre.
                    </div>

                    <div style="display:grid;gap:6px;">
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
                            <div style="font-size:12px;color:#d4d4d8;font-weight:600;">Emojis choisis</div>
                            <button id="tm-manual-emoji-favorites-clear" type="button" style="
                                border:none;
                                background:#27272a;
                                color:#d4d4d8;
                                border-radius:8px;
                                padding:6px 8px;
                                cursor:pointer;
                                font-size:11px;
                                font-weight:700;
                            ">Vider</button>
                        </div>
                        <div id="tm-manual-emoji-favorites-list" style="display:flex;flex-wrap:wrap;gap:6px;min-height:34px;"></div>
                    </div>

                    <div style="display:grid;gap:6px;">
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
                            <div style="font-size:12px;color:#d4d4d8;font-weight:600;">Réactions choisies</div>
                            <button id="tm-manual-reaction-favorites-clear" type="button" style="
                                border:none;
                                background:#27272a;
                                color:#d4d4d8;
                                border-radius:8px;
                                padding:6px 8px;
                                cursor:pointer;
                                font-size:11px;
                                font-weight:700;
                            ">Vider</button>
                        </div>
                        <div id="tm-manual-reaction-favorites-list" style="display:flex;flex-wrap:wrap;gap:5px;min-height:28px;"></div>
                    </div>
                </div>

                <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:12px;">
                    <div style="font-size:11px;color:#71717a;line-height:1.45;">
                        Valeur de 0 à 9. En mode manuel, seules les premières entrées affichables sont utilisées.
                    </div>

                    <button id="tm-emoji-usage-history-open" type="button" style="
                        border:none;
                        background:#27272a;
                        color:#fff;
                        border-radius:10px;
                        padding:8px 10px;
                        cursor:pointer;
                        font-size:12px;
                        font-weight:600;
                        white-space:nowrap;
                    ">Historique</button>
                </div>

            </div>
        `;
    }

    function renderSettingsEmojiUsageHistoryPanel() {
        return `
            <div id="tm-emoji-usage-history-panel" style="
                display:none;
                position:fixed;
                top:50%;
                left:50%;
                transform:translate(-50%, -50%);
                z-index:1000002;
                width:min(720px, calc(100vw - 36px));
                max-height:min(78vh, 760px);
                background:rgba(24,24,27,0.99);
                border:1px solid rgba(255,255,255,0.08);
                border-radius:18px;
                box-shadow:0 24px 60px rgba(0,0,0,0.5);
                overflow:hidden;
            ">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.06);">
                    <div>
                        <div style="font-size:14px;font-weight:700;">Historique d’utilisation</div>
                        <div style="margin-top:4px;font-size:11px;color:#a1a1aa;">Tous les compteurs d’emojis et de réactions, sans limite d’affichage.</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;flex:0 0 auto;">
                        <button id="tm-emoji-usage-history-reset" type="button" style="
                            border:none;
                            background:#7f1d1d;
                            color:#fff;
                            border-radius:10px;
                            padding:8px 10px;
                            cursor:pointer;
                            font-size:12px;
                            font-weight:600;
                            line-height:1.2;
                            white-space:nowrap;
                        ">Reset compteurs</button>
                        <button id="tm-emoji-usage-history-close" type="button" style="
                            border:none;
                            background:#27272a;
                            color:#fff;
                            width:32px;
                            height:32px;
                            border-radius:10px;
                            cursor:pointer;
                            font-size:18px;
                            line-height:1;
                            flex:0 0 auto;
                        ">×</button>
                    </div>
                </div>

                <div style="padding:16px;overflow:auto;max-height:calc(min(78vh, 760px) - 66px);">
                    <div style="display:grid;gap:16px;">
                        <div style="padding:12px;border-radius:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);">
                            <div style="font-size:12px;font-weight:700;color:#d4d4d8;margin-bottom:10px;">Emojis du chat</div>
                            <div id="tm-emoji-usage-history-emoji-list" style="
                                display:grid;
                                grid-template-columns:repeat(10, minmax(0, 1fr));
                                gap:6px;
                                align-items:start;
                            "></div>
                        </div>

                        <div style="padding:12px;border-radius:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);">
                            <div style="font-size:12px;font-weight:700;color:#d4d4d8;margin-bottom:10px;">Réactions des messages</div>
                            <div id="tm-emoji-usage-history-reaction-list" style="
                                display:grid;
                                grid-template-columns:repeat(10, minmax(0, 1fr));
                                gap:6px;
                                align-items:start;
                            "></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderSettingsBlacklistCard(settingsCardStyle) {
        return `
            <div style="${settingsCardStyle}">
                <div style="font-size:13px;font-weight:700;margin-bottom:10px;">Blacklist</div>

                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <input id="tm-user-input" type="text" placeholder="Pseudo"
                        style="
                            flex:1 1 180px;
                            min-width:0;
                            background:#18181b;
                            color:#fff;
                            border:1px solid rgba(255,255,255,0.10);
                            border-radius:10px;
                            padding:10px 12px;
                            outline:none;
                        ">
                    <button id="tm-user-toggle" style="
                        border:none;
                        background:#2563eb;
                        color:#fff;
                        border-radius:10px;
                        padding:10px 12px;
                        cursor:pointer;
                        font-weight:600;
                    ">Ajouter / retirer</button>
                </div>

                <div style="margin-top:10px;font-size:12px;color:#a1a1aa;line-height:1.5;">
                    Bloqués :
                </div>

                <div id="tm-hidden-users-list" style="
                    margin-top:8px;
                    display:flex;
                    flex-wrap:wrap;
                    gap:8px;
                "></div>

                <div style="margin-top:8px;font-size:11px;color:#71717a;line-height:1.4;">
                    Clique sur un pseudo pour le charger dans le champ. Alt+clic directement sur un pseudo du chat permet de le blacklister.
                </div>
            </div>
        `;
    }

    function renderSettingsHighlightCard(settingsCardStyle) {
        return `
            <div style="${settingsCardStyle}">
                <div style="font-size:13px;font-weight:700;margin-bottom:10px;">Mettre en avant</div>

                <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                    <input id="tm-highlight-user-input" type="text" placeholder="Pseudo"
                        style="
                            flex:1 1 160px;
                            min-width:0;
                            background:#18181b;
                            color:#fff;
                            border:1px solid rgba(255,255,255,0.10);
                            border-radius:10px;
                            padding:10px 12px;
                            outline:none;
                        ">

                    <input id="tm-highlight-color-input" type="color" value="${DEFAULT_HIGHLIGHT_COLOR}"
                        style="
                            width:48px;
                            height:40px;
                            padding:4px;
                            background:#18181b;
                            border:1px solid rgba(255,255,255,0.10);
                            border-radius:10px;
                            cursor:pointer;
                        ">

                    <button id="tm-highlight-save" style="
                        border:none;
                        background:#d97706;
                        color:#fff;
                        border-radius:10px;
                        padding:10px 12px;
                        cursor:pointer;
                        font-weight:600;
                    ">Ajouter / MAJ</button>

                    <button id="tm-highlight-remove" style="
                        border:none;
                        background:#3f3f46;
                        color:#fff;
                        border-radius:10px;
                        padding:10px 12px;
                        cursor:pointer;
                        font-weight:600;
                    ">Retirer</button>
                </div>

                <div style="display:grid;gap:8px;margin-top:12px;">
                    <label style="display:flex;flex-direction:column;gap:6px;">
                        <span style="display:flex;justify-content:space-between;gap:12px;font-size:12px;color:#c4c4c8;">
                            <span>Opacité</span>
                            <span id="tm-highlight-opacity-value">${DEFAULT_HIGHLIGHT_OPACITY}%</span>
                        </span>
                        <input id="tm-highlight-opacity-input" type="range" min="0" max="100" step="1" value="${DEFAULT_HIGHLIGHT_OPACITY}"
                            title="Opacité %"
                            style="
                                width:100%;
                                accent-color:#f59e0b;
                                cursor:pointer;
                            ">
                    </label>

                    <div>
                        <div style="font-size:12px;color:#c4c4c8;margin-bottom:6px;">Aperçu</div>
                        <div id="tm-highlight-preview" style="
                            padding:10px 12px;
                            border-radius:12px;
                            background:rgba(245,158,11,0.14);
                            border:1px solid rgba(245,158,11,0.42);
                            box-shadow:inset 3px 0 0 rgba(245,158,11,0.75);
                        ">
                            <div style="display:flex;align-items:center;gap:8px;font-size:11px;color:#d4d4d8;margin-bottom:4px;">
                                <span style="font-weight:700;color:#fff;">Pseudo</span>
                                <span id="tm-highlight-preview-meta">Mise en avant</span>
                            </div>
                            <div id="tm-highlight-preview-text" style="font-size:12px;color:#f4f4f5;line-height:1.45;">
                                Exemple de message mis en avant.
                            </div>
                        </div>
                    </div>
                </div>

                <div style="margin-top:10px;font-size:12px;color:#a1a1aa;line-height:1.5;">
                    Mis en avant :
                </div>

                <div id="tm-highlight-users-list" style="
                    margin-top:8px;
                    display:flex;
                    flex-wrap:wrap;
                    gap:8px;
                "></div>

                <div style="margin-top:8px;font-size:11px;color:#71717a;line-height:1.4;">
                    Clique sur un pseudo pour charger sa couleur. Les messages restent visibles mais sont surlignés avec la couleur choisie.
                </div>
            </div>
        `;
    }

    function renderSettingsMentionPreviewSection() {
        return `
            <div style="display:grid;gap:10px;margin-top:12px;">
                <label style="display:flex;flex-direction:column;gap:6px;">
                    <span style="display:flex;justify-content:space-between;gap:12px;font-size:12px;color:#c4c4c8;">
                        <span>Opacité</span>
                        <span id="tm-mention-opacity-value">${mentionSettings.opacityPercent}%</span>
                    </span>
                    <input id="tm-mention-opacity-input" type="range" min="0" max="100" step="1" value="${mentionSettings.opacityPercent}"
                        title="Opacité %"
                        style="
                            width:100%;
                            accent-color:#22c55e;
                            cursor:pointer;
                        ">
                </label>

                <div style="font-size:11px;color:#71717a;line-height:1.4;">
                    Ajuste la transparence de la surbrillance.
                </div>

                <div>
                    <div style="font-size:12px;color:#c4c4c8;margin-bottom:6px;">Aperçu</div>
                    <div id="tm-mention-preview" style="
                        padding:10px 12px;
                        border-radius:12px;
                        background:rgba(34,197,94,0.18);
                        border:1px solid rgba(34,197,94,0.45);
                        box-shadow:inset 3px 0 0 rgba(34,197,94,0.7);
                    ">
                        <div style="display:flex;align-items:center;gap:8px;font-size:11px;color:#d4d4d8;margin-bottom:4px;">
                            <span style="font-weight:700;color:#fff;">Pseudo</span>
                            <span id="tm-mention-preview-meta">Mention @moi</span>
                        </div>
                        <div id="tm-mention-preview-text" style="font-size:12px;color:#f4f4f5;line-height:1.45;">
                            Exemple de message contenant une mention.
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderSettingsMentionSoundSection() {
        return `
            <div style="margin-top:10px;">
                <div style="font-size:12px;color:#c4c4c8;margin-bottom:8px;">Son de notification</div>
                <div id="tm-mention-sound-scope-group" data-tm-sound-scope="${mentionSettings.soundScope || DEFAULT_MENTION_SOUND_SCOPE}" style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button type="button" data-tm-mention-sound-scope="off" style="
                        border:1px solid rgba(255,255,255,0.08);
                        background:#27272a;
                        color:#e4e4e7;
                        border-radius:999px;
                        padding:8px 12px;
                        cursor:pointer;
                        font-size:12px;
                        font-weight:600;
                    ">Désactivé</button>
                    <button type="button" data-tm-mention-sound-scope="home" style="
                        border:1px solid rgba(255,255,255,0.08);
                        background:#27272a;
                        color:#e4e4e7;
                        border-radius:999px;
                        padding:8px 12px;
                        cursor:pointer;
                        font-size:12px;
                        font-weight:600;
                    ">Accueil</button>
                    <button type="button" data-tm-mention-sound-scope="chat" style="
                        border:1px solid rgba(255,255,255,0.08);
                        background:#27272a;
                        color:#e4e4e7;
                        border-radius:999px;
                        padding:8px 12px;
                        cursor:pointer;
                        font-size:12px;
                        font-weight:600;
                    ">Chat</button>
                    <button type="button" data-tm-mention-sound-scope="both" style="
                        border:1px solid rgba(255,255,255,0.08);
                        background:#27272a;
                        color:#e4e4e7;
                        border-radius:999px;
                        padding:8px 12px;
                        cursor:pointer;
                        font-size:12px;
                        font-weight:600;
                    ">Les deux</button>
                </div>
                <div style="margin-top:8px;font-size:11px;color:#71717a;line-height:1.45;">
                    Choisis sur quelle vue le son doit se jouer. Le mode désactivé replie les réglages audio pour gagner de la place.
                </div>
            </div>

            <div id="tm-mention-sound-options" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:10px;">
                <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:#c4c4c8;">
                    <span>Son</span>
                    <select id="tm-mention-sound-style-select"
                        style="
                            min-width:120px;
                            background:#18181b;
                            color:#fff;
                            border:1px solid rgba(255,255,255,0.10);
                            border-radius:10px;
                            padding:10px 12px;
                            outline:none;
                        ">
                        <option value="ping" ${mentionSettings.soundStyle === 'ping' ? 'selected' : ''}>Ping</option>
                        <option value="soft" ${mentionSettings.soundStyle === 'soft' ? 'selected' : ''}>Doux</option>
                        <option value="bell" ${mentionSettings.soundStyle === 'bell' ? 'selected' : ''}>Cloche</option>
                        <option value="double" ${mentionSettings.soundStyle === 'double' ? 'selected' : ''}>Double</option>
                        <option value="custom" ${mentionSettings.soundStyle === 'custom' ? 'selected' : ''}>Personnalisé</option>
                    </select>
                </label>

                <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:#c4c4c8;flex:1 1 240px;min-width:0;">
                    <span>URL audio</span>
                    <input id="tm-mention-sound-custom-url-input" type="text" placeholder="https://.../son.mp3" value="${escapeHtml(mentionSettings.soundCustomUrl || '')}"
                        style="
                            flex:1 1 180px;
                            min-width:0;
                            background:#18181b;
                            color:#fff;
                            border:1px solid rgba(255,255,255,0.10);
                            border-radius:10px;
                            padding:10px 12px;
                            outline:none;
                        ">
                </label>

                <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:#c4c4c8;">
                    <span>Délai mini</span>
                    <input id="tm-mention-sound-cooldown-input" type="number" min="0" max="300" step="0.5" value="${mentionSettings.soundCooldownSeconds}"
                        style="
                            width:90px;
                            background:#18181b;
                            color:#fff;
                            border:1px solid rgba(255,255,255,0.10);
                            border-radius:10px;
                            padding:10px 12px;
                            outline:none;
                        ">
                    <span>s</span>
                </label>

                <button id="tm-mention-sound-test" type="button" style="
                    border:none;
                    background:#2563eb;
                    color:#fff;
                    border-radius:10px;
                    padding:10px 12px;
                    cursor:pointer;
                    font-weight:600;
                ">Tester le son</button>
            </div>
        `;
    }

    function renderSettingsMentionCard(settingsCardStyle, settingsCheckboxLabelStyle) {
        return `
            <div style="${settingsCardStyle}">
                <div style="font-size:13px;font-weight:700;margin-bottom:10px;">Mentions @moi</div>

                <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                    <input id="tm-mention-user-input" type="text" placeholder="Mon pseudo" value="${escapeHtml(mentionSettings.username)}"
                        style="
                            flex:1 1 180px;
                            min-width:0;
                            background:#18181b;
                            color:#fff;
                            border:1px solid rgba(255,255,255,0.10);
                            border-radius:10px;
                            padding:10px 12px;
                            outline:none;
                        ">

                    <input id="tm-mention-color-input" type="color" value="${mentionSettings.color}"
                        style="
                            width:48px;
                            height:40px;
                            padding:4px;
                            background:#18181b;
                            border:1px solid rgba(255,255,255,0.10);
                            border-radius:10px;
                            cursor:pointer;
                        ">

                    <input id="tm-mention-blink-input" type="number" min="0" max="30" step="0.5" value="${mentionSettings.blinkSeconds}"
                        style="
                            width:90px;
                            background:#18181b;
                            color:#fff;
                            border:1px solid rgba(255,255,255,0.10);
                            border-radius:10px;
                            padding:10px 12px;
                            outline:none;
                        ">
                </div>

                ${renderSettingsMentionPreviewSection()}

                <label style="${settingsCheckboxLabelStyle} margin-top:10px;">
                    <input id="tm-mention-keep-highlight-toggle" type="checkbox" ${mentionSettings.keepHighlightAfterBlink ? 'checked' : ''} style="${createSettingsCheckboxInputStyle('#22c55e')}">
                    <span>Garder la couleur après le clignotement</span>
                </label>

                <label style="${settingsCheckboxLabelStyle} margin-top:10px;">
                    <input id="tm-mention-include-reply-toggle" type="checkbox" ${mentionSettings.includeReplyContext ? 'checked' : ''} style="${createSettingsCheckboxInputStyle('#22c55e')}">
                    <span>Considérer aussi les réponses citées vers @moi</span>
                </label>

                ${renderSettingsMentionSoundSection()}

                <div style="display:flex;justify-content:flex-start;gap:8px;flex-wrap:wrap;margin-top:12px;">
                    <button id="tm-mention-save" style="
                        border:none;
                        background:#059669;
                        color:#fff;
                        border-radius:10px;
                        padding:10px 12px;
                        cursor:pointer;
                        font-weight:600;
                    ">Enregistrer</button>
                </div>

                <div style="margin-top:8px;font-size:11px;color:#71717a;line-height:1.45;">
                    Quand un message contient @tonpseudo, il est surligné avec cette couleur. Tu peux aussi inclure les réponses citées, régler l'opacité, mettre 0 seconde pour désactiver le clignotement, choisir un son si besoin et laisser le pseudo vide pour couper la surveillance.
                </div>
            </div>
        `;
    }

    function renderSettingsDebugCard(settingsCardStyle, settingsCheckboxLabelStyle) {
        return `
            <div style="${settingsCardStyle}">
                <div style="font-size:13px;font-weight:700;margin-bottom:10px;">Debug</div>

                <label style="${settingsCheckboxLabelStyle}">
                    <input id="tm-debug-toggle" type="checkbox" ${debugMode ? 'checked' : ''} style="${createSettingsCheckboxInputStyle('#ef4444')}">
                    <span>Mode debug</span>
                </label>

                <div style="margin-top:8px;font-size:11px;color:#71717a;line-height:1.45;">
                    En mode debug, les messages blacklistés ne sont pas cachés, et des logs détaillés partent dans la console pour les mentions et le suivi des emojis.
                </div>
            </div>
        `;
    }

    function buildSettingsModalHtml(currentPageLabel, homeView, isChatView, styles) {
        return `
            ${renderSettingsModalHeader(currentPageLabel)}
            ${renderSettingsTipsCard(isChatView, styles.settingsFullWidthCardStyle)}

            <div style="
                column-count:${styles.settingsColumnCount};
                column-gap:14px;
            ">
                ${renderSettingsHomeCard(homeView, styles.settingsCardStyle, styles.settingsCheckboxLabelStyle)}
                ${renderSettingsStatsCard(currentPageLabel, styles.settingsCardStyle, styles.settingsCheckboxLabelWithMarginStyle)}
                ${renderSettingsAccessibilityCard(currentPageLabel, isChatView, styles)}
                ${renderSettingsSavedPhrasesCard(styles.settingsCardStyle, styles.settingsCheckboxLabelStyle)}
                ${renderSettingsConfigCard(styles.settingsCardStyle)}
                ${renderSettingsGifCard(styles.settingsCardStyle, styles.settingsCheckboxLabelStyle)}
                ${renderSettingsImageHostingCard(styles.settingsCardStyle, styles.settingsCheckboxLabelStyle)}
                ${renderSettingsEmojiQuickAccessCard(styles.settingsCardStyle)}
                ${renderSettingsBlacklistCard(styles.settingsCardStyle)}
                ${renderSettingsHighlightCard(styles.settingsCardStyle)}
                ${renderSettingsMentionCard(styles.settingsCardStyle, styles.settingsCheckboxLabelStyle)}
                ${renderSettingsDebugCard(styles.settingsCardStyle, styles.settingsCheckboxLabelStyle)}
            </div>

            <div id="tm-feedback" style="
                min-height:20px;
                margin-top:4px;
                font-size:12px;
                color:#93c5fd;
            "></div>

            ${renderSettingsEmojiUsageHistoryPanel()}
        `;
    }

    function closeImageViewer() {
        const modal = document.getElementById(IMAGE_VIEWER_MODAL_ID);
        const overlay = document.getElementById(IMAGE_VIEWER_OVERLAY_ID);
        if (modal) modal.remove();
        if (overlay) overlay.remove();
        if (imageViewerKeydownHandler) {
            document.removeEventListener('keydown', imageViewerKeydownHandler, true);
            imageViewerKeydownHandler = null;
        }
        imageViewerOpen = false;
    }

    function closeYouTubePlayer() {
        const player = document.getElementById(YOUTUBE_PLAYER_ID);
        if (player) {
            const iframe = player.querySelector('iframe');
            if (iframe instanceof HTMLIFrameElement) {
                iframe.src = 'about:blank';
            }
            player.remove();
        }

        if (youtubePlayerKeydownHandler) {
            document.removeEventListener('keydown', youtubePlayerKeydownHandler, true);
            youtubePlayerKeydownHandler = null;
        }

        if (youtubePlayerResizeObserver) {
            youtubePlayerResizeObserver.disconnect();
            youtubePlayerResizeObserver = null;
        }

        if (youtubePlayerViewportResizeHandler) {
            window.removeEventListener('resize', youtubePlayerViewportResizeHandler, true);
            youtubePlayerViewportResizeHandler = null;
        }
    }

    function isYouTubePlayerCollapsed(player = document.getElementById(YOUTUBE_PLAYER_ID)) {
        return player instanceof HTMLElement && player.dataset.tmYoutubeCollapsed === '1';
    }

    function updateYouTubePlayerCollapseButton(button, collapsed) {
        if (!(button instanceof HTMLButtonElement)) return;

        button.title = collapsed ? 'Réafficher la vidéo' : 'Masquer la vidéo sans couper le son';
        button.setAttribute('aria-label', button.title);
        button.innerHTML = collapsed
            ? `
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
                    <circle cx="12" cy="12" r="2.8" fill="none" stroke="currentColor" stroke-width="1.8"></circle>
                </svg>
            `
            : `
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                    <path d="M3 3l18 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
                    <path d="M10.6 5.3A11.5 11.5 0 0 1 12 5.2c6.5 0 10 6 10 6a17.6 17.6 0 0 1-3.3 4.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
                    <path d="M6.6 6.7C3.8 8.4 2 11.2 2 11.2s3.5 6 10 6c1.2 0 2.4-.2 3.4-.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
                    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
            `;
    }

    function setYouTubePlayerCollapsed(collapsed, player = document.getElementById(YOUTUBE_PLAYER_ID)) {
        if (!(player instanceof HTMLElement)) return;

        const header = player.querySelector('[data-tm-youtube-player-header="1"]');
        const body = player.querySelector('[data-tm-youtube-player-body="1"]');
        const collapseBtn = player.querySelector('[data-tm-youtube-player-collapse="1"]');

        if (!(header instanceof HTMLElement) || !(body instanceof HTMLElement) || !(collapseBtn instanceof HTMLButtonElement)) {
            return;
        }

        if (collapsed) {
            if (!isYouTubePlayerCollapsed(player)) {
                player.dataset.tmYoutubeExpandedWidth = String(
                    Math.round(player.offsetWidth || Number.parseFloat(player.style.width) || DEFAULT_YOUTUBE_PLAYER_WIDTH_PX)
                );
                player.dataset.tmYoutubeExpandedHeight = String(
                    Math.round(player.offsetHeight || Number.parseFloat(player.style.height) || DEFAULT_YOUTUBE_PLAYER_HEIGHT_PX)
                );
            }

            player.dataset.tmYoutubeCollapsed = '1';
            body.style.display = 'none';
            header.style.borderBottom = 'none';
            player.style.width = `${MINIMIZED_YOUTUBE_PLAYER_WIDTH_PX}px`;
            player.style.height = 'auto';
            player.style.minWidth = '220px';
            player.style.minHeight = '0';
            player.style.resize = 'none';
            updateYouTubePlayerCollapseButton(collapseBtn, true);
            constrainYouTubePlayerToViewport(player);
            return;
        }

        player.dataset.tmYoutubeCollapsed = '0';
        body.style.display = 'block';
        header.style.borderBottom = '1px solid rgba(255,255,255,0.06)';
        player.style.width = `${Math.max(320, Number(player.dataset.tmYoutubeExpandedWidth) || DEFAULT_YOUTUBE_PLAYER_WIDTH_PX)}px`;
        player.style.height = `${Math.max(220, Number(player.dataset.tmYoutubeExpandedHeight) || DEFAULT_YOUTUBE_PLAYER_HEIGHT_PX)}px`;
        player.style.minWidth = '320px';
        player.style.minHeight = '220px';
        player.style.resize = 'both';
        updateYouTubePlayerCollapseButton(collapseBtn, false);
        constrainYouTubePlayerToViewport(player);
    }

    function constrainYouTubePlayerToViewport(player) {
        if (!(player instanceof HTMLElement)) return;

        const margin = 12;
        const maxWidth = Math.max(260, window.innerWidth - margin * 2);
        const maxHeight = Math.max(180, window.innerHeight - margin * 2);

        if (player.offsetWidth > maxWidth) {
            player.style.width = `${maxWidth}px`;
        }

        if (player.offsetHeight > maxHeight) {
            player.style.height = `${maxHeight}px`;
        }

        const rect = player.getBoundingClientRect();
        const currentLeft = player.style.left && player.style.left !== 'auto'
            ? Number.parseFloat(player.style.left) || rect.left
            : rect.left;
        const currentTop = player.style.top && player.style.top !== 'auto'
            ? Number.parseFloat(player.style.top) || rect.top
            : rect.top;
        const nextLeft = clamp(currentLeft, margin, Math.max(margin, window.innerWidth - rect.width - margin));
        const nextTop = clamp(currentTop, margin, Math.max(margin, window.innerHeight - rect.height - margin));

        player.style.left = `${nextLeft}px`;
        player.style.top = `${nextTop}px`;
        player.style.right = 'auto';
        player.style.bottom = 'auto';
    }

    function getOrCreateYouTubePlayer() {
        let player = document.getElementById(YOUTUBE_PLAYER_ID);
        if (player) return player;
        if (!document.body) return null;

        player = document.createElement('div');
        player.id = YOUTUBE_PLAYER_ID;
        player.style.position = 'fixed';
        player.style.right = '18px';
        player.style.bottom = '18px';
        player.style.zIndex = '1000001';
        player.style.display = 'flex';
        player.style.flexDirection = 'column';
        player.style.width = `${DEFAULT_YOUTUBE_PLAYER_WIDTH_PX}px`;
        player.style.height = `${DEFAULT_YOUTUBE_PLAYER_HEIGHT_PX}px`;
        player.style.minWidth = '320px';
        player.style.minHeight = '220px';
        player.style.maxWidth = 'calc(100vw - 24px)';
        player.style.maxHeight = 'calc(100vh - 24px)';
        player.style.background = 'rgba(24,24,27,0.98)';
        player.style.border = '1px solid rgba(255,255,255,0.08)';
        player.style.borderRadius = '16px';
        player.style.boxShadow = '0 20px 50px rgba(0,0,0,0.45)';
        player.style.backdropFilter = 'blur(8px)';
        player.style.overflow = 'hidden';
        player.style.resize = 'both';

        const header = document.createElement('div');
        header.setAttribute('data-tm-youtube-player-header', '1');
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.justifyContent = 'space-between';
        header.style.gap = '12px';
        header.style.padding = '10px 12px';
        header.style.background = 'rgba(255,255,255,0.04)';
        header.style.borderBottom = '1px solid rgba(255,255,255,0.06)';
        header.style.cursor = 'move';
        header.style.userSelect = 'none';

        const title = document.createElement('div');
        title.textContent = DEFAULT_YOUTUBE_PLAYER_TITLE;
        title.setAttribute('data-tm-youtube-player-title', '1');
        title.title = DEFAULT_YOUTUBE_PLAYER_TITLE;
        title.style.flex = '1';
        title.style.minWidth = '0';
        title.style.overflow = 'hidden';
        title.style.textOverflow = 'ellipsis';
        title.style.whiteSpace = 'nowrap';
        title.style.fontSize = '12px';
        title.style.fontWeight = '700';
        title.style.color = '#f4f4f5';

        const headerActions = document.createElement('div');
        headerActions.style.display = 'flex';
        headerActions.style.alignItems = 'center';
        headerActions.style.gap = '8px';
        headerActions.style.flexShrink = '0';

        const collapseBtn = document.createElement('button');
        collapseBtn.type = 'button';
        collapseBtn.setAttribute('data-tm-youtube-player-collapse', '1');
        collapseBtn.style.border = 'none';
        collapseBtn.style.background = '#27272a';
        collapseBtn.style.color = '#fff';
        collapseBtn.style.width = '30px';
        collapseBtn.style.height = '30px';
        collapseBtn.style.borderRadius = '9px';
        collapseBtn.style.cursor = 'pointer';
        collapseBtn.style.display = 'inline-flex';
        collapseBtn.style.alignItems = 'center';
        collapseBtn.style.justifyContent = 'center';
        updateYouTubePlayerCollapseButton(collapseBtn, false);

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.textContent = '×';
        closeBtn.style.border = 'none';
        closeBtn.style.background = '#27272a';
        closeBtn.style.color = '#fff';
        closeBtn.style.width = '30px';
        closeBtn.style.height = '30px';
        closeBtn.style.borderRadius = '9px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontSize = '18px';
        closeBtn.style.lineHeight = '1';

        const body = document.createElement('div');
        body.setAttribute('data-tm-youtube-player-body', '1');
        body.style.flex = '1';
        body.style.minHeight = '0';
        body.style.background = '#09090b';

        header.appendChild(title);
        headerActions.appendChild(collapseBtn);
        headerActions.appendChild(closeBtn);
        header.appendChild(headerActions);
        player.appendChild(header);
        player.appendChild(body);

        collapseBtn.addEventListener('click', () => {
            setYouTubePlayerCollapsed(!isYouTubePlayerCollapsed(player), player);
        });

        closeBtn.addEventListener('click', () => {
            closeYouTubePlayer();
        });

        let dragState = null;

        function stopDrag() {
            dragState = null;
            document.removeEventListener('mousemove', handleDrag, true);
            document.removeEventListener('mouseup', stopDrag, true);
        }

        function handleDrag(event) {
            if (!dragState) return;

            const nextLeft = clamp(
                dragState.startLeft + (event.clientX - dragState.startX),
                0,
                Math.max(0, window.innerWidth - player.offsetWidth)
            );
            const nextTop = clamp(
                dragState.startTop + (event.clientY - dragState.startY),
                0,
                Math.max(0, window.innerHeight - player.offsetHeight)
            );

            player.style.left = `${nextLeft}px`;
            player.style.top = `${nextTop}px`;
            player.style.right = 'auto';
            player.style.bottom = 'auto';
        }

        header.addEventListener('mousedown', (event) => {
            if (event.button !== 0) return;
            if (event.target instanceof Element && event.target.closest('button')) return;

            const rect = player.getBoundingClientRect();
            dragState = {
                startX: event.clientX,
                startY: event.clientY,
                startLeft: rect.left,
                startTop: rect.top
            };

            document.addEventListener('mousemove', handleDrag, true);
            document.addEventListener('mouseup', stopDrag, true);
            event.preventDefault();
        });

        document.body.appendChild(player);

        youtubePlayerViewportResizeHandler = () => {
            constrainYouTubePlayerToViewport(player);
        };
        window.addEventListener('resize', youtubePlayerViewportResizeHandler, true);

        if ('ResizeObserver' in window) {
            youtubePlayerResizeObserver = new ResizeObserver(() => {
                constrainYouTubePlayerToViewport(player);
            });
            youtubePlayerResizeObserver.observe(player);
        }

        constrainYouTubePlayerToViewport(player);
        return player;
    }

    function openYouTubePlayer(embedUrl, options = {}) {
        const normalizedEmbedUrl = String(embedUrl || '').trim();
        if (!normalizedEmbedUrl) return;

        const player = getOrCreateYouTubePlayer();
        if (!(player instanceof HTMLElement)) return;

        const body = player.querySelector('[data-tm-youtube-player-body="1"]');
        if (!(body instanceof HTMLElement)) return;

        // L'iframe est ajoutée par Tampermonkey afin de ne pas être soumise à
        // la directive frame-src/default-src de Tr4ker. Cela conserve le
        // mini-lecteur déplaçable, sans ouvrir un nouvel onglet.
        body.querySelector('iframe')?.remove();

        const iframeAttributes = {
            src: normalizedEmbedUrl,
            allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
            allowfullscreen: '',
            referrerpolicy: 'strict-origin-when-cross-origin',
            style: 'display:block;width:100%;height:100%;border:0;background:#000;'
        };
        let iframe = null;

        if (typeof GM_addElement === 'function') {
            iframe = GM_addElement(body, 'iframe', iframeAttributes);
        }

        if (!(iframe instanceof HTMLIFrameElement)) {
            // Compatibilité avec les anciens gestionnaires de userscripts :
            // le lecteur reste affiché, mais peut rester soumis à la CSP.
            iframe = document.createElement('iframe');
            iframe.src = normalizedEmbedUrl;
            iframe.allow = iframeAttributes.allow;
            iframe.allowFullscreen = true;
            iframe.referrerPolicy = iframeAttributes.referrerpolicy;
            iframe.style.cssText = iframeAttributes.style;
            body.appendChild(iframe);
        }

        if (isYouTubePlayerCollapsed(player)) {
            setYouTubePlayerCollapsed(false, player);
        }

        const videoId = String(options?.videoId || '').trim();
        const watchUrl = String(options?.watchUrl || '').trim();
        player.dataset.tmYoutubeVideoId = videoId;
        setYouTubePlayerTitle(
            youtubeVideoTitleCache.get(videoId) ||
            getFallbackYouTubePlayerTitle(videoId)
        );

        if (videoId && watchUrl && !youtubeVideoTitleCache.has(videoId)) {
            const requestSerial = ++youtubePlayerTitleRequestSerial;

            void fetchYouTubeVideoTitle(videoId, watchUrl).then((resolvedTitle) => {
                if (!resolvedTitle || requestSerial !== youtubePlayerTitleRequestSerial) return;

                const activePlayer = document.getElementById(YOUTUBE_PLAYER_ID);
                if (!(activePlayer instanceof HTMLElement)) return;
                if ((activePlayer.dataset.tmYoutubeVideoId || '') !== videoId) return;
                setYouTubePlayerTitle(resolvedTitle);
            });
        }

        if (!youtubePlayerKeydownHandler) {
            youtubePlayerKeydownHandler = (event) => {
                if (event.key !== 'Escape' || modalOpen || imageViewerOpen) return;
                if (!(document.getElementById(YOUTUBE_PLAYER_ID) instanceof HTMLElement)) return;

                event.preventDefault();
                closeYouTubePlayer();
            };

            document.addEventListener('keydown', youtubePlayerKeydownHandler, true);
        }
    }

    function openImageViewerFromCandidates(candidateUrls) {
        if (!Array.isArray(candidateUrls) || candidateUrls.length === 0) return;

        closeImageViewer();
        hideImagePreview();
        imageViewerOpen = true;

        const overlay = document.createElement('div');
        overlay.id = IMAGE_VIEWER_OVERLAY_ID;
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '1000004';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.padding = '12px';
        overlay.style.background = 'rgba(0,0,0,0.7)';
        overlay.style.backdropFilter = 'blur(4px)';

        const modal = document.createElement('div');
        modal.id = IMAGE_VIEWER_MODAL_ID;
        modal.style.position = 'relative';
        modal.style.zIndex = '1000005';
        modal.style.width = 'min(1400px, calc(100vw - 24px))';
        modal.style.maxWidth = 'calc(100vw - 24px)';
        modal.style.maxHeight = 'calc(100vh - 24px)';
        modal.style.display = 'flex';
        modal.style.flexDirection = 'column';
        modal.style.gap = '12px';
        modal.style.padding = '16px';
        modal.style.background = 'rgba(24,24,27,0.98)';
        modal.style.border = '1px solid rgba(255,255,255,0.08)';
        modal.style.borderRadius = '18px';
        modal.style.boxShadow = '0 24px 60px rgba(0,0,0,0.5)';
        modal.style.color = '#fff';
        modal.style.fontFamily = 'Inter, Arial, sans-serif';

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.gap = '12px';

        const headerText = document.createElement('div');

        const title = document.createElement('div');
        title.textContent = 'Aperçu image grand format';
        title.style.fontSize = '16px';
        title.style.fontWeight = '700';

        const subtitle = document.createElement('div');
        subtitle.textContent = 'Échap ou clic hors de la fenêtre pour fermer.';
        subtitle.style.marginTop = '4px';
        subtitle.style.fontSize = '12px';
        subtitle.style.color = '#a1a1aa';

        headerText.appendChild(title);
        headerText.appendChild(subtitle);

        const headerActions = document.createElement('div');
        headerActions.style.display = 'flex';
        headerActions.style.alignItems = 'center';
        headerActions.style.gap = '8px';

        const sourceLink = document.createElement('a');
        sourceLink.textContent = 'Ouvrir l’original';
        sourceLink.target = '_blank';
        sourceLink.rel = 'noreferrer noopener';
        sourceLink.style.display = 'inline-flex';
        sourceLink.style.alignItems = 'center';
        sourceLink.style.justifyContent = 'center';
        sourceLink.style.padding = '10px 12px';
        sourceLink.style.borderRadius = '10px';
        sourceLink.style.background = '#2563eb';
        sourceLink.style.color = '#fff';
        sourceLink.style.fontSize = '12px';
        sourceLink.style.fontWeight = '600';
        sourceLink.style.textDecoration = 'none';

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.textContent = '×';
        closeBtn.style.border = 'none';
        closeBtn.style.background = '#27272a';
        closeBtn.style.color = '#fff';
        closeBtn.style.width = '36px';
        closeBtn.style.height = '36px';
        closeBtn.style.borderRadius = '10px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontSize = '20px';
        closeBtn.style.lineHeight = '1';

        headerActions.appendChild(sourceLink);
        headerActions.appendChild(closeBtn);
        header.appendChild(headerText);
        header.appendChild(headerActions);

        const surface = document.createElement('div');
        surface.style.display = 'flex';
        surface.style.alignItems = 'center';
        surface.style.justifyContent = 'center';
        surface.style.minHeight = 'min(72vh, 720px)';
        surface.style.maxHeight = 'calc(100vh - 130px)';
        surface.style.padding = '10px';
        surface.style.borderRadius = '16px';
        surface.style.background = 'rgba(255,255,255,0.03)';
        surface.style.border = '1px solid rgba(255,255,255,0.06)';
        surface.style.overflow = 'auto';

        const image = document.createElement('img');
        image.alt = '';
        image.style.display = 'block';
        image.style.maxWidth = '100%';
        image.style.maxHeight = 'calc(100vh - 180px)';
        image.style.width = 'auto';
        image.style.height = 'auto';
        image.style.objectFit = 'contain';
        image.style.borderRadius = '12px';
        image.style.boxShadow = '0 18px 40px rgba(0,0,0,0.35)';

        const status = document.createElement('div');
        status.textContent = 'Chargement de l’image...';
        status.style.fontSize = '12px';
        status.style.color = '#a1a1aa';
        status.style.textAlign = 'center';

        surface.appendChild(image);
        modal.appendChild(header);
        modal.appendChild(surface);
        modal.appendChild(status);
        overlay.appendChild(modal);

        function handleEscape(event) {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            closeImageViewer();
        }

        imageViewerKeydownHandler = handleEscape;

        let candidateIndex = 0;

        function tryNextCandidate() {
            if (!imageViewerOpen) return;

            if (candidateIndex >= candidateUrls.length) {
                status.textContent = 'Impossible de charger l’image.';
                sourceLink.removeAttribute('href');
                return;
            }

            const nextUrl = candidateUrls[candidateIndex];
            candidateIndex += 1;
            status.textContent = 'Chargement de l’image...';
            sourceLink.href = nextUrl;
            image.src = nextUrl;
        }

        image.onload = () => {
            if (!imageViewerOpen) return;

            sourceLink.href = image.currentSrc || image.src || sourceLink.href;
            status.textContent = `${image.naturalWidth || '?'} x ${image.naturalHeight || '?'} px`;
        };

        image.onerror = () => {
            if (!imageViewerOpen) return;
            tryNextCandidate();
        };

        closeBtn.addEventListener('click', () => {
            closeImageViewer();
        });

        overlay.addEventListener('click', (event) => {
            if (event.target !== overlay) return;
            closeImageViewer();
        });

        document.body.appendChild(overlay);
        document.addEventListener('keydown', imageViewerKeydownHandler, true);
        tryNextCandidate();
    }

    function setModalFeedback(feedbackElement, message, isError = false) {
        if (!(feedbackElement instanceof HTMLElement)) return;

        feedbackElement.textContent = message;
        feedbackElement.style.color = isError ? '#fca5a5' : '#93c5fd';
    }

    function syncSavedPhraseLengthIndicator(textarea, lengthLabel, suffix = '') {
        if (!(textarea instanceof HTMLTextAreaElement) || !(lengthLabel instanceof HTMLElement)) return;

        if (textarea.value.length > MAX_SAVED_PHRASE_LENGTH) {
            textarea.value = textarea.value.slice(0, MAX_SAVED_PHRASE_LENGTH);
        }

        const currentLength = textarea.value.length;
        lengthLabel.textContent = `${currentLength}/${MAX_SAVED_PHRASE_LENGTH}${suffix}`;
        lengthLabel.style.color = currentLength >= MAX_SAVED_PHRASE_LENGTH
            ? '#fca5a5'
            : (currentLength >= Math.floor(MAX_SAVED_PHRASE_LENGTH * 0.9) ? '#facc15' : '#71717a');
    }

    function getSavedPhrasesModalCardStyle() {
        return `
            padding:12px;
            border-radius:14px;
            background:rgba(255,255,255,0.03);
            border:1px solid rgba(255,255,255,0.06);
        `;
    }

    function buildSavedPhrasesConfigModalHtml(cardStyle) {
        return `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px;">
            <div>
                <div style="font-size:16px;font-weight:700;">Configuration des réponses rapides</div>
                <div id="tm-saved-phrases-summary" style="font-size:12px;color:#a1a1aa;margin-top:4px;">
                    ${formatSavedPhrasesSummaryLabel()}
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                <button id="tm-saved-phrases-back" style="
                    border:none;
                    background:#3f3f46;
                    color:#fff;
                    border-radius:10px;
                    padding:10px 12px;
                    cursor:pointer;
                    font-weight:600;
                ">Retour</button>
                <button id="tm-close-modal" style="
                    border:none;
                    background:#27272a;
                    color:#fff;
                    width:34px;
                    height:34px;
                    border-radius:10px;
                    cursor:pointer;
                    font-size:18px;
                    line-height:1;
                ">×</button>
            </div>
        </div>

        <div style="display:grid;gap:14px;">
            <div style="${cardStyle}">
                <div style="font-size:13px;font-weight:700;margin-bottom:10px;">Ajouter une réponse rapide</div>

                <label for="tm-phrase-input" style="display:block;font-size:12px;color:#d4d4d8;margin-bottom:6px;">
                    Texte de la réponse
                </label>

                <textarea id="tm-phrase-input" rows="5" maxlength="${MAX_SAVED_PHRASE_LENGTH}" placeholder="Exemple : Salut, il me faut le lien exact du torrent pour vérifier."
                    style="
                        width:100%;
                        min-height:120px;
                        resize:vertical;
                        background:#18181b;
                        color:#fff;
                        border:1px solid rgba(255,255,255,0.10);
                        border-radius:10px;
                        padding:10px 12px;
                        outline:none;
                        line-height:1.45;
                    "></textarea>

                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:8px;font-size:11px;color:#71717a;">
                    <span>Limite alignée sur le champ de chat.</span>
                    <span id="tm-phrase-length">0/${MAX_SAVED_PHRASE_LENGTH}</span>
                </div>

                <label for="tm-phrase-keywords-input" style="display:block;font-size:12px;color:#d4d4d8;margin:12px 0 6px;">
                    Mots-clés
                </label>

                <input id="tm-phrase-keywords-input" type="text" placeholder="ratio, reseed, merci, lien"
                    style="
                        width:100%;
                        background:#18181b;
                        color:#fff;
                        border:1px solid rgba(255,255,255,0.10);
                        border-radius:10px;
                        padding:10px 12px;
                        outline:none;
                    ">

                <div style="margin-top:8px;font-size:11px;color:#71717a;line-height:1.45;">
                    Optionnel. Sépare les mots-clés par des virgules pour préparer une recherche ou des correspondances automatiques plus tard.
                </div>

                <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;">
                    <button id="tm-phrase-add" style="
                        border:none;
                        background:#2563eb;
                        color:#fff;
                        border-radius:10px;
                        padding:10px 12px;
                        cursor:pointer;
                        font-weight:600;
                    ">Enregistrer</button>
                </div>
            </div>

            <div style="${cardStyle}">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:10px;">
                    <div style="font-size:13px;font-weight:700;">Réponses enregistrées</div>
                    <div id="tm-phrases-count" style="font-size:12px;color:#a1a1aa;">${formatSavedPhrasesCountLabel()}</div>
                </div>

                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
                    <button id="tm-phrases-export" type="button" style="
                        border:none;
                        background:#0f766e;
                        color:#fff;
                        border-radius:10px;
                        padding:10px 12px;
                        cursor:pointer;
                        font-weight:600;
                    ">Exporter JSON</button>

                    <button id="tm-phrases-import" type="button" style="
                        border:none;
                        background:#7c3aed;
                        color:#fff;
                        border-radius:10px;
                        padding:10px 12px;
                        cursor:pointer;
                        font-weight:600;
                    ">Importer JSON</button>

                    <input id="tm-phrases-import-file" type="file" accept="application/json,.json" style="display:none;">
                </div>

                <div id="tm-phrases-list" style="display:grid;gap:10px;"></div>
            </div>
        </div>

        <div id="tm-feedback" style="
            min-height:20px;
            margin-top:14px;
            font-size:12px;
            color:#93c5fd;
        "></div>
        `;
    }

    function getSavedPhrasesConfigElements(modal) {
        return {
            closeBtn: modal.querySelector('#tm-close-modal'),
            backBtn: modal.querySelector('#tm-saved-phrases-back'),
            phraseInput: modal.querySelector('#tm-phrase-input'),
            phraseKeywordsInput: modal.querySelector('#tm-phrase-keywords-input'),
            phraseAddBtn: modal.querySelector('#tm-phrase-add'),
            phraseLength: modal.querySelector('#tm-phrase-length'),
            phrasesList: modal.querySelector('#tm-phrases-list'),
            phrasesCount: modal.querySelector('#tm-phrases-count'),
            phrasesExportBtn: modal.querySelector('#tm-phrases-export'),
            phrasesImportBtn: modal.querySelector('#tm-phrases-import'),
            phrasesImportFileInput: modal.querySelector('#tm-phrases-import-file'),
            summary: modal.querySelector('#tm-saved-phrases-summary'),
            feedback: modal.querySelector('#tm-feedback')
        };
    }

    function syncSavedPhrasesConfigHeader(elements) {
        if (elements.phrasesCount instanceof HTMLElement) {
            elements.phrasesCount.textContent = formatSavedPhrasesCountLabel();
        }

        if (elements.summary instanceof HTMLElement) {
            elements.summary.textContent = formatSavedPhrasesSummaryLabel();
        }
    }

    function createSavedPhraseKeywordChip(keyword) {
        const chip = document.createElement('span');
        chip.textContent = keyword;
        chip.style.display = 'inline-flex';
        chip.style.alignItems = 'center';
        chip.style.padding = '4px 8px';
        chip.style.borderRadius = '999px';
        chip.style.background = 'rgba(124,58,237,0.18)';
        chip.style.border = '1px solid rgba(139,92,246,0.22)';
        chip.style.color = '#ddd6fe';
        chip.style.fontSize = '11px';
        chip.style.lineHeight = '1.2';
        return chip;
    }

    /**
     * Regroupe l'état local et les actions de la modale de gestion complète des réponses rapides.
     *
     * @param {HTMLElement} modal
     * @param {Object.<string, Element|null>} elements
     * @returns {Object}
     */
    function createSavedPhrasesConfigController(modal, elements) {
        const controller = {
            editingPhraseIndex: null,
            setFeedback(message, isError = false) {
                setModalFeedback(elements.feedback, message, isError);
            },
            syncHeader() {
                syncSavedPhrasesConfigHeader(elements);
            },
            refreshList() {
                refreshSavedPhrasesConfigList(modal, elements, controller);
            },
            stopEditing(refresh = true) {
                controller.editingPhraseIndex = null;

                if (refresh) {
                    controller.refreshList();
                }
            },
            startEditing(index) {
                controller.editingPhraseIndex = index;
                controller.refreshList();

                window.requestAnimationFrame(() => {
                    const editTextarea = modal.querySelector(`[data-tm-saved-phrase-edit-input="${index}"]`);
                    if (editTextarea instanceof HTMLTextAreaElement) {
                        editTextarea.focus();
                        editTextarea.setSelectionRange(editTextarea.value.length, editTextarea.value.length);
                    }
                });
            },
            handleRemoval(index) {
                const result = removeSavedPhraseAt(index);
                controller.setFeedback(result.message, !result.ok);

                if (controller.editingPhraseIndex !== null) {
                    if (controller.editingPhraseIndex === index) {
                        controller.editingPhraseIndex = null;
                    } else if (index < controller.editingPhraseIndex) {
                        controller.editingPhraseIndex -= 1;
                    }
                }

                controller.refreshList();
            }
        };

        return controller;
    }

    function createSavedPhraseEditRow(controller, index, phrase) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'flex-start';
        row.style.gap = '10px';
        row.style.padding = '12px';
        row.style.borderRadius = '12px';
        row.style.background = 'rgba(59,130,246,0.08)';
        row.style.border = '1px solid rgba(59,130,246,0.16)';

        const content = document.createElement('div');
        content.style.flex = '1';
        content.style.minWidth = '0';

        const editText = document.createElement('textarea');
        editText.value = phrase.text;
        editText.rows = 4;
        editText.maxLength = MAX_SAVED_PHRASE_LENGTH;
        editText.setAttribute('data-tm-saved-phrase-edit-input', String(index));
        editText.style.width = '100%';
        editText.style.minHeight = '96px';
        editText.style.resize = 'vertical';
        editText.style.background = '#18181b';
        editText.style.color = '#fff';
        editText.style.border = '1px solid rgba(255,255,255,0.10)';
        editText.style.borderRadius = '10px';
        editText.style.padding = '10px 12px';
        editText.style.outline = 'none';
        editText.style.lineHeight = '1.45';

        const editLength = document.createElement('div');
        editLength.style.marginTop = '8px';
        editLength.style.fontSize = '11px';
        editLength.style.textAlign = 'right';

        const editKeywordsLabel = document.createElement('label');
        editKeywordsLabel.textContent = 'Mots-clés';
        editKeywordsLabel.style.display = 'block';
        editKeywordsLabel.style.fontSize = '12px';
        editKeywordsLabel.style.color = '#d4d4d8';
        editKeywordsLabel.style.margin = '12px 0 6px';

        const editKeywordsInput = document.createElement('input');
        editKeywordsInput.type = 'text';
        editKeywordsInput.value = formatSavedPhraseKeywordsInputValue(phrase.keywords);
        editKeywordsInput.placeholder = 'ratio, reseed, merci, lien';
        editKeywordsInput.style.width = '100%';
        editKeywordsInput.style.background = '#18181b';
        editKeywordsInput.style.color = '#fff';
        editKeywordsInput.style.border = '1px solid rgba(255,255,255,0.10)';
        editKeywordsInput.style.borderRadius = '10px';
        editKeywordsInput.style.padding = '10px 12px';
        editKeywordsInput.style.outline = 'none';

        const editHint = document.createElement('div');
        editHint.textContent = 'Modifie le texte ou les mots-clés, puis enregistre.';
        editHint.style.marginTop = '8px';
        editHint.style.fontSize = '11px';
        editHint.style.color = '#71717a';
        editHint.style.lineHeight = '1.45';

        const editActions = document.createElement('div');
        editActions.style.display = 'flex';
        editActions.style.justifyContent = 'flex-end';
        editActions.style.gap = '8px';
        editActions.style.flexWrap = 'wrap';
        editActions.style.marginTop = '12px';

        const cancelEditBtn = document.createElement('button');
        cancelEditBtn.type = 'button';
        cancelEditBtn.textContent = 'Annuler';
        cancelEditBtn.style.border = 'none';
        cancelEditBtn.style.background = '#3f3f46';
        cancelEditBtn.style.color = '#fff';
        cancelEditBtn.style.borderRadius = '10px';
        cancelEditBtn.style.padding = '8px 10px';
        cancelEditBtn.style.cursor = 'pointer';
        cancelEditBtn.style.fontSize = '12px';
        cancelEditBtn.style.fontWeight = '600';

        const saveEditBtn = document.createElement('button');
        saveEditBtn.type = 'button';
        saveEditBtn.textContent = 'Enregistrer';
        saveEditBtn.style.border = 'none';
        saveEditBtn.style.background = '#2563eb';
        saveEditBtn.style.color = '#fff';
        saveEditBtn.style.borderRadius = '10px';
        saveEditBtn.style.padding = '8px 10px';
        saveEditBtn.style.cursor = 'pointer';
        saveEditBtn.style.fontSize = '12px';
        saveEditBtn.style.fontWeight = '600';

        function submitSavedPhraseEdition() {
            const result = updateSavedPhraseAt(index, editText.value, editKeywordsInput.value);
            controller.setFeedback(result.message, !result.ok);

            if (!result.ok) return;

            controller.stopEditing();
        }

        cancelEditBtn.addEventListener('click', () => {
            controller.stopEditing();
        });
        saveEditBtn.addEventListener('click', submitSavedPhraseEdition);
        editText.addEventListener('input', () => {
            syncSavedPhraseLengthIndicator(editText, editLength);
        });
        editText.addEventListener('keydown', (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                event.preventDefault();
                submitSavedPhraseEdition();
            }
        });
        editKeywordsInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                submitSavedPhraseEdition();
            }
        });

        syncSavedPhraseLengthIndicator(editText, editLength);

        editActions.appendChild(cancelEditBtn);
        editActions.appendChild(saveEditBtn);

        content.appendChild(editText);
        content.appendChild(editLength);
        content.appendChild(editKeywordsLabel);
        content.appendChild(editKeywordsInput);
        content.appendChild(editHint);
        content.appendChild(editActions);

        row.appendChild(content);
        return row;
    }

    function createSavedPhraseDisplayRow(controller, index, phrase) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'flex-start';
        row.style.gap = '10px';
        row.style.padding = '12px';
        row.style.borderRadius = '12px';
        row.style.background = 'rgba(59,130,246,0.08)';
        row.style.border = '1px solid rgba(59,130,246,0.16)';

        const content = document.createElement('div');
        content.style.flex = '1';
        content.style.minWidth = '0';

        const text = document.createElement('div');
        text.textContent = phrase.text;
        text.style.fontSize = '12px';
        text.style.lineHeight = '1.5';
        text.style.color = '#e4e4e7';
        text.style.whiteSpace = 'pre-wrap';
        text.style.wordBreak = 'break-word';

        const meta = document.createElement('div');
        meta.style.display = 'flex';
        meta.style.justifyContent = 'space-between';
        meta.style.alignItems = 'center';
        meta.style.gap = '10px';
        meta.style.flexWrap = 'wrap';
        meta.style.marginTop = '8px';

        const keywordsLabel = document.createElement('div');
        keywordsLabel.textContent = phrase.keywords.length > 0 ? 'Mots-clés liés' : 'Aucun mot-clé';
        keywordsLabel.style.fontSize = '11px';
        keywordsLabel.style.color = phrase.keywords.length > 0 ? '#c4b5fd' : '#71717a';

        const length = document.createElement('div');
        length.textContent = formatSavedPhraseLengthLabel(phrase.text);
        length.style.fontSize = '11px';
        length.style.color = '#71717a';

        meta.appendChild(keywordsLabel);
        meta.appendChild(length);

        content.appendChild(text);
        content.appendChild(meta);

        if (phrase.keywords.length > 0) {
            const keywordsWrap = document.createElement('div');
            keywordsWrap.style.display = 'flex';
            keywordsWrap.style.flexWrap = 'wrap';
            keywordsWrap.style.gap = '6px';
            keywordsWrap.style.marginTop = '8px';

            phrase.keywords.forEach((keyword) => {
                keywordsWrap.appendChild(createSavedPhraseKeywordChip(keyword));
            });

            content.appendChild(keywordsWrap);
        }

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.flexDirection = 'column';
        actions.style.gap = '8px';
        actions.style.flexShrink = '0';

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.textContent = '✎';
        editBtn.title = 'Modifier cette réponse rapide';
        editBtn.setAttribute('aria-label', 'Modifier cette réponse rapide');
        editBtn.style.border = 'none';
        editBtn.style.background = '#1f2937';
        editBtn.style.color = '#c4b5fd';
        editBtn.style.borderRadius = '10px';
        editBtn.style.padding = '8px 10px';
        editBtn.style.cursor = 'pointer';
        editBtn.style.fontSize = '14px';
        editBtn.style.fontWeight = '700';
        editBtn.style.lineHeight = '1';

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = 'Supprimer';
        removeBtn.style.border = 'none';
        removeBtn.style.background = '#3f3f46';
        removeBtn.style.color = '#fca5a5';
        removeBtn.style.borderRadius = '10px';
        removeBtn.style.padding = '8px 10px';
        removeBtn.style.cursor = 'pointer';
        removeBtn.style.fontSize = '12px';
        removeBtn.style.fontWeight = '600';
        removeBtn.style.flexShrink = '0';

        editBtn.addEventListener('click', () => {
            controller.startEditing(index);
        });
        removeBtn.addEventListener('click', () => {
            controller.handleRemoval(index);
        });

        actions.appendChild(editBtn);
        actions.appendChild(removeBtn);

        row.appendChild(content);
        row.appendChild(actions);
        return row;
    }

    function refreshSavedPhrasesConfigList(modal, elements, controller) {
        if (!(elements.phrasesList instanceof HTMLElement)) return;

        elements.phrasesList.innerHTML = '';
        controller.syncHeader();

        if (controller.editingPhraseIndex !== null
            && (controller.editingPhraseIndex < 0 || controller.editingPhraseIndex >= savedPhrases.length)) {
            controller.editingPhraseIndex = null;
        }

        if (savedPhrases.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = 'Aucune réponse rapide enregistrée pour le moment.';
            empty.style.fontSize = '12px';
            empty.style.color = '#a1a1aa';
            empty.style.padding = '6px 2px';
            elements.phrasesList.appendChild(empty);
            return;
        }

        savedPhrases.forEach((entry, index) => {
            const phrase = normalizeSavedPhraseRecord(entry, true);
            if (!phrase) return;
            if (phrase !== entry) {
                savedPhrases[index] = phrase;
            }

            const row = controller.editingPhraseIndex === index
                ? createSavedPhraseEditRow(controller, index, phrase)
                : createSavedPhraseDisplayRow(controller, index, phrase);

            elements.phrasesList.appendChild(row);
        });
    }

    function submitSavedPhrasesConfigCreation(elements, controller) {
        const result = addSavedPhrase(elements.phraseInput?.value, elements.phraseKeywordsInput?.value);
        controller.setFeedback(result.message, !result.ok);

        if (!result.ok) return;

        controller.refreshList();

        if (elements.phraseInput instanceof HTMLTextAreaElement) {
            elements.phraseInput.value = '';
            elements.phraseInput.focus();
        }

        if (elements.phraseKeywordsInput instanceof HTMLInputElement) {
            elements.phraseKeywordsInput.value = '';
        }

        syncSavedPhraseLengthIndicator(elements.phraseInput, elements.phraseLength);
    }

    async function handleSavedPhrasesConfigImport(elements, controller) {
        const selectedFile = elements.phrasesImportFileInput instanceof HTMLInputElement
            ? elements.phrasesImportFileInput.files?.[0]
            : null;

        if (!selectedFile) return;

        try {
            const rawContent = await selectedFile.text();
            const parsedContent = JSON.parse(rawContent);
            const result = importSavedPhrases(parsedContent);

            controller.setFeedback(result.message, !result.ok);
            if (result.ok) {
                controller.refreshList();
            }
        } catch (e) {
            controller.setFeedback('Import impossible : fichier JSON invalide.', true);
        } finally {
            if (elements.phrasesImportFileInput instanceof HTMLInputElement) {
                elements.phrasesImportFileInput.value = '';
            }
        }
    }

    function bindSavedPhrasesConfigModalEvents(modal, overlay, elements, controller) {
        elements.closeBtn?.addEventListener('click', closeSettingsModal);
        overlay.addEventListener('click', closeSettingsModal);

        elements.backBtn?.addEventListener('click', () => {
            closeSettingsModal();
            openSettingsModal();
        });

        elements.phraseAddBtn?.addEventListener('click', () => {
            submitSavedPhrasesConfigCreation(elements, controller);
        });

        elements.phraseInput?.addEventListener('input', () => {
            syncSavedPhraseLengthIndicator(elements.phraseInput, elements.phraseLength);
        });
        elements.phraseInput?.addEventListener('keydown', (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                event.preventDefault();
                elements.phraseAddBtn?.click();
            }
        });
        elements.phraseKeywordsInput?.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                elements.phraseAddBtn?.click();
            }
        });

        elements.phrasesExportBtn?.addEventListener('click', () => {
            const result = downloadSavedPhrasesExport();
            controller.setFeedback(result.message, !result.ok);
        });
        elements.phrasesImportBtn?.addEventListener('click', () => {
            elements.phrasesImportFileInput?.click();
        });
        elements.phrasesImportFileInput?.addEventListener('change', async () => {
            await handleSavedPhrasesConfigImport(elements, controller);
        });

        modal.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeSettingsModal();
            }
        });
    }

    function initializeSavedPhrasesConfigModal(elements, controller) {
        controller.refreshList();
        syncSavedPhraseLengthIndicator(elements.phraseInput, elements.phraseLength);
        elements.phraseInput?.focus();
    }

    function buildSavedPhraseQuickAddModalHtml(normalizedInitialText) {
        return `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px;">
            <div>
                <div style="font-size:16px;font-weight:700;">Ajouter une réponse rapide</div>
                <div style="font-size:12px;color:#a1a1aa;margin-top:4px;">
                    Le texte actuel du champ de chat a été repris ici pour gagner du temps.
                </div>
            </div>
            <button id="tm-close-modal" style="
                border:none;
                background:#27272a;
                color:#fff;
                width:34px;
                height:34px;
                border-radius:10px;
                cursor:pointer;
                font-size:18px;
                line-height:1;
            ">×</button>
        </div>

        <div style="${getSavedPhrasesModalCardStyle()}">
            <label for="tm-quick-add-phrase-input" style="display:block;font-size:12px;color:#d4d4d8;margin-bottom:6px;">
                Texte de la réponse
            </label>

            <textarea id="tm-quick-add-phrase-input" rows="5" maxlength="${MAX_SAVED_PHRASE_LENGTH}" placeholder="Exemple : Salut, il me faut le lien exact du torrent pour vérifier."
                style="
                    width:100%;
                    min-height:120px;
                    resize:vertical;
                    background:#18181b;
                    color:#fff;
                    border:1px solid rgba(255,255,255,0.10);
                    border-radius:10px;
                    padding:10px 12px;
                    outline:none;
                    line-height:1.45;
                ">${escapeHtml(normalizedInitialText)}</textarea>

            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:8px;font-size:11px;color:#71717a;">
                <span>Le texte est prérempli depuis le chat, mais reste modifiable.</span>
                <span id="tm-quick-add-phrase-length">${formatSavedPhraseLengthLabel(normalizedInitialText)}</span>
            </div>

            <label for="tm-quick-add-keywords-input" style="display:block;font-size:12px;color:#d4d4d8;margin:12px 0 6px;">
                Mots-clés
            </label>

            <input id="tm-quick-add-keywords-input" type="text" placeholder="ratio, reseed, merci, lien"
                style="
                    width:100%;
                    background:#18181b;
                    color:#fff;
                    border:1px solid rgba(255,255,255,0.10);
                    border-radius:10px;
                    padding:10px 12px;
                    outline:none;
                ">

            <div style="margin-top:8px;font-size:11px;color:#71717a;line-height:1.45;">
                Optionnel. Sépare les mots-clés par des virgules pour améliorer les suggestions contextuelles.
            </div>

            <div style="display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:12px;">
                <button id="tm-quick-add-cancel" type="button" style="
                    border:none;
                    background:#3f3f46;
                    color:#fff;
                    border-radius:10px;
                    padding:10px 12px;
                    cursor:pointer;
                    font-weight:600;
                ">Annuler</button>

                <button id="tm-quick-add-save" type="button" style="
                    border:none;
                    background:#2563eb;
                    color:#fff;
                    border-radius:10px;
                    padding:10px 12px;
                    cursor:pointer;
                    font-weight:600;
                ">Enregistrer</button>
            </div>
        </div>

        <div id="tm-feedback" style="
            min-height:20px;
            margin-top:14px;
            font-size:12px;
            color:#93c5fd;
        "></div>
        `;
    }

    function getSavedPhraseQuickAddElements(modal) {
        return {
            closeBtn: modal.querySelector('#tm-close-modal'),
            cancelBtn: modal.querySelector('#tm-quick-add-cancel'),
            saveBtn: modal.querySelector('#tm-quick-add-save'),
            phraseInput: modal.querySelector('#tm-quick-add-phrase-input'),
            phraseLength: modal.querySelector('#tm-quick-add-phrase-length'),
            keywordsInput: modal.querySelector('#tm-quick-add-keywords-input'),
            feedback: modal.querySelector('#tm-feedback')
        };
    }

    /**
     * Construit le contrôleur local de la modale d'ajout rapide de réponse.
     *
     * @param {HTMLElement|null} sourceInput
     * @param {Object.<string, Element|null>} elements
     * @returns {Object}
     */
    function createSavedPhraseQuickAddController(sourceInput, elements) {
        return {
            restoreSourceInputFocus() {
                const nextInput = sourceInput instanceof HTMLElement && document.contains(sourceInput)
                    ? sourceInput
                    : getChatInput();

                if (!(nextInput instanceof HTMLElement)) return;

                window.requestAnimationFrame(() => {
                    nextInput.focus();
                });
            },
            submit() {
                const result = addSavedPhrase(elements.phraseInput?.value, elements.keywordsInput?.value);
                setModalFeedback(elements.feedback, result.message, !result.ok);

                if (!result.ok) return;

                closeSettingsModal();
                showToast(result.message);
                this.restoreSourceInputFocus();
            },
            close() {
                closeSettingsModal();
                this.restoreSourceInputFocus();
            }
        };
    }

    function bindSavedPhraseQuickAddModalEvents(modal, overlay, elements, controller) {
        elements.closeBtn?.addEventListener('click', () => {
            controller.close();
        });
        elements.cancelBtn?.addEventListener('click', () => {
            controller.close();
        });
        overlay.addEventListener('click', () => {
            controller.close();
        });

        elements.saveBtn?.addEventListener('click', () => {
            controller.submit();
        });

        elements.phraseInput?.addEventListener('input', () => {
            syncSavedPhraseLengthIndicator(elements.phraseInput, elements.phraseLength, ' caractères');
        });
        elements.phraseInput?.addEventListener('keydown', (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                event.preventDefault();
                controller.submit();
            }
        });
        elements.keywordsInput?.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                controller.submit();
            }
        });

        modal.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                controller.close();
            }
        });
    }

    function initializeSavedPhraseQuickAddModal(elements) {
        syncSavedPhraseLengthIndicator(elements.phraseInput, elements.phraseLength, ' caractères');

        if (elements.phraseInput instanceof HTMLTextAreaElement) {
            elements.phraseInput.focus();
            elements.phraseInput.setSelectionRange(elements.phraseInput.value.length, elements.phraseInput.value.length);
        }
    }

    /**
     * Ouvre la modale compacte d'ajout rapide à partir du contenu actuel du chat.
     *
     * @param {string} [initialText='']
     * @param {HTMLElement|null} [sourceInput=null]
     * @returns {void}
     */
    function openSavedPhraseQuickAddModal(initialText = '', sourceInput = null) {
        if (!isSupportedPage()) return;

        if (modalOpen) {
            closeSettingsModal();
        }

        modalOpen = true;
        hideImagePreview();

        const normalizedInitialText = normalizeSavedPhraseText(initialText, true);

        const overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '1000000';
        overlay.style.background = 'rgba(0,0,0,0.45)';

        const modal = document.createElement('div');
        modal.id = MODAL_ID;
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.zIndex = '1000001';
        modal.style.width = 'min(620px, calc(100vw - 24px))';
        modal.style.maxHeight = 'min(86vh, 720px)';
        modal.style.overflowY = 'auto';
        modal.style.background = 'rgba(24,24,27,0.98)';
        modal.style.border = '1px solid rgba(255,255,255,0.08)';
        modal.style.borderRadius = '18px';
        modal.style.boxShadow = '0 20px 50px rgba(0,0,0,0.45)';
        modal.style.padding = '18px';
        modal.style.fontFamily = 'Inter, Arial, sans-serif';
        modal.style.color = '#fff';
        applyScrollableModalStyle(modal);

        modal.innerHTML = buildSavedPhraseQuickAddModalHtml(normalizedInitialText);

        document.body.appendChild(overlay);
        document.body.appendChild(modal);

        const elements = getSavedPhraseQuickAddElements(modal);
        const controller = createSavedPhraseQuickAddController(sourceInput, elements);

        bindSavedPhraseQuickAddModalEvents(modal, overlay, elements, controller);
        initializeSavedPhraseQuickAddModal(elements);
    }

    /**
     * Ouvre la modale complète de gestion des réponses rapides.
     *
     * @returns {void}
     */
    function openSavedPhrasesConfigModal() {
        if (!isSupportedPage()) return;

        if (modalOpen) {
            closeSettingsModal();
        }

        modalOpen = true;
        hideImagePreview();

        const overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '1000000';
        overlay.style.background = 'rgba(0,0,0,0.45)';

        const modal = document.createElement('div');
        modal.id = MODAL_ID;
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.zIndex = '1000001';
        modal.style.width = 'min(720px, calc(100vw - 24px))';
        modal.style.maxHeight = 'min(88vh, 860px)';
        modal.style.overflowY = 'auto';
        modal.style.background = 'rgba(24,24,27,0.98)';
        modal.style.border = '1px solid rgba(255,255,255,0.08)';
        modal.style.borderRadius = '18px';
        modal.style.boxShadow = '0 20px 50px rgba(0,0,0,0.45)';
        modal.style.padding = '18px';
        modal.style.fontFamily = 'Inter, Arial, sans-serif';
        modal.style.color = '#fff';
        applyScrollableModalStyle(modal);

        modal.innerHTML = buildSavedPhrasesConfigModalHtml(getSavedPhrasesModalCardStyle());

        document.body.appendChild(overlay);
        document.body.appendChild(modal);

        const elements = getSavedPhrasesConfigElements(modal);
        const controller = createSavedPhrasesConfigController(modal, elements);

        bindSavedPhrasesConfigModalEvents(modal, overlay, elements, controller);
        initializeSavedPhrasesConfigModal(elements, controller);
    }

    function buildSavedPhrasesPickerModalHtml(cardStyle) {
        return `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px;">
            <div>
                <div style="font-size:16px;font-weight:700;">Toutes les réponses rapides</div>
                <div style="font-size:12px;color:#a1a1aa;margin-top:4px;">
                    ${formatSavedPhrasesCountLabel()} disponibles. Clique sur une réponse pour l’insérer dans le chat.
                </div>
            </div>
            <button id="tm-close-modal" style="
                border:none;
                background:#27272a;
                color:#fff;
                width:34px;
                height:34px;
                border-radius:10px;
                cursor:pointer;
                font-size:18px;
                line-height:1;
            ">×</button>
        </div>

        <div style="${cardStyle};margin-bottom:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
                <div style="font-size:13px;font-weight:700;">Filtrer par mot-clé</div>
                <button id="tm-saved-phrases-picker-clear" type="button" style="
                    border:none;
                    background:#3f3f46;
                    color:#fff;
                    border-radius:10px;
                    padding:8px 10px;
                    cursor:pointer;
                    font-size:12px;
                    font-weight:600;
                ">Réinitialiser</button>
            </div>
            <div id="tm-saved-phrases-picker-filter-meta" style="margin-top:8px;font-size:11px;color:#71717a;">
                Aucun filtre actif.
            </div>
            <div id="tm-saved-phrases-picker-filters" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;"></div>
        </div>

        <div style="${cardStyle}">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:10px;">
                <div style="font-size:13px;font-weight:700;">Réponses disponibles</div>
                <div id="tm-saved-phrases-picker-count" style="font-size:12px;color:#a1a1aa;"></div>
            </div>
            <div id="tm-saved-phrases-picker-list" style="display:grid;gap:10px;"></div>
        </div>

        <div id="tm-feedback" style="
            min-height:20px;
            margin-top:14px;
            font-size:12px;
            color:#93c5fd;
        "></div>
        `;
    }

    function getSavedPhrasesPickerElements(modal) {
        return {
            closeBtn: modal.querySelector('#tm-close-modal'),
            clearFiltersBtn: modal.querySelector('#tm-saved-phrases-picker-clear'),
            feedback: modal.querySelector('#tm-feedback'),
            pickerCount: modal.querySelector('#tm-saved-phrases-picker-count'),
            filtersWrap: modal.querySelector('#tm-saved-phrases-picker-filters'),
            filterMeta: modal.querySelector('#tm-saved-phrases-picker-filter-meta'),
            pickerList: modal.querySelector('#tm-saved-phrases-picker-list')
        };
    }

    function normalizeSavedPhraseKeywordFilterKey(keyword) {
        return normalizeSavedPhraseText(keyword).toLocaleLowerCase('fr');
    }

    function createSavedPhrasePickerChip(keyword, isSelected = false, onClick = null) {
        const chip = document.createElement(onClick ? 'button' : 'span');
        chip.textContent = keyword;
        chip.style.display = 'inline-flex';
        chip.style.alignItems = 'center';
        chip.style.padding = '4px 8px';
        chip.style.borderRadius = '999px';
        chip.style.background = isSelected ? 'rgba(139,92,246,0.32)' : 'rgba(124,58,237,0.18)';
        chip.style.border = isSelected ? '1px solid rgba(167,139,250,0.45)' : '1px solid rgba(139,92,246,0.22)';
        chip.style.color = isSelected ? '#ffffff' : '#ddd6fe';
        chip.style.fontSize = '11px';
        chip.style.lineHeight = '1.2';

        if (onClick) {
            chip.type = 'button';
            chip.style.cursor = 'pointer';
            chip.style.transition = 'all 0.15s ease';
            chip.addEventListener('click', onClick);
        }

        return chip;
    }

    /**
     * Maintient l'état local du picker complet des réponses rapides et de ses filtres.
     *
     * @param {Object.<string, Element|null>} elements
     * @returns {Object}
     */
    function createSavedPhrasesPickerController(elements) {
        const controller = {
            activeKeywordFilters: new Set(),
            setFeedback(message, isError = false) {
                setModalFeedback(elements.feedback, message, isError);
            },
            getRankedEntries() {
                return getRankedSavedPhrases().map((entry) => ({
                    ...entry,
                    matchPercent: computeSavedPhraseMatchPercent(entry.score)
                }));
            },
            phraseMatchesActiveFilters(entry) {
                if (controller.activeKeywordFilters.size === 0) return true;

                const phraseKeywordKeys = new Set(
                    entry.phrase.keywords
                        .map((keyword) => normalizeSavedPhraseKeywordFilterKey(keyword))
                        .filter(Boolean)
                );

                for (const activeFilter of controller.activeKeywordFilters) {
                    if (!phraseKeywordKeys.has(activeFilter)) {
                        return false;
                    }
                }

                return true;
            },
            toggleKeywordFilter(keyword) {
                const keywordKey = normalizeSavedPhraseKeywordFilterKey(keyword);
                if (!keywordKey) return;

                if (controller.activeKeywordFilters.has(keywordKey)) {
                    controller.activeKeywordFilters.delete(keywordKey);
                } else {
                    controller.activeKeywordFilters.add(keywordKey);
                }

                controller.refreshFilters();
                controller.refreshList();
            },
            clearFilters() {
                if (controller.activeKeywordFilters.size === 0) return;
                controller.activeKeywordFilters.clear();
                controller.refreshFilters();
                controller.refreshList();
            },
            refreshFilters() {
                refreshSavedPhrasesPickerFilters(elements, controller);
            },
            refreshList() {
                refreshSavedPhrasesPickerList(elements, controller);
            }
        };

        return controller;
    }

    function buildSavedPhrasePickerFilterChip(controller, keyword) {
        const keywordKey = normalizeSavedPhraseKeywordFilterKey(keyword);
        return createSavedPhrasePickerChip(
            keyword,
            controller.activeKeywordFilters.has(keywordKey),
            (event) => {
                event.preventDefault();
                event.stopPropagation();
                controller.toggleKeywordFilter(keyword);
            }
        );
    }

    function refreshSavedPhrasesPickerFilters(elements, controller) {
        if (!(elements.filtersWrap instanceof HTMLElement)
            || !(elements.filterMeta instanceof HTMLElement)
            || !(elements.clearFiltersBtn instanceof HTMLButtonElement)) {
            return;
        }

        const entries = controller.getRankedEntries();
        const availableKeywords = [];
        const seenKeywordKeys = new Set();

        entries.forEach((entry) => {
            entry.phrase.keywords.forEach((keyword) => {
                const keywordKey = normalizeSavedPhraseKeywordFilterKey(keyword);
                if (!keywordKey || seenKeywordKeys.has(keywordKey)) return;

                seenKeywordKeys.add(keywordKey);
                availableKeywords.push(keyword);
            });
        });

        availableKeywords.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
        elements.filtersWrap.innerHTML = '';

        if (availableKeywords.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = 'Aucun mot-clé enregistré pour le moment.';
            empty.style.fontSize = '12px';
            empty.style.color = '#a1a1aa';
            elements.filtersWrap.appendChild(empty);
        } else {
            availableKeywords.forEach((keyword) => {
                elements.filtersWrap.appendChild(buildSavedPhrasePickerFilterChip(controller, keyword));
            });
        }

        elements.clearFiltersBtn.disabled = controller.activeKeywordFilters.size === 0;
        elements.clearFiltersBtn.style.opacity = controller.activeKeywordFilters.size === 0 ? '0.55' : '1';
        elements.clearFiltersBtn.style.cursor = controller.activeKeywordFilters.size === 0 ? 'not-allowed' : 'pointer';

        if (controller.activeKeywordFilters.size === 0) {
            elements.filterMeta.textContent = 'Aucun filtre actif.';
            return;
        }

        elements.filterMeta.textContent = `${controller.activeKeywordFilters.size} filtre${controller.activeKeywordFilters.size > 1 ? 's' : ''} actif${controller.activeKeywordFilters.size > 1 ? 's' : ''}. Clique à nouveau sur un mot-clé pour le retirer.`;
    }

    function createSavedPhrasePickerRow(controller, entry, contextualSortingActive) {
        const phrase = entry.phrase;
        const previewText = truncateSavedPhrasePreviewText(phrase.text);
        const row = document.createElement('div');
        row.title = buildSavedPhrasesMenuItemTitle(entry, contextualSortingActive);
        row.style.width = '100%';
        row.style.textAlign = 'left';
        row.style.padding = '12px';
        row.style.borderRadius = '12px';
        row.style.background = 'rgba(59,130,246,0.08)';
        row.style.border = '1px solid rgba(59,130,246,0.16)';
        row.style.cursor = 'pointer';
        row.style.transition = 'background 0.15s ease, border-color 0.15s ease';
        row.tabIndex = 0;
        row.setAttribute('role', 'button');

        row.addEventListener('mouseenter', () => {
            row.style.background = 'rgba(99,102,241,0.15)';
            row.style.borderColor = 'rgba(129,140,248,0.32)';
        });
        row.addEventListener('mouseleave', () => {
            row.style.background = 'rgba(59,130,246,0.08)';
            row.style.borderColor = 'rgba(59,130,246,0.16)';
        });

        function insertPhrase() {
            const input = getChatInput();
            const result = insertSavedPhraseIntoChatInput(input, phrase.text);

            if (!result.ok) {
                controller.setFeedback(result.message, true);
                return;
            }

            closeSettingsModal();
        }

        row.addEventListener('click', insertPhrase);
        row.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                insertPhrase();
            }
        });

        const textRow = document.createElement('div');
        textRow.style.display = 'flex';
        textRow.style.alignItems = 'flex-start';
        textRow.style.gap = '8px';

        if (contextualSortingActive && entry.matchPercent > 0) {
            const percentBadge = document.createElement('span');
            percentBadge.textContent = `${entry.matchPercent}%`;
            percentBadge.title = 'Taux de correspondance estimé';
            percentBadge.style.display = 'inline-flex';
            percentBadge.style.alignItems = 'center';
            percentBadge.style.justifyContent = 'center';
            percentBadge.style.padding = '3px 7px';
            percentBadge.style.borderRadius = '999px';
            percentBadge.style.background = 'rgba(34,197,94,0.18)';
            percentBadge.style.border = '1px solid rgba(74,222,128,0.28)';
            percentBadge.style.color = '#bbf7d0';
            percentBadge.style.fontSize = '10px';
            percentBadge.style.fontWeight = '700';
            percentBadge.style.flexShrink = '0';
            percentBadge.style.marginTop = '1px';
            textRow.appendChild(percentBadge);
        }

        const text = document.createElement('div');
        text.textContent = previewText;
        text.style.fontSize = '12px';
        text.style.lineHeight = '1.5';
        text.style.color = '#e4e4e7';
        text.style.whiteSpace = 'pre-wrap';
        text.style.wordBreak = 'break-word';
        text.style.flex = '1';
        text.style.minWidth = '0';

        const meta = document.createElement('div');
        meta.style.display = 'flex';
        meta.style.justifyContent = 'space-between';
        meta.style.alignItems = 'center';
        meta.style.gap = '10px';
        meta.style.flexWrap = 'wrap';
        meta.style.marginTop = '8px';

        const keywordsLabel = document.createElement('div');
        keywordsLabel.textContent = phrase.keywords.length > 0 ? 'Mots-clés liés' : 'Aucun mot-clé';
        keywordsLabel.style.fontSize = '11px';
        keywordsLabel.style.color = phrase.keywords.length > 0 ? '#c4b5fd' : '#71717a';

        const length = document.createElement('div');
        length.textContent = formatSavedPhraseLengthLabel(phrase.text);
        length.style.fontSize = '11px';
        length.style.color = '#71717a';

        const metaLeft = document.createElement('div');
        metaLeft.style.display = 'flex';
        metaLeft.style.alignItems = 'center';
        metaLeft.style.gap = '8px';
        metaLeft.style.flexWrap = 'wrap';
        metaLeft.appendChild(keywordsLabel);

        meta.appendChild(metaLeft);
        meta.appendChild(length);

        textRow.appendChild(text);
        row.appendChild(textRow);
        row.appendChild(meta);

        if (phrase.keywords.length > 0) {
            const keywordsWrap = document.createElement('div');
            keywordsWrap.style.display = 'flex';
            keywordsWrap.style.flexWrap = 'wrap';
            keywordsWrap.style.gap = '6px';
            keywordsWrap.style.marginTop = '8px';

            phrase.keywords.forEach((keyword) => {
                keywordsWrap.appendChild(buildSavedPhrasePickerFilterChip(controller, keyword));
            });

            row.appendChild(keywordsWrap);
        }

        return row;
    }

    function refreshSavedPhrasesPickerList(elements, controller) {
        if (!(elements.pickerList instanceof HTMLElement) || !(elements.pickerCount instanceof HTMLElement)) return;

        const entries = controller.getRankedEntries();
        const filteredEntries = entries.filter((entry) => controller.phraseMatchesActiveFilters(entry));
        const contextualSortingActive = entries.length > 0 && entries[0].score > 0;

        elements.pickerList.innerHTML = '';
        elements.pickerCount.textContent = contextualSortingActive
            ? `${filteredEntries.length}/${entries.length} affichée${filteredEntries.length > 1 ? 's' : ''} · tri contextuel actif`
            : `${filteredEntries.length}/${entries.length} affichée${filteredEntries.length > 1 ? 's' : ''}`;

        if (entries.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = 'Aucune réponse rapide enregistrée pour le moment.';
            empty.style.fontSize = '12px';
            empty.style.color = '#a1a1aa';
            empty.style.padding = '6px 2px';
            elements.pickerList.appendChild(empty);
            return;
        }

        if (filteredEntries.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = 'Aucune réponse ne correspond aux mots-clés sélectionnés.';
            empty.style.fontSize = '12px';
            empty.style.color = '#a1a1aa';
            empty.style.padding = '6px 2px';
            elements.pickerList.appendChild(empty);
            return;
        }

        filteredEntries.forEach((entry) => {
            elements.pickerList.appendChild(createSavedPhrasePickerRow(controller, entry, contextualSortingActive));
        });
    }

    function bindSavedPhrasesPickerModalEvents(modal, overlay, elements, controller) {
        elements.closeBtn?.addEventListener('click', closeSettingsModal);
        overlay.addEventListener('click', closeSettingsModal);
        elements.clearFiltersBtn?.addEventListener('click', () => {
            controller.clearFilters();
        });

        modal.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeSettingsModal();
            }
        });
    }

    function initializeSavedPhrasesPickerModal(elements, controller) {
        controller.refreshFilters();
        controller.refreshList();
    }

    /**
     * Ouvre le picker complet des réponses rapides avec filtres par mots-clés.
     *
     * @returns {void}
     */
    function openSavedPhrasesPickerModal() {
        if (!isSupportedPage()) return;
        if (savedPhrases.length === 0) return;

        if (modalOpen) {
            closeSettingsModal();
        }

        modalOpen = true;
        hideImagePreview();

        const overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '1000000';
        overlay.style.background = 'rgba(0,0,0,0.45)';

        const modal = document.createElement('div');
        modal.id = MODAL_ID;
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.zIndex = '1000001';
        modal.style.width = 'min(760px, calc(100vw - 24px))';
        modal.style.maxHeight = 'min(88vh, 860px)';
        modal.style.overflowY = 'auto';
        modal.style.background = 'rgba(24,24,27,0.98)';
        modal.style.border = '1px solid rgba(255,255,255,0.08)';
        modal.style.borderRadius = '18px';
        modal.style.boxShadow = '0 20px 50px rgba(0,0,0,0.45)';
        modal.style.padding = '18px';
        modal.style.fontFamily = 'Inter, Arial, sans-serif';
        modal.style.color = '#fff';
        applyScrollableModalStyle(modal);

        modal.innerHTML = buildSavedPhrasesPickerModalHtml(getSavedPhrasesModalCardStyle());

        document.body.appendChild(overlay);
        document.body.appendChild(modal);

        const elements = getSavedPhrasesPickerElements(modal);
        const controller = createSavedPhrasesPickerController(elements);

        bindSavedPhrasesPickerModalEvents(modal, overlay, elements, controller);
        initializeSavedPhrasesPickerModal(elements, controller);
    }

    function setStatsDisplayMode(nextMode) {
        const normalizedMode = normalizeStatsDisplayMode(nextMode);
        if (statsDisplayMode === normalizedMode) return;

        saveStatsDisplayMode(normalizedMode);
        applyStatsBoxDisplayModeState();
        constrainStatsBoxToViewport(true, false);
        updateStatsBox();

        if (statsDisplayMode === STATS_DISPLAY_MODE_MINI) {
            showToast('Stats box minimisée.');
            return;
        }

        if (statsDisplayMode === STATS_DISPLAY_MODE_COMPACT) {
            showToast('Stats box réduite.');
            return;
        }

        showToast('Stats box développée.');
    }

    function handleStatsBoxActionClick(event) {
        const target = event.target;
        if (!(target instanceof Element)) return;

        const actionEl = target.closest('[data-tm-action]');
        if (!actionEl) return;
        if (!actionEl.closest(`#${PANEL_ID}`)) return;

        const action = actionEl.getAttribute('data-tm-action');

        if (action === 'set-stats-display-expanded') {
            event.preventDefault();
            event.stopPropagation();
            setStatsDisplayMode(STATS_DISPLAY_MODE_EXPANDED);
            return;
        }

        if (action === 'set-stats-display-compact') {
            event.preventDefault();
            event.stopPropagation();
            setStatsDisplayMode(STATS_DISPLAY_MODE_COMPACT);
            return;
        }

        if (action === 'set-stats-display-mini') {
            event.preventDefault();
            event.stopPropagation();
            setStatsDisplayMode(STATS_DISPLAY_MODE_MINI);
            return;
        }

        if (action === 'open-settings') {
            event.preventDefault();
            event.stopPropagation();
            openSettingsModal();
            return;
        }

    }

    /**
     * Ouvre la modale principale de configuration du script.
     *
     * @returns {void}
     */
    function openSettingsModal() {
        if (!isSupportedPage()) return;
        if (modalOpen) return;

        modalOpen = true;
        hideImagePreview();

        const currentPageLabel = getCurrentPageLabel();
        const homeView = isHomePage();
        const isChatView = isChatPage();
        const settingsColumnCount = window.innerWidth >= 780 ? 2 : 1;
        const styles = getSettingsModalStyles(settingsColumnCount);

        const overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '1000000';
        overlay.style.background = 'rgba(0,0,0,0.45)';

        const modal = document.createElement('div');
        modal.id = MODAL_ID;
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.zIndex = '1000001';
        modal.style.width = 'min(860px, calc(100vw - 24px))';
        modal.style.maxHeight = 'min(88vh, 900px)';
        modal.style.overflowY = 'auto';
        modal.style.background = 'rgba(24,24,27,0.98)';
        modal.style.border = '1px solid rgba(255,255,255,0.08)';
        modal.style.borderRadius = '18px';
        modal.style.boxShadow = '0 20px 50px rgba(0,0,0,0.45)';
        modal.style.padding = '18px';
        modal.style.fontFamily = 'Inter, Arial, sans-serif';
        modal.style.color = '#fff';
        applyScrollableModalStyle(modal);

        modal.innerHTML = buildSettingsModalHtml(currentPageLabel, homeView, isChatView, styles);

        document.body.appendChild(overlay);
        document.body.appendChild(modal);
        const elements = getSettingsModalElements(modal);
        const controls = createSettingsModalController(elements);
        bindSettingsModalEvents(modal, overlay, elements, controls, currentPageLabel);
        initializeSettingsModal(elements, controls);
    }

    function isScriptUiElement(element) {
        if (!(element instanceof Element)) return true;

        return !!element.closest(
            [
                `#${PANEL_ID}`,
                `#${AFK_PANEL_ID}`,
                `#${MODAL_ID}`,
                `#${OVERLAY_ID}`,
                `#${IMAGE_VIEWER_MODAL_ID}`,
                `#${IMAGE_VIEWER_OVERLAY_ID}`,
                `#${TOAST_ID}`,
                `#${PHRASES_MENU_WRAPPER_ID}`,
                `#${GIF_MENU_WRAPPER_ID}`,
                `#${IMAGE_UPLOAD_MENU_WRAPPER_ID}`
            ].join(', ')
        );
    }

    function isChatInputCandidate(element) {
        if (!(element instanceof HTMLElement)) return false;
        if (isScriptUiElement(element)) return false;
        if (element.getAttribute('aria-hidden') === 'true') return false;

        if (element instanceof HTMLInputElement) {
            if (String(element.type || '').toLowerCase() !== 'text') return false;
            if (element.disabled) return false;
        }

        if (element instanceof HTMLTextAreaElement && element.disabled) {
            return false;
        }

        return true;
    }

    function getChatInputCandidateLabel(element) {
        if (!(element instanceof HTMLElement)) return '';

        return normalizeMentionComparableText(
            [
                element.getAttribute('placeholder'),
                element.getAttribute('aria-label'),
                element.getAttribute('title'),
                element.getAttribute('name')
            ]
                .filter(Boolean)
                .join(' ')
        );
    }

    function isNativeChatInputSendButton(button) {
        if (!(button instanceof HTMLButtonElement)) return false;

        const label = getNativeChatInputActionLabel(button);
        const className = String(button.getAttribute('class') || '');

        return (
            /\b(envoyer|send)\b/.test(label) ||
            className.includes('bg-cyan-500/10') ||
            className.includes('text-cyan-400')
        );
    }

    function looksLikeNativeChatInputUtilityButton(button) {
        if (!(button instanceof HTMLButtonElement)) return false;

        const className = String(button.getAttribute('class') || '');
        return (
            className.includes('bg-zinc-900') &&
            className.includes('border-zinc-800') &&
            className.includes('rounded-lg') &&
            className.includes('text-gray-400')
        );
    }

    function getChatInputCandidateScore(element) {
        if (!(element instanceof HTMLElement)) return Number.NEGATIVE_INFINITY;

        let score = 0;
        const label = getChatInputCandidateLabel(element);
        if (isTr4kerPage() && element.matches(TR4KER_CHAT_INPUT_SELECTOR)) {
            score += 1000;
        }
        const controlsRow = getChatInputControlsRow(element);

        if (/\b(message|messages|ecrire|écrire|repondre|répondre|chat|shout)\b/.test(label)) {
            score += 160;
        }

        if (/\b(url|lien|image|gif|emoji|recherche|search|upload|joindre|galerie)\b/.test(label)) {
            score -= 140;
        }

        if (element instanceof HTMLTextAreaElement) {
            score += 40;
        }

        if (element.closest('.relative.flex-1')) {
            score += 35;
        }

        if (element.closest('form')) {
            score += 15;
        }

        if (controlsRow instanceof HTMLElement) {
            const rowButtons = Array.from(controlsRow.querySelectorAll('button[type="button"]'));

            if (rowButtons.some((button) => isNativeChatInputSendButton(button))) {
                score += 90;
            }

            if (rowButtons.some((button) => looksLikeNativeChatInputUtilityButton(button))) {
                score += 35;
            }
        }

        return score;
    }

    function findChatInputWithin(root) {
        if (!(root instanceof Element) && !(root instanceof Document)) return null;

        if (
            root instanceof HTMLElement &&
            root.matches('input[type="text"], textarea, [contenteditable="true"]') &&
            isChatInputCandidate(root)
        ) {
            return root;
        }

        const candidates = Array.from(root.querySelectorAll('input[type="text"], textarea, [contenteditable="true"]'));
        const validCandidates = candidates.filter((element) => isChatInputCandidate(element));

        return validCandidates
            .slice()
            .sort((a, b) => getChatInputCandidateScore(b) - getChatInputCandidateScore(a))[0] || null;
    }

    function getSavedPhrasesMenu() {
        const wrapper = document.getElementById(PHRASES_MENU_WRAPPER_ID);
        if (!(wrapper instanceof HTMLElement)) return null;

        const menu = wrapper.querySelector('[data-tm-saved-phrases-menu="1"]');
        return menu instanceof HTMLElement ? menu : null;
    }

    function clearSavedPhrasesMenuHideTimer(menu) {
        if (!(menu instanceof HTMLElement)) return;

        const timerId = Number(menu.dataset.tmHideTimerId || 0);
        if (timerId > 0) {
            clearTimeout(timerId);
            delete menu.dataset.tmHideTimerId;
        }
    }

    function getSavedPhrasesMenuFocusableButtons(menu) {
        if (!(menu instanceof HTMLElement)) return [];

        return Array.from(menu.querySelectorAll('button[type="button"]')).filter((button) =>
            button instanceof HTMLButtonElement &&
            button.offsetParent !== null &&
            !button.disabled
        );
    }

    function focusSavedPhrasesMenuButton(menu, index = 0) {
        const buttons = getSavedPhrasesMenuFocusableButtons(menu);
        if (buttons.length === 0) return false;

        const normalizedIndex = ((Number(index) || 0) % buttons.length + buttons.length) % buttons.length;
        menu.dataset.tmActiveIndex = String(normalizedIndex);
        buttons[normalizedIndex].focus();
        return true;
    }

    function moveSavedPhrasesMenuFocus(menu, delta) {
        const buttons = getSavedPhrasesMenuFocusableButtons(menu);
        if (buttons.length === 0) return false;

        const activeElement = document.activeElement;
        const currentIndex = buttons.findIndex((button) => button === activeElement);
        const fallbackIndex = Number(menu.dataset.tmActiveIndex || 0);
        const baseIndex = currentIndex >= 0 ? currentIndex : fallbackIndex;
        const nextIndex = ((baseIndex + delta) % buttons.length + buttons.length) % buttons.length;

        menu.dataset.tmActiveIndex = String(nextIndex);
        buttons[nextIndex].focus();
        return true;
    }

    function showSavedPhrasesMenu(menu, options = {}) {
        if (!(menu instanceof HTMLElement)) return;

        clearSavedPhrasesMenuHideTimer(menu);
        menu.style.display = 'flex';
        menu.dataset.tmOpen = '1';
        void menu.offsetWidth;
        menu.style.opacity = '1';
        menu.style.transform = 'translateY(0) scale(1)';

        if (options.focusFirstItem === true) {
            window.requestAnimationFrame(() => {
                if (menu.dataset.tmOpen !== '1') return;
                focusSavedPhrasesMenuButton(menu, 0);
            });
        }
    }

    function hideSavedPhrasesMenu(menu) {
        if (!(menu instanceof HTMLElement)) return;

        clearSavedPhrasesMenuHideTimer(menu);
        menu.dataset.tmOpen = '0';
        delete menu.dataset.tmActiveIndex;
        menu.style.opacity = '0';
        menu.style.transform = 'translateY(10px) scale(0.95)';

        const timerId = window.setTimeout(() => {
            if (menu.dataset.tmOpen === '1') return;

            menu.style.display = 'none';
            delete menu.dataset.tmHideTimerId;
        }, 200);

        menu.dataset.tmHideTimerId = String(timerId);
    }

    function closeSavedPhrasesMenu() {
        const menu = getSavedPhrasesMenu();
        if (menu) {
            hideSavedPhrasesMenu(menu);
        }
    }

    function removeSavedPhrasesToolbar() {
        const menu = getSavedPhrasesMenu();
        if (menu) {
            clearSavedPhrasesMenuHideTimer(menu);
        }

        const wrapper = document.getElementById(PHRASES_MENU_WRAPPER_ID);
        if (wrapper) {
            wrapper.remove();
        }

        syncNativeChatInputActionButtons();
        syncChatInputToolbarReservedSpace();
    }

    function installSavedPhrasesToolbarGlobalHandlers() {
        if (savedPhrasesToolbarEventsInstalled) return;

        savedPhrasesToolbarEventsInstalled = true;

        document.addEventListener('click', (event) => {
            const wrapper = document.getElementById(PHRASES_MENU_WRAPPER_ID);
            if (!(wrapper instanceof HTMLElement)) return;
            if (event.target instanceof Node && wrapper.contains(event.target)) return;

            closeSavedPhrasesMenu();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeSavedPhrasesMenu();
            }
        }, true);

        window.addEventListener('blur', () => {
            closeSavedPhrasesMenu();
        });
    }

    function openSavedPhrasesMenuFromShortcut() {
        if (!isSupportedPage()) return false;
        if (!savedPhrasesEnabled || savedPhrases.length === 0) return false;

        const textInput = getChatInput();
        if (!(textInput instanceof HTMLElement)) return false;

        injectSavedPhrasesToolbar();

        const menu = getSavedPhrasesMenu();
        if (!(menu instanceof HTMLElement)) return false;

        buildSavedPhrasesMenuContent(menu, textInput);
        closeKlipyGifMenu();
        closeImageUploadMenu();
        closeSavedPhrasesMenu();
        showSavedPhrasesMenu(menu, { focusFirstItem: true });
        return true;
    }

    function getChatInput() {
        let input = null;

        if (isTr4kerPage()) {
            input = document.querySelector(TR4KER_CHAT_INPUT_SELECTOR);
            if (input instanceof HTMLElement && isChatInputCandidate(input)) return input;
            input = null;
        }

        if (isChatPage()) {
            const header = getChatPageHeaderElement();
            if (header && header.parentElement) {
                input = findChatInputWithin(header.parentElement);
            }
            if (!input) {
                const scroller = getChatPageMessagesRoot();
                if (scroller && scroller.parentElement && scroller.parentElement.nextElementSibling) {
                    input = findChatInputWithin(scroller.parentElement.nextElementSibling);
                }
            }
        } else if (isHomePage()) {
            const homeContainer = getHomepageChatContainer();
            if (homeContainer) {
                input = findChatInputWithin(homeContainer);
            }
        }

        if (!input) {
            const darkContainers = Array.from(document.querySelectorAll('.bg-zinc-950'));
            input = darkContainers
                .map((container) => findChatInputWithin(container))
                .find(Boolean) || null;
        }

        if (!input) {
            const allInputs = Array.from(document.querySelectorAll('input[type="text"], textarea, [contenteditable="true"]'));
            const validInputs = allInputs
                .filter((element) => isChatInputCandidate(element))
                .filter((element) => !element.closest('nav, header, [role="navigation"], .navbar'));

            input = validInputs
                .slice()
                .sort((a, b) => getChatInputCandidateScore(b) - getChatInputCandidateScore(a))[0] || null;
        }

        return input;
    }

    function getChatInputToolbarMountContext(input = getChatInput()) {
        if (!(input instanceof HTMLElement)) {
            return {
                input: null,
                controlsRow: null,
                mountParent: null,
                inputWrapper: null,
                directWrapper: null,
                fallbackArea: null
            };
        }

        const controlsRow = getChatInputControlsRow(input);
        const inputWrapper = input.closest('.relative.flex-1');
        const directWrapper = input.parentElement instanceof HTMLElement ? input.parentElement : null;
        const fallbackArea = input.closest('form');
        const mountParent =
            (inputWrapper instanceof HTMLElement && inputWrapper) ||
            directWrapper ||
            (fallbackArea instanceof HTMLElement ? fallbackArea : null);

        return {
            input,
            controlsRow: controlsRow instanceof HTMLElement ? controlsRow : null,
            mountParent,
            inputWrapper: inputWrapper instanceof HTMLElement ? inputWrapper : null,
            directWrapper,
            fallbackArea: fallbackArea instanceof HTMLElement ? fallbackArea : null
        };
    }

    function ensureChatInputToolbarMountVisibility(context) {
        const mountParent = context?.mountParent;
        const controlsRow = context?.controlsRow;
        const input = context?.input;

        if (isTr4kerPage()) {
            ensureChatInputToolbarStyle();
        }

        if (
            input instanceof HTMLElement &&
            input.getAttribute(CHAT_INPUT_TOOLBAR_SYNC_BOUND_ATTR) !== '1'
        ) {
            input.setAttribute(CHAT_INPUT_TOOLBAR_SYNC_BOUND_ATTR, '1');
            input.addEventListener('input', () => {
                syncChatInputToolbarReservedSpace(input);
            });
        }

        if (chatInputToolbarInline && controlsRow instanceof HTMLElement) {
            if (!/flex/i.test(window.getComputedStyle(controlsRow).display)) {
                controlsRow.style.display = 'flex';
            }
            controlsRow.style.alignItems = 'flex-end';
            controlsRow.style.flexWrap = 'nowrap';
            controlsRow.style.gap = '8px';
            controlsRow.style.minWidth = '0';
            controlsRow.style.overflow = 'visible';
        }

        if (mountParent instanceof HTMLElement) {
            if (chatInputToolbarInline) {
                mountParent.style.flex = '1 1 auto';
                mountParent.style.minWidth = '0';
            } else {
                if (window.getComputedStyle(mountParent).position === 'static') {
                    mountParent.style.position = 'relative';
                }
            }
            mountParent.style.overflow = 'visible';
        }

        if (mountParent?.parentElement instanceof HTMLElement) {
            const computed = window.getComputedStyle(mountParent.parentElement);
            if (computed.overflow === 'hidden' || computed.overflowY === 'hidden') {
                mountParent.parentElement.style.overflow = 'visible';
            }
        }
    }

    function getChatInputToolbarRailHost(context) {
        if (chatInputToolbarInline && context?.controlsRow instanceof HTMLElement) {
            return context.controlsRow;
        }

        if (context?.mountParent instanceof HTMLElement) {
            return context.mountParent;
        }

        return null;
    }

    function getChatInputToolbarReservedHeightPx() {
        return isTr4kerPage() ? 44 : CHAT_INPUT_TOOLBAR_RESERVED_HEIGHT_PX;
    }

    function getChatInputToolbarRail(mountParent) {
        if (!(mountParent instanceof HTMLElement)) return null;

        const rail = Array.from(mountParent.children).find((child) =>
            child instanceof HTMLElement && child.getAttribute(CHAT_INPUT_TOOLBAR_RAIL_ATTR) === '1'
        );

        return rail instanceof HTMLElement ? rail : null;
    }

    function getExistingChatInputToolbarRail(context) {
        const hosts = [
            context?.controlsRow,
            context?.mountParent
        ].filter((host) => host instanceof HTMLElement);

        for (const host of hosts) {
            const rail = getChatInputToolbarRail(host);
            if (rail instanceof HTMLElement) {
                return rail;
            }
        }

        const globalRail = document.querySelector(`[${CHAT_INPUT_TOOLBAR_RAIL_ATTR}="1"]`);
        return globalRail instanceof HTMLElement ? globalRail : null;
    }

    function hasVisibleChatInputToolbar(rail) {
        if (!(rail instanceof HTMLElement)) return false;

        return Array.from(rail.children).some((child) =>
            child instanceof HTMLElement && child.style.display !== 'none'
        );
    }

    function getInlineChatInputToolbarOffset(context, rail) {
        if (!(rail instanceof HTMLElement) || !chatInputToolbarInline) return 0;

        const inputEl = context?.input instanceof HTMLElement ? context.input : null;
        const inputWrapper = context?.inputWrapper;
        const inlineInputHost =
            (inputWrapper instanceof HTMLElement && inputWrapper) ||
            (context?.directWrapper instanceof HTMLElement && context.directWrapper) ||
            (context?.mountParent instanceof HTMLElement && context.mountParent) ||
            null;
        const referenceEl = inputEl || inlineInputHost;

        if (!(referenceEl instanceof HTMLElement)) return 0;

        const referenceHeight = Math.round(referenceEl.getBoundingClientRect().height);
        const railHeight = Math.round(rail.getBoundingClientRect().height);
        if (referenceHeight <= 0 || railHeight <= 0) return 0;

        return Math.max(0, referenceHeight - railHeight);
    }

    function positionChatInputToolbarRail(context, rail) {
        if (!(rail instanceof HTMLElement)) return;

        const railHost = getChatInputToolbarRailHost(context);
        if (!(railHost instanceof HTMLElement)) return;
        const railStackZIndex = isChatPage() ? '260' : '50';

        rail.style.display = 'flex';
        rail.style.alignItems = 'center';
        rail.style.gap = '8px';
        rail.style.pointerEvents = 'none';
        rail.style.zIndex = railStackZIndex;
        rail.style.overflow = 'visible';

        const controlsRow = context?.controlsRow;
        const inputWrapper = context?.inputWrapper;
        const inlineInputHost =
            (inputWrapper instanceof HTMLElement && inputWrapper) ||
            (context?.directWrapper instanceof HTMLElement && context.directWrapper) ||
            (context?.mountParent instanceof HTMLElement && context.mountParent) ||
            null;

        if (
            chatInputToolbarInline &&
            controlsRow instanceof HTMLElement &&
            inlineInputHost instanceof HTMLElement &&
            inlineInputHost.parentElement === controlsRow
        ) {
            const inlineInputHeight = Math.max(32, Math.round(inlineInputHost.getBoundingClientRect().height));
            rail.style.position = 'relative';
            rail.style.top = 'auto';
            rail.style.bottom = '0';
            rail.style.left = 'auto';
            rail.style.right = 'auto';
            rail.style.justifyContent = 'flex-start';
            rail.style.flexWrap = 'nowrap';
            rail.style.flexShrink = '0';
            rail.style.minWidth = '0';
            rail.style.alignSelf = 'flex-end';
            rail.setAttribute(CHAT_INPUT_TOOLBAR_INLINE_ATTR, '1');
            rail.style.setProperty('--tm-chat-input-toolbar-inline-height', `${inlineInputHeight}px`);
            inlineInputHost.style.flex = '1 1 0%';
            inlineInputHost.style.minWidth = '0';
            inlineInputHost.style.width = '0';
            inlineInputHost.style.maxWidth = 'none';

            if (rail.parentElement !== controlsRow) {
                controlsRow.appendChild(rail);
            }

            if (chatInputToolbarAlignRight) {
                if (inlineInputHost.nextElementSibling !== rail) {
                    controlsRow.insertBefore(rail, inlineInputHost.nextElementSibling);
                }
            } else if (rail.nextElementSibling !== inlineInputHost) {
                controlsRow.insertBefore(rail, inlineInputHost);
            }

            rail.style.transform = 'translateY(0)';

            return;
        }

        rail.removeAttribute(CHAT_INPUT_TOOLBAR_INLINE_ATTR);
        rail.style.removeProperty('--tm-chat-input-toolbar-inline-height');

        if (inlineInputHost instanceof HTMLElement) {
            inlineInputHost.style.removeProperty('width');
            inlineInputHost.style.removeProperty('max-width');
        }

        const isTr4kerDockedToolbar = isTr4kerPage() && !chatInputToolbarInline;

        rail.style.position = 'absolute';
        rail.style.top = isTr4kerDockedToolbar ? '6px' : '0';
        rail.style.bottom = 'auto';
        rail.style.left = isTr4kerDockedToolbar ? '8px' : '0';
        rail.style.right = isTr4kerDockedToolbar ? '8px' : '0';
        rail.style.justifyContent = chatInputToolbarAlignRight ? 'flex-end' : 'flex-start';
        rail.style.flexWrap = 'nowrap';
        rail.style.flexShrink = '0';
        rail.style.minWidth = '0';
        rail.style.alignSelf = 'auto';
        rail.style.transform = 'translateY(0)';

        if (rail.parentElement !== railHost) {
            railHost.appendChild(rail);
        }
    }

    function syncChatInputToolbarReservedSpace(input = getChatInput()) {
        document.querySelectorAll(`[${CHAT_INPUT_TOOLBAR_SPACE_ATTR}="1"]`).forEach((element) => {
            if (!(element instanceof HTMLElement)) return;

            const rail = getChatInputToolbarRail(element);
            if (!chatInputToolbarInline && hasVisibleChatInputToolbar(rail)) {
                element.style.paddingTop = `${getChatInputToolbarReservedHeightPx()}px`;
                return;
            }

            if (rail instanceof HTMLElement && rail.children.length === 0) {
                rail.remove();
            }
            element.style.removeProperty('padding-top');
            element.removeAttribute(CHAT_INPUT_TOOLBAR_SPACE_ATTR);
        });

        const context = getChatInputToolbarMountContext(input);
        const railHost = getChatInputToolbarRailHost(context);
        if (!(railHost instanceof HTMLElement)) return;

        const rail = getExistingChatInputToolbarRail(context);
        if (hasVisibleChatInputToolbar(rail)) {
            positionChatInputToolbarRail(context, rail);
            if (!chatInputToolbarInline && context.mountParent instanceof HTMLElement) {
                context.mountParent.style.paddingTop = `${getChatInputToolbarReservedHeightPx()}px`;
                context.mountParent.setAttribute(CHAT_INPUT_TOOLBAR_SPACE_ATTR, '1');
                return;
            }

            if (context.mountParent instanceof HTMLElement) {
                context.mountParent.style.removeProperty('padding-top');
                context.mountParent.removeAttribute(CHAT_INPUT_TOOLBAR_SPACE_ATTR);
            }
            return;
        }

        if (rail instanceof HTMLElement && rail.children.length === 0) {
            rail.remove();
        }
        if (context.mountParent instanceof HTMLElement) {
            context.mountParent.style.removeProperty('padding-top');
            context.mountParent.removeAttribute(CHAT_INPUT_TOOLBAR_SPACE_ATTR);
        }
    }

    function getOrCreateChatInputToolbarRail(context) {
        const railHost = getChatInputToolbarRailHost(context);
        if (!(railHost instanceof HTMLElement)) return null;

        ensureChatInputToolbarMountVisibility(context);

        let rail = getExistingChatInputToolbarRail(context);
        if (!rail) {
            rail = document.createElement('div');
            rail.setAttribute(CHAT_INPUT_TOOLBAR_RAIL_ATTR, '1');
            railHost.appendChild(rail);
        }

        positionChatInputToolbarRail(context, rail);
        return rail;
    }

    function applyChatInputToolbarAlignmentState() {
        syncChatInputToolbarReservedSpace();
        applyKlipyGifMenuAlignmentState();
        applyImageUploadMenuAlignmentState();
        scheduleMovedNativeChatInputActionPopoversSync();
    }

    function scheduleChatInputToolbarResync(frameCount = 4) {
        let remainingFrames = Math.max(1, Number(frameCount) || 1);

        const tick = () => {
            const input = getChatInput();
            if (input instanceof HTMLElement) {
                applyChatInputToolbarAlignmentState();
                syncNativeChatInputActionButtons(input);
            }

            remainingFrames -= 1;
            if (remainingFrames > 0) {
                window.requestAnimationFrame(tick);
            }
        };

        window.requestAnimationFrame(tick);
    }

    function shouldUseChatInputToolbarRail() {
        return isSupportedPage() && (
            getQuickAccessEmojiRecords(1).length > 0 ||
            klipyGifsEnabled ||
            imageHostingEnabled ||
            (savedPhrasesEnabled && savedPhrases.length > 0)
        );
    }

    function isChatInputToolbarLayoutStable(context) {
        if (!shouldUseChatInputToolbarRail()) return true;

        const rail = getExistingChatInputToolbarRail(context);
        if (!(rail instanceof HTMLElement)) return false;

        const railHost = getChatInputToolbarRailHost(context);
        if (!(railHost instanceof HTMLElement) || rail.parentElement !== railHost) {
            return false;
        }

        if (getNativeChatInputActionButtons(context?.input).length > 0) {
            return false;
        }

        if (!chatInputToolbarInline) {
            return true;
        }

        const controlsRow = context?.controlsRow;
        const inputWrapper = context?.inputWrapper;
        const inlineInputHost =
            (inputWrapper instanceof HTMLElement && inputWrapper) ||
            (context?.directWrapper instanceof HTMLElement && context.directWrapper) ||
            (context?.mountParent instanceof HTMLElement && context.mountParent) ||
            null;

        if (
            !(controlsRow instanceof HTMLElement) ||
            !(inlineInputHost instanceof HTMLElement) ||
            inlineInputHost.parentElement !== controlsRow
        ) {
            return false;
        }

        if (chatInputToolbarAlignRight) {
            return inlineInputHost.nextElementSibling === rail;
        }

        return rail.nextElementSibling === inlineInputHost;
    }

    function getChatInputControlsRow(input = getChatInput()) {
        if (!(input instanceof HTMLElement)) return null;

        if (isTr4kerPage()) {
            const inputArea = input.closest('[class*="inputArea"]');
            if (inputArea instanceof HTMLElement) return inputArea;
        }

        const inputWrapper = input.closest('.relative.flex-1');
        if (inputWrapper instanceof HTMLElement && inputWrapper.parentElement instanceof HTMLElement) {
            return inputWrapper.parentElement;
        }

        const directWrapper = input.parentElement;
        if (directWrapper instanceof HTMLElement && directWrapper.parentElement instanceof HTMLElement) {
            return directWrapper.parentElement;
        }

        return null;
    }

    function getNativeChatInputActionSearchRoot(input = getChatInput()) {
        const context = getChatInputToolbarMountContext(input);
        const controlsRow = getChatInputControlsRow(input);

        return controlsRow
            || context.fallbackArea
            || (context.mountParent?.parentElement instanceof HTMLElement ? context.mountParent.parentElement : null)
            || context.mountParent
            || null;
    }

    function getNativeChatInputActionLabel(button) {
        if (!(button instanceof HTMLButtonElement)) return '';

        return normalizeMentionComparableText(
            [
                button.getAttribute('title'),
                button.getAttribute('aria-label'),
                button.textContent
            ]
                .filter(Boolean)
                .join(' ')
        );
    }

    function isNativeChatInputUtilityButton(button) {
        if (!(button instanceof HTMLButtonElement)) return false;
        if (button.hasAttribute('data-tm-native-chat-input-action-moved')) return false;
        if (button.closest(`#${PHRASES_MENU_WRAPPER_ID}, #${GIF_MENU_WRAPPER_ID}, #${IMAGE_UPLOAD_MENU_WRAPPER_ID}`)) return false;
        if (button.closest(`[${NATIVE_CHAT_INPUT_ACTION_HOST_ATTR}="1"]`)) return false;

        const label = getNativeChatInputActionLabel(button);
        const isEmojiButton = /\b(emoji|emojis|smile|smiley|sticker)\b/.test(label);
        const isImageButton = /\b(image|images|img|photo|picture|upload|insere|insérer|inserer|joindre|galerie)\b/.test(label);
        const looksNativeUtilityButton = looksLikeNativeChatInputUtilityButton(button);

        if (isNativeChatInputSendButton(button)) return false;
        if (isTr4kerPage()) return isEmojiButton || isImageButton;
        if (!looksNativeUtilityButton) return false;
        return isEmojiButton || isImageButton || !!button.querySelector('svg');
    }

    function getChatInputActionContainers(input = getChatInput()) {
        const controlsRow = getChatInputControlsRow(input);
        if (!(controlsRow instanceof HTMLElement)) return [];

        const inputWrapper =
            (input instanceof HTMLElement && input.closest('.relative.flex-1')) ||
            (input instanceof HTMLElement && input.parentElement instanceof HTMLElement ? input.parentElement : null);

        return Array.from(controlsRow.children).filter((child) => {
            if (!(child instanceof HTMLElement)) return false;
            if (child.getAttribute(CHAT_INPUT_TOOLBAR_RAIL_ATTR) === '1') return false;
            if (child.getAttribute(NATIVE_CHAT_INPUT_ACTION_HOST_ATTR) === '1') return false;
            if (child.id === PHRASES_MENU_WRAPPER_ID || child.id === GIF_MENU_WRAPPER_ID || child.id === IMAGE_UPLOAD_MENU_WRAPPER_ID) return false;
            if (child === inputWrapper) return false;
            if (inputWrapper instanceof HTMLElement && child.contains(inputWrapper)) return false;
            return true;
        });
    }

    function getNativeChatInputActionButtons(input = getChatInput()) {
        if (isTr4kerPage() && input instanceof HTMLElement) {
            const directButtons = Array.from(
                (input.parentElement || input).querySelectorAll('button[type="button"]')
            ).filter((button) => isNativeChatInputUtilityButton(button));
            return Array.from(new Set(directButtons)).slice(0, 2);
        }

        const actionContainers = getChatInputActionContainers(input);
        if (actionContainers.length === 0) return [];

        const candidateButtons = [];

        actionContainers.forEach((container) => {
            if (container instanceof HTMLButtonElement && String(container.type || '').toLowerCase() === 'button') {
                candidateButtons.push(container);
            }

            container
                .querySelectorAll(':scope > button[type="button"], :scope > * > button[type="button"]')
                .forEach((button) => {
                    if (button instanceof HTMLButtonElement) {
                        candidateButtons.push(button);
                    }
                });
        });

        const explicitMatches = [];
        const fallbackMatches = [];

        Array.from(new Set(candidateButtons))
            .filter((button) => isNativeChatInputUtilityButton(button))
            .forEach((button) => {
            const label = getNativeChatInputActionLabel(button);
            if (/\b(emoji|emojis|image|images|img|photo|picture|upload|insere|insérer|inserer|joindre|galerie)\b/.test(label)) {
                explicitMatches.push(button);
                return;
            }

            fallbackMatches.push(button);
            });

        return Array.from(new Set([...explicitMatches, ...fallbackMatches])).slice(0, 2);
    }

    function restoreNativeChatInputActionButtons() {
        const movedButtons = Array.from(document.querySelectorAll('[data-tm-native-chat-input-action-moved="1"]'));

        movedButtons.forEach((button) => {
            if (!(button instanceof HTMLButtonElement)) return;

            const placeholderId = button.getAttribute('data-tm-native-chat-input-action-placeholder-id') || '';
            const placeholder = placeholderId
                ? document.querySelector(`[${NATIVE_CHAT_INPUT_ACTION_PLACEHOLDER_ATTR}="${placeholderId}"]`)
                : null;
            const source = placeholder?.parentElement instanceof HTMLElement ? placeholder.parentElement : null;
            const host = button.closest(`[${NATIVE_CHAT_INPUT_ACTION_HOST_ATTR}="1"]`);

            if (placeholder instanceof HTMLElement) {
                placeholder.replaceWith(button);
            } else if (host instanceof HTMLElement && host.parentElement instanceof HTMLElement) {
                host.parentElement.insertBefore(button, host);
            }

            if (host instanceof HTMLElement && host.childElementCount === 0) {
                host.remove();
            }

            button.removeAttribute('data-tm-native-chat-input-action-moved');
            button.removeAttribute('data-tm-native-chat-input-action-placeholder-id');

            if (source instanceof HTMLElement) {
                source.removeAttribute(NATIVE_CHAT_INPUT_ACTION_SOURCE_ATTR);

                Array.from(source.children).forEach((child) => {
                    if (!(child instanceof HTMLElement)) return;
                    if (!child.classList.contains('bottom-12') && !child.classList.contains('bottom-24')) return;

                    const computedStyle = window.getComputedStyle(child);
                    if (computedStyle.position !== 'absolute' && computedStyle.position !== 'fixed') return;

                    child.classList.remove('bottom-24');
                    if (!child.classList.contains('bottom-12')) {
                        child.classList.add('bottom-12');
                    }
                    child.style.removeProperty('position');
                    child.style.removeProperty('left');
                    child.style.removeProperty('right');
                    child.style.removeProperty('top');
                    child.style.removeProperty('bottom');
                    child.style.removeProperty('z-index');
                });
            }
        });

        document.querySelectorAll(`[${NATIVE_CHAT_INPUT_ACTION_HOST_ATTR}="1"]`).forEach((host) => {
            if (!(host instanceof HTMLElement)) return;
            if (host.childElementCount === 0) {
                host.remove();
            }
        });
    }

    function getMovedNativeChatInputActionHostByPlaceholderId(placeholderId) {
        const safePlaceholderId = String(placeholderId || '').trim();
        if (!safePlaceholderId) return null;

        const movedButton = document.querySelector(
            `[data-tm-native-chat-input-action-moved="1"][data-tm-native-chat-input-action-placeholder-id="${safePlaceholderId}"]`
        );
        if (!(movedButton instanceof HTMLButtonElement)) return null;

        const host = movedButton.closest(`[${NATIVE_CHAT_INPUT_ACTION_HOST_ATTR}="1"]`);
        return host instanceof HTMLElement ? host : null;
    }

    function positionMovedNativeChatInputPopover(popup, host) {
        if (!(popup instanceof HTMLElement) || !(host instanceof HTMLElement)) return;

        const hostRect = host.getBoundingClientRect();
        if (hostRect.width <= 0 || hostRect.height <= 0) return;

        popup.style.setProperty('position', 'fixed', 'important');
        popup.style.setProperty('right', 'auto', 'important');
        popup.style.setProperty('bottom', 'auto', 'important');
        popup.style.setProperty('left', '-9999px', 'important');
        popup.style.setProperty('top', '-9999px', 'important');
        popup.style.setProperty('z-index', isHomePage() ? '1400' : '120', 'important');

        const popupRect = popup.getBoundingClientRect();
        if (popupRect.width <= 0 || popupRect.height <= 0) return;

        const maxLeft = Math.max(8, window.innerWidth - popupRect.width - 8);
        const maxTop = Math.max(8, window.innerHeight - popupRect.height - 8);
        const nextLeft = chatInputToolbarAlignRight
            ? clamp(hostRect.right - popupRect.width, 8, maxLeft)
            : clamp(hostRect.left, 8, maxLeft);
        const nextTop = clamp(hostRect.top - popupRect.height - 8, 8, maxTop);

        popup.style.setProperty('left', `${nextLeft}px`, 'important');
        popup.style.setProperty('top', `${nextTop}px`, 'important');
    }

    function syncMovedNativeChatInputActionPopovers() {
        applyNativeChatInputPopoverState();
        if (!isSupportedPage()) return;

        document.querySelectorAll(`[${NATIVE_CHAT_INPUT_ACTION_PLACEHOLDER_ATTR}]`).forEach((placeholder) => {
            if (!(placeholder instanceof HTMLElement)) return;

            const source = placeholder.parentElement;
            if (!(source instanceof HTMLElement)) return;

            const placeholderId = placeholder.getAttribute(NATIVE_CHAT_INPUT_ACTION_PLACEHOLDER_ATTR) || '';
            const host = getMovedNativeChatInputActionHostByPlaceholderId(placeholderId);
            if (!(host instanceof HTMLElement)) return;

            source.setAttribute(NATIVE_CHAT_INPUT_ACTION_SOURCE_ATTR, '1');
            source.style.overflow = 'visible';

            const popupCandidates = source.querySelectorAll(':scope > .absolute.bottom-12, :scope > .fixed.bottom-12, :scope > .absolute.bottom-24, :scope > .fixed.bottom-24');

            Array.from(popupCandidates).forEach((child) => {
                if (!(child instanceof HTMLElement)) return;

                const computedStyle = window.getComputedStyle(child);
                if (computedStyle.position !== 'absolute' && computedStyle.position !== 'fixed') return;

                if (isChatPage()) {
                    child.classList.remove('bottom-12');
                    child.classList.add('bottom-24');
                }

                positionMovedNativeChatInputPopover(child, host);
            });
        });
    }

    function scheduleMovedNativeChatInputActionPopoversSync() {
        window.requestAnimationFrame(() => {
            syncMovedNativeChatInputActionPopovers();

            window.requestAnimationFrame(() => {
                syncMovedNativeChatInputActionPopovers();
            });
        });
    }

    function resetNativeChatInputActionButtonsLayout(input = getChatInput(), frameCount = 4) {
        restoreNativeChatInputActionButtons();

        let remainingFrames = Math.max(1, Number(frameCount) || 1);

        const tick = () => {
            const nextInput = input instanceof HTMLElement ? input : getChatInput();
            if (nextInput instanceof HTMLElement) {
                applyChatInputToolbarAlignmentState();
                syncChatInputToolbarReservedSpace(nextInput);
                syncNativeChatInputActionButtons(nextInput);
            }

            remainingFrames -= 1;
            if (remainingFrames > 0) {
                window.requestAnimationFrame(tick);
            }
        };

        window.requestAnimationFrame(tick);
    }

    function getMovedNativeChatInputActionHosts(rail) {
        if (!(rail instanceof HTMLElement)) return [];

        return Array.from(rail.children).filter((child) => (
            child instanceof HTMLElement &&
            child.getAttribute(NATIVE_CHAT_INPUT_ACTION_HOST_ATTR) === '1'
        ));
    }

    function insertNativeChatInputActionHost(rail, host) {
        if (!(rail instanceof HTMLElement) || !(host instanceof HTMLElement)) return;
        if (chatInputToolbarAlignRight) {
            const firstNonNativeChild = Array.from(rail.children).find((child) => (
                child instanceof HTMLElement &&
                child !== host &&
                child.getAttribute(NATIVE_CHAT_INPUT_ACTION_HOST_ATTR) !== '1'
            ));

            if (firstNonNativeChild instanceof HTMLElement) {
                rail.insertBefore(host, firstNonNativeChild);
                return;
            }
        }

        rail.appendChild(host);
    }

    function syncNativeChatInputActionButtons(input = getChatInput()) {
        if (isTr4kerPage()) {
            // Tr4ker owns the React popovers associated with these buttons. Keep
            // the native controls in place so their event/ref lifecycle remains intact.
            restoreNativeChatInputActionButtons();
            return;
        }

        if (!shouldUseChatInputToolbarRail()) {
            restoreNativeChatInputActionButtons();
            return;
        }

        const context = getChatInputToolbarMountContext(input);
        const rail = getExistingChatInputToolbarRail(context);
        if (!(rail instanceof HTMLElement)) {
            restoreNativeChatInputActionButtons();
            return;
        }

        getMovedNativeChatInputActionHosts(rail).forEach((host) => {
            insertNativeChatInputActionHost(rail, host);
        });

        const candidateButtons = getNativeChatInputActionButtons(input);

        candidateButtons.forEach((button, index) => {
            const placeholderId = `native-action-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
            const placeholder = document.createElement('span');
            placeholder.setAttribute(NATIVE_CHAT_INPUT_ACTION_PLACEHOLDER_ATTR, placeholderId);
            placeholder.style.display = 'none';

            const host = document.createElement('div');
            host.setAttribute(NATIVE_CHAT_INPUT_ACTION_HOST_ATTR, '1');
            host.style.display = 'flex';
            host.style.alignItems = 'center';
            host.style.position = 'relative';
            host.style.overflow = 'visible';
            host.style.flexShrink = '0';
            host.style.pointerEvents = 'auto';
            host.style.zIndex = '80';

            if (button.getAttribute(NATIVE_CHAT_INPUT_ACTION_POPOVER_SYNC_BOUND_ATTR) !== '1') {
                button.setAttribute(NATIVE_CHAT_INPUT_ACTION_POPOVER_SYNC_BOUND_ATTR, '1');
                button.addEventListener('click', () => {
                    scheduleMovedNativeChatInputActionPopoversSync();
                });
            }

            button.before(placeholder);
            if (placeholder.parentElement instanceof HTMLElement) {
                placeholder.parentElement.setAttribute(NATIVE_CHAT_INPUT_ACTION_SOURCE_ATTR, '1');
                placeholder.parentElement.style.overflow = 'visible';
            }
            button.setAttribute('data-tm-native-chat-input-action-moved', '1');
            button.setAttribute('data-tm-native-chat-input-action-placeholder-id', placeholderId);
            host.appendChild(button);
            insertNativeChatInputActionHost(rail, host);
        });

        syncMovedNativeChatInputActionPopovers();
    }

    function getChatInputMaxLength(input) {
        if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
            const attributeMaxLength = Number(input.getAttribute('maxlength'));
            if (Number.isFinite(attributeMaxLength) && attributeMaxLength > 0) {
                return attributeMaxLength;
            }

            if (input.maxLength > 0) {
                return input.maxLength;
            }
        }

        return MAX_SAVED_PHRASE_LENGTH;
    }

    function getChatInputRawValue(input = getChatInput()) {
        if (!(input instanceof HTMLElement)) return '';

        if (input.isContentEditable) {
            return String(input.textContent || '');
        }

        if ('value' in input) {
            return String(input.value || '');
        }

        return '';
    }

    function setChatInputExactValue(input, nextValue) {
        if (!(input instanceof HTMLElement)) {
            return { ok: false, message: 'Champ de texte non trouvé.' };
        }

        const safeValue = String(nextValue || '');
        const maxLength = getChatInputMaxLength(input);
        if (maxLength > 0 && safeValue.length > maxLength) {
            return {
                ok: false,
                message: `Le message dépasserait la limite du chat (${safeValue.length}/${maxLength}).`
            };
        }

        input.focus();

        if (input.isContentEditable) {
            input.textContent = safeValue;
        } else if ('value' in input) {
            const nativeSetter = Object.getOwnPropertyDescriptor(
                window[input.tagName === 'TEXTAREA' ? 'HTMLTextAreaElement' : 'HTMLInputElement'].prototype,
                'value'
            )?.set;

            if (nativeSetter) {
                nativeSetter.call(input, safeValue);
            } else {
                input.value = safeValue;
            }
        } else {
            return { ok: false, message: 'Champ de texte non compatible.' };
        }

        input.dispatchEvent(new Event('input', { bubbles: true }));
        return { ok: true, message: 'Champ mis à jour.' };
    }

    function getChatSendButton(input = getChatInput()) {
        const searchRoot = getNativeChatInputActionSearchRoot(input);
        if (!(searchRoot instanceof HTMLElement)) return null;

        const buttons = Array.from(searchRoot.querySelectorAll('button, [role="button"]')).filter((element) => {
            if (!(element instanceof HTMLElement)) return false;
            if (isScriptUiElement(element)) return false;
            return true;
        });

        const explicitButton = buttons.find((button) =>
            button instanceof HTMLButtonElement && isNativeChatInputSendButton(button)
        );
        if (explicitButton instanceof HTMLButtonElement) return explicitButton;

        const submitButton = buttons.find((button) => {
            if (!(button instanceof HTMLButtonElement)) return false;
            return String(button.type || '').toLowerCase() === 'submit';
        });
        if (submitButton instanceof HTMLButtonElement) return submitButton;

        return null;
    }

    function scheduleChatInputDraftRestore(input, previousValue, temporaryValue) {
        if (!(input instanceof HTMLElement)) return;

        const originalDraft = String(previousValue || '');
        const temporaryDraft = String(temporaryValue || '');
        if (!originalDraft.trim()) return;

        const startedAt = Date.now();

        function attemptRestore() {
            if (!(input instanceof HTMLElement) || !document.contains(input)) return;

            const currentValue = getChatInputRawValue(input);
            if (!currentValue.trim()) {
                void setChatInputExactValue(input, originalDraft);
                return;
            }

            if (Date.now() - startedAt >= 4000) {
                if (normalizeMentionComparableText(currentValue) === normalizeMentionComparableText(temporaryDraft)) {
                    void setChatInputExactValue(input, originalDraft);
                }
                return;
            }

            window.setTimeout(attemptRestore, 140);
        }

        window.setTimeout(attemptRestore, 140);
    }

    function sendAutomatedChatMessage(messageText, options = {}) {
        const normalizedMessage = normalizeSavedPhraseText(messageText, true);
        if (!normalizedMessage) {
            return { ok: false, message: 'Message AFK vide.' };
        }

        const input = options?.input instanceof HTMLElement ? options.input : getChatInput();
        if (!(input instanceof HTMLElement)) {
            return { ok: false, message: 'Champ de texte non trouvé.' };
        }

        const previousValue = getChatInputRawValue(input);
        const setValueResult = setChatInputExactValue(input, normalizedMessage);
        if (!setValueResult.ok) {
            return setValueResult;
        }

        afkAutomatedSendInFlight = true;

        try {
            const sendButton = getChatSendButton(input);
            if (sendButton instanceof HTMLButtonElement && !sendButton.disabled) {
                sendButton.click();
            } else {
                const form = input.closest('form');
                if (form instanceof HTMLFormElement) {
                    if (typeof form.requestSubmit === 'function') {
                        form.requestSubmit();
                    } else {
                        form.submit();
                    }
                } else {
                    input.dispatchEvent(new KeyboardEvent('keydown', {
                        key: 'Enter',
                        code: 'Enter',
                        keyCode: 13,
                        which: 13,
                        bubbles: true,
                        cancelable: true
                    }));
                    input.dispatchEvent(new KeyboardEvent('keyup', {
                        key: 'Enter',
                        code: 'Enter',
                        keyCode: 13,
                        which: 13,
                        bubbles: true
                    }));
                }
            }
        } finally {
            window.setTimeout(() => {
                afkAutomatedSendInFlight = false;
            }, 0);
        }

        if (options?.preserveDraft !== false) {
            scheduleChatInputDraftRestore(input, previousValue, normalizedMessage);
        }

        return { ok: true, message: 'Message envoyé.' };
    }

    /**
     * Insère ou remplace du texte dans l'input natif du chat tout en déclenchant les events attendus par l'UI.
     *
     * @param {HTMLElement} input
     * @param {string} textToInsert
     * @param {string} [successMessage='Texte inséré.']
     * @param {{ replaceExistingText?: boolean }} [options={}]
     * @returns {{ ok: boolean, message: string }}
     */
    function insertTextIntoChatInput(input, textToInsert, successMessage = 'Texte inséré.', options = {}) {
        if (!(input instanceof HTMLElement)) {
            return { ok: false, message: 'Champ de texte non trouvé.' };
        }

        const text = String(textToInsert || '').trim();
        if (!text) {
            return { ok: false, message: 'Texte vide.' };
        }

        input.focus();
        const replaceExistingText = options?.replaceExistingText === true;

        const currentValue = input.isContentEditable
            ? (input.textContent || '')
            : ('value' in input ? (input.value || '') : '');
        const prefix = !replaceExistingText && currentValue.length > 0 && !/\s$/.test(currentValue) ? ' ' : '';
        const nextValue = replaceExistingText ? text : (currentValue + prefix + text);
        const maxLength = getChatInputMaxLength(input);

        if (maxLength > 0 && nextValue.length > maxLength) {
            return {
                ok: false,
                message: `Le message dépasserait la limite du chat (${nextValue.length}/${maxLength}).`
            };
        }

        if (input.isContentEditable) {
            input.textContent = nextValue;
        } else if ('value' in input) {
            const nativeSetter = Object.getOwnPropertyDescriptor(
                window[input.tagName === 'TEXTAREA' ? 'HTMLTextAreaElement' : 'HTMLInputElement'].prototype,
                'value'
            )?.set;

            if (nativeSetter) {
                nativeSetter.call(input, nextValue);
            } else {
                input.value = nextValue;
            }
        } else {
            return { ok: false, message: 'Champ de texte non compatible.' };
        }

        input.dispatchEvent(new Event('input', { bubbles: true }));
        return { ok: true, message: successMessage };
    }

    function maybeDisableAfkFromManualInputSubmission(input) {
        if (afkAutomatedSendInFlight) return;
        if (!(input instanceof HTMLElement)) return;
        if (!isAfkEnabledForCurrentContext()) return;

        const currentValue = getChatInputRawValue(input);
        if (!currentValue.trim()) return;

        const result = disableAfkModeForCurrentContext('après envoi manuel');
        if (result.ok) {
            showToast(result.message);
        }
    }

    function installAfkAutoDisableOnManualSend() {
        document.addEventListener('submit', (event) => {
            if (!isSupportedPage() || afkAutomatedSendInFlight) return;

            const form = event.target;
            if (!(form instanceof HTMLFormElement)) return;

            const input = findChatInputWithin(form);
            if (!(input instanceof HTMLElement)) return;

            maybeDisableAfkFromManualInputSubmission(input);
        }, true);

        document.addEventListener('click', (event) => {
            if (!isSupportedPage() || afkAutomatedSendInFlight) return;

            const target = event.target;
            if (!(target instanceof Element)) return;

            const button = target.closest('button');
            if (!(button instanceof HTMLButtonElement)) return;
            if (isScriptUiElement(button)) return;
            if (!isNativeChatInputSendButton(button) && String(button.type || '').toLowerCase() !== 'submit') return;

            const input = getChatInput();
            if (!(input instanceof HTMLElement)) return;

            const searchRoot = getNativeChatInputActionSearchRoot(input);
            const inputForm = input.closest('form');
            if (
                searchRoot instanceof HTMLElement &&
                !searchRoot.contains(button) &&
                !(inputForm instanceof HTMLFormElement && inputForm.contains(button))
            ) {
                return;
            }

            maybeDisableAfkFromManualInputSubmission(input);
        }, true);

        document.addEventListener('keydown', (event) => {
            if (!isSupportedPage() || afkAutomatedSendInFlight) return;
            if (event.key !== 'Enter' || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;

            const target = event.target;
            if (!(target instanceof HTMLElement)) return;

            const input = isChatInputCandidate(target)
                ? target
                : target.closest('input[type="text"], textarea, [contenteditable="true"]');
            if (!(input instanceof HTMLElement) || !isChatInputCandidate(input)) return;

            maybeDisableAfkFromManualInputSubmission(input);
        }, true);
    }

    /**
     * Insère une réponse rapide normalisée dans l'input du chat.
     *
     * @param {HTMLElement} input
     * @param {string} phraseText
     * @param {{ replaceExistingText?: boolean }} [options={}]
     * @returns {{ ok: boolean, message: string }}
     */
    function insertSavedPhraseIntoChatInput(input, phraseText, options = {}) {
        const phrase = normalizeSavedPhraseText(phraseText);
        if (!phrase) {
            return { ok: false, message: 'Phrase vide.' };
        }

        return insertTextIntoChatInput(input, phrase, 'Phrase insérée.', options);
    }

    /**
     * Insère un GIF Klipy sous forme de balise BBCode image dans le chat.
     *
     * @param {HTMLElement} input
     * @param {string} gifUrl
     * @returns {{ ok: boolean, message: string }}
     */
    function insertGifIntoChatInput(input, gifUrl) {
        const embedMarkup = buildKlipyGifEmbedMarkup(gifUrl);
        if (!embedMarkup) {
            return { ok: false, message: 'GIF Klipy invalide.' };
        }

        return insertTextIntoChatInput(input, embedMarkup, 'Balise BBCode GIF insérée.');
    }

    function insertImageIntoChatInput(input, imageUrl) {
        const embedMarkup = buildImageEmbedMarkup(imageUrl);
        if (!embedMarkup) {
            return { ok: false, message: 'Lien image invalide.' };
        }

        return insertTextIntoChatInput(input, embedMarkup, 'Balise BBCode image insérée.');
    }

    function insertEmojiIntoChatInput(input, emojiRecord) {
        const emojiText = buildEmojiInsertionText(emojiRecord);
        if (!emojiText) {
            return { ok: false, message: 'Emoji invalide.' };
        }

        return insertTextIntoChatInput(input, emojiText, 'Emoji inséré.');
    }

    function getOrCreateEmojiQuickAccessToolbarWrapper(rail) {
        let wrapper = document.getElementById(EMOJI_QUICK_ACCESS_WRAPPER_ID);
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.id = EMOJI_QUICK_ACCESS_WRAPPER_ID;
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.gap = '6px';
            wrapper.style.justifyContent = 'flex-start';
            wrapper.style.position = 'relative';
            wrapper.style.zIndex = '50';
            wrapper.style.overflow = 'visible';
            wrapper.style.pointerEvents = 'auto';
            wrapper.style.flexShrink = '0';
        }

        const siblingCandidates = [
            document.getElementById(GIF_MENU_WRAPPER_ID),
            document.getElementById(PHRASES_MENU_WRAPPER_ID)
        ].filter((element) => element instanceof HTMLElement && element.parentElement === rail);
        const insertionAnchor = siblingCandidates[0] || null;

        if (wrapper.parentNode !== rail) {
            if (insertionAnchor instanceof HTMLElement) {
                rail.insertBefore(wrapper, insertionAnchor);
            } else {
                rail.appendChild(wrapper);
            }
        }

        return wrapper;
    }

    function createEmojiQuickAccessButton(record) {
        const insertionText = buildEmojiInsertionText(record);
        const clickCount = Math.max(0, Number(record?.count) || 0);
        const button = document.createElement('button');
        button.type = 'button';
        button.title = record?.isManual && clickCount <= 0
            ? `${insertionText || 'Emoji'} · favori manuel`
            : `${insertionText || 'Emoji'} · ${clickCount} clic${clickCount > 1 ? 's' : ''}`;
        button.setAttribute('aria-label', `Insérer ${insertionText || 'cet emoji'}`);
        button.style.display = 'inline-flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.width = '34px';
        button.style.height = '34px';
        button.style.padding = '0';
        button.style.border = '1px solid rgba(255,255,255,0.1)';
        button.style.background = 'rgba(39,39,42,0.9)';
        button.style.borderRadius = '999px';
        button.style.cursor = 'pointer';
        button.style.backdropFilter = 'blur(10px)';
        button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)';
        button.style.transition = 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)';

        if (record.src) {
            const image = document.createElement('img');
            image.src = record.src;
            image.alt = insertionText || record.alt || 'emoji';
            image.style.width = '22px';
            image.style.height = '22px';
            image.style.objectFit = 'contain';
            image.style.pointerEvents = 'none';
            button.appendChild(image);
        } else {
            const label = document.createElement('span');
            label.textContent = insertionText || '☺';
            label.style.fontSize = '11px';
            label.style.fontWeight = '700';
            label.style.lineHeight = '1';
            label.style.color = '#f4f4f5';
            label.style.pointerEvents = 'none';
            button.appendChild(label);
        }

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-1px) scale(1.03)';
            button.style.borderColor = 'rgba(96,165,250,0.42)';
            button.style.background = 'rgba(63,63,70,0.96)';
            button.style.boxShadow = '0 6px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0) scale(1)';
            button.style.borderColor = 'rgba(255,255,255,0.1)';
            button.style.background = 'rgba(39,39,42,0.9)';
            button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)';
        });

        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            const nextInput = getChatInput();
            if (!(nextInput instanceof HTMLElement)) {
                showToast('Champ de texte non trouvé.', true);
                return;
            }

            const result = insertEmojiIntoChatInput(nextInput, record);
            if (!result.ok) {
                showToast(result.message, true);
                return;
            }

            recordEmojiUsageRecord(record);
        });

        return button;
    }

    function createMessageReactionQuickAccessButton(record, messageEl) {
        const reactionLabel = buildReactionQuickAccessLabel(record);
        const clickCount = Math.max(0, Number(record?.count) || 0);
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute(MESSAGE_REACTION_QUICK_ACCESS_BUTTON_ATTR, '1');
        button.title = record?.isManual && clickCount <= 0
            ? `${record.title || record.alt || record.label || 'Réaction'} · favori manuel`
            : `${record.title || record.alt || record.label || 'Réaction'} · ${clickCount} clic${clickCount > 1 ? 's' : ''}`;
        button.setAttribute('aria-label', `Envoyer ${record.title || record.alt || record.label || 'cette réaction'}`.trim());
        button.style.display = 'inline-flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.width = '24px';
        button.style.height = '24px';
        button.style.padding = '0';
        button.style.border = '1px solid rgba(251,191,36,0.16)';
        button.style.background = 'rgba(113,63,18,0.28)';
        button.style.borderRadius = '8px';
        button.style.cursor = 'pointer';
        button.style.flex = '0 0 auto';
        button.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.06)';
        button.style.transition = 'all 0.16s cubic-bezier(0.16, 1, 0.3, 1)';

        if (record.src) {
            const image = document.createElement('img');
            image.src = record.src;
            image.alt = reactionLabel || record.alt || record.title || 'reaction';
            image.style.width = '14px';
            image.style.height = '14px';
            image.style.objectFit = 'contain';
            image.style.pointerEvents = 'none';
            button.appendChild(image);
        } else {
            const label = document.createElement('span');
            label.textContent = reactionLabel || '•';
            label.style.fontSize = reactionLabel.length > 1 ? '9px' : '11px';
            label.style.fontWeight = '700';
            label.style.lineHeight = '1';
            label.style.color = '#fef3c7';
            label.style.pointerEvents = 'none';
            button.appendChild(label);
        }

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-1px)';
            button.style.borderColor = 'rgba(251,191,36,0.3)';
            button.style.background = 'rgba(146,64,14,0.36)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.borderColor = 'rgba(251,191,36,0.16)';
            button.style.background = 'rgba(113,63,18,0.28)';
        });

        button.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (!(messageEl instanceof HTMLElement)) {
                showToast('Message cible introuvable.', true);
                return;
            }

            if (button.dataset.tmPendingReaction === '1') {
                return;
            }

            button.dataset.tmPendingReaction = '1';
            button.disabled = true;
            button.style.opacity = '0.58';

            try {
                const result = await postFavoriteReactionForMessage(messageEl, record);
                if (!result.ok) {
                    showToast(result.message, true);
                    return;
                }

                showToast(result.message);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Envoi de la réaction impossible.';
                showToast(errorMessage, true);
            } finally {
                delete button.dataset.tmPendingReaction;
                button.disabled = false;
                button.style.opacity = '1';
            }
        });

        return button;
    }

    function removeEmojiQuickAccessToolbar() {
        const textInput = getChatInput();
        const wrapper = document.getElementById(EMOJI_QUICK_ACCESS_WRAPPER_ID);
        if (wrapper) {
            wrapper.remove();
        }

        syncChatInputToolbarReservedSpace(textInput);
        resetNativeChatInputActionButtonsLayout(textInput, 4);
    }

    function injectEmojiQuickAccessToolbar() {
        if (!isSupportedPage()) return;

        const quickAccessRecords = getQuickAccessEmojiRecords();
        if (quickAccessRecords.length === 0) {
            removeEmojiQuickAccessToolbar();
            return;
        }

        const textInput = getChatInput();
        if (!(textInput instanceof HTMLElement)) return;

        const mountContext = getChatInputToolbarMountContext(textInput);
        const rail = getOrCreateChatInputToolbarRail(mountContext);
        if (!(rail instanceof HTMLElement)) return;

        const wrapper = getOrCreateEmojiQuickAccessToolbarWrapper(rail);
        wrapper.innerHTML = '';
        wrapper.style.display = 'flex';

        quickAccessRecords.forEach((record) => {
            wrapper.appendChild(createEmojiQuickAccessButton(record));
        });

        syncChatInputToolbarReservedSpace(textInput);
        resetNativeChatInputActionButtonsLayout(textInput, 4);
    }

    function refreshEmojiQuickAccessToolbar() {
        if (!isSupportedPage()) return;

        if (emojiQuickAccessLimit <= 0) {
            removeEmojiQuickAccessToolbar();
            return;
        }

        injectEmojiQuickAccessToolbar();
    }

    function removeMessageReactionQuickAccessButtons(messageEl = null) {
        const searchRoot = messageEl instanceof HTMLElement ? messageEl : document;
        searchRoot.querySelectorAll?.(`[${MESSAGE_REACTION_QUICK_ACCESS_GROUP_ATTR}="1"]`).forEach((element) => {
            if (element instanceof HTMLElement) {
                element.remove();
            }
        });
    }

    function buildReactionQuickAccessSignature(records = []) {
        return records
            .map((record) => {
                const key = String(record?.key || '').trim();
                if (!key) return '';

                return [
                    key,
                    String(record?.emojiValue || '').trim(),
                    String(record?.label || record?.title || record?.alt || '').trim(),
                    String(record?.src || '').trim(),
                    Math.max(0, Number(record?.count) || 0),
                    Math.max(0, Number(record?.lastUsedAt) || 0)
                ].join(':');
            })
            .filter(Boolean)
            .join('|');
    }

    function ensureMessageReactionQuickAccessWrapper(actionButtonsContainer) {
        if (!(actionButtonsContainer instanceof HTMLElement)) return null;

        let wrapper = actionButtonsContainer.querySelector(`[${MESSAGE_REACTION_QUICK_ACCESS_GROUP_ATTR}="1"]`);
        if (wrapper instanceof HTMLElement) {
            return wrapper;
        }

        wrapper = document.createElement('div');
        wrapper.setAttribute(MESSAGE_REACTION_QUICK_ACCESS_GROUP_ATTR, '1');
        wrapper.style.display = 'inline-flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '2px';
        wrapper.style.marginLeft = '2px';
        wrapper.style.paddingLeft = '3px';
        wrapper.style.borderLeft = '1px solid rgba(251,191,36,0.12)';
        wrapper.style.flex = '0 0 auto';

        return wrapper;
    }

    function syncMessageReactionQuickAccessButtons(messageEl) {
        if (!(messageEl instanceof HTMLElement) || !isChatPage()) return;

        const actionButtonsContainer = getMessageActionButtonsContainer(messageEl);
        if (!(actionButtonsContainer instanceof HTMLElement)) {
            removeMessageReactionQuickAccessButtons(messageEl);
            return;
        }

        const quickAccessRecords = getQuickAccessReactionRecords();
        if (reactionQuickAccessLimit <= 0 || quickAccessRecords.length === 0) {
            removeMessageReactionQuickAccessButtons(messageEl);
            return;
        }

        const wrapper = ensureMessageReactionQuickAccessWrapper(actionButtonsContainer);
        if (!(wrapper instanceof HTMLElement)) return;

        const reactionButton = getMessageReactionActionButton(messageEl);
        const nextSiblingAfterReaction = reactionButton instanceof HTMLButtonElement
            ? reactionButton.nextSibling
            : actionButtonsContainer.firstChild;
        const signature = buildReactionQuickAccessSignature(quickAccessRecords);

        if (wrapper.dataset.tmReactionQuickAccessSignature !== signature) {
            wrapper.replaceChildren();
            quickAccessRecords.forEach((record) => {
                wrapper.appendChild(createMessageReactionQuickAccessButton(record, messageEl));
            });
            wrapper.dataset.tmReactionQuickAccessSignature = signature;
        }

        if (
            reactionButton instanceof HTMLButtonElement &&
            reactionButton.parentElement === actionButtonsContainer
        ) {
            if (wrapper.parentElement !== actionButtonsContainer || wrapper.previousSibling !== reactionButton) {
                actionButtonsContainer.insertBefore(wrapper, nextSiblingAfterReaction);
            }
            return;
        }

        if (wrapper.parentElement !== actionButtonsContainer || wrapper !== actionButtonsContainer.firstChild) {
            actionButtonsContainer.insertBefore(wrapper, actionButtonsContainer.firstChild);
        }
    }

    function refreshReactionQuickAccessButtons(root = null) {
        if (!isChatPage()) {
            removeMessageReactionQuickAccessButtons();
            return;
        }

        const searchRoot = root instanceof HTMLElement ? root : getActiveChatRoot();
        if (!(searchRoot instanceof HTMLElement)) return;

        if (reactionQuickAccessLimit <= 0 || getQuickAccessReactionRecords(1).length === 0) {
            removeMessageReactionQuickAccessButtons(searchRoot);
            return;
        }

        searchRoot.querySelectorAll('div').forEach((element) => {
            if (isChatMessage(element)) {
                syncMessageReactionQuickAccessButtons(element);
            }
        });
    }

    function createSavedPhrasesMenuReplaceInfoBadge() {
        const replaceInfo = document.createElement('span');
        replaceInfo.textContent = 'i';
        replaceInfo.title = 'Si cette option est cochée, le texte déjà présent dans l’input sera entièrement remplacé par la réponse rapide sélectionnée.';
        replaceInfo.setAttribute('aria-label', replaceInfo.title);
        replaceInfo.style.display = 'inline-flex';
        replaceInfo.style.alignItems = 'center';
        replaceInfo.style.justifyContent = 'center';
        replaceInfo.style.width = '16px';
        replaceInfo.style.height = '16px';
        replaceInfo.style.borderRadius = '999px';
        replaceInfo.style.background = 'rgba(59,130,246,0.18)';
        replaceInfo.style.border = '1px solid rgba(96,165,250,0.26)';
        replaceInfo.style.color = '#bfdbfe';
        replaceInfo.style.fontSize = '10px';
        replaceInfo.style.fontWeight = '700';
        replaceInfo.style.cursor = 'help';
        replaceInfo.style.lineHeight = '1';
        replaceInfo.style.userSelect = 'none';
        return replaceInfo;
    }

    function createSavedPhrasesMenuReplaceToggle() {
        const replaceToggleLabel = document.createElement('label');
        replaceToggleLabel.style.display = 'inline-flex';
        replaceToggleLabel.style.alignItems = 'center';
        replaceToggleLabel.style.cursor = 'pointer';

        const replaceToggle = document.createElement('input');
        replaceToggle.type = 'checkbox';
        replaceToggle.checked = savedPhrasesReplaceInput === true;
        replaceToggle.style.margin = '0';
        replaceToggle.style.cursor = 'pointer';
        replaceToggle.style.accentColor = '#8b5cf6';
        replaceToggle.title = 'Vider complètement l’input avant insertion';
        replaceToggle.setAttribute('aria-label', replaceToggle.title);

        replaceToggle.addEventListener('click', (event) => {
            event.stopPropagation();
        });
        replaceToggle.addEventListener('change', (event) => {
            const nextValue = event.target instanceof HTMLInputElement && event.target.checked;
            saveSavedPhrasesReplaceInput(nextValue);
        });

        replaceToggleLabel.appendChild(replaceToggle);
        return replaceToggleLabel;
    }

    function createSavedPhrasesMenuHeader(contextualSortingActive) {
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.gap = '10px';
        header.style.padding = '6px 10px 8px';

        const headerTitle = document.createElement('div');
        headerTitle.textContent = contextualSortingActive ? 'Suggestions rapides' : 'Réponses rapides';
        headerTitle.style.fontSize = '11px';
        headerTitle.style.fontWeight = '700';
        headerTitle.style.color = contextualSortingActive ? '#c4b5fd' : '#d4d4d8';
        headerTitle.style.opacity = '0.95';

        const replaceControls = document.createElement('div');
        replaceControls.style.display = 'inline-flex';
        replaceControls.style.alignItems = 'center';
        replaceControls.style.justifyContent = 'flex-end';
        replaceControls.style.gap = '6px';
        replaceControls.style.flexShrink = '0';
        replaceControls.appendChild(createSavedPhrasesMenuReplaceInfoBadge());
        replaceControls.appendChild(createSavedPhrasesMenuReplaceToggle());

        header.appendChild(headerTitle);
        header.appendChild(replaceControls);
        return header;
    }

    function createSavedPhrasesMenuContextLabel() {
        const helperLabel = document.createElement('div');
        helperLabel.textContent = 'Tri contextuel actif';
        helperLabel.style.padding = '0 10px 8px';
        helperLabel.style.fontSize = '11px';
        helperLabel.style.color = '#a78bfa';
        helperLabel.style.opacity = '0.92';
        return helperLabel;
    }

    function buildSavedPhrasesMenuItemTitle(rankedPhrase, contextualSortingActive) {
        const phraseText = rankedPhrase.phrase.text;
        const keywordsLabel = formatSavedPhraseKeywordsLabel(rankedPhrase.phrase.keywords);
        const titleParts = [phraseText];

        if (rankedPhrase.phrase.keywords.length > 0) {
            titleParts.push(`Mots-clés : ${keywordsLabel}`);
        }
        if (rankedPhrase.matchedKeywords.length > 0) {
            titleParts.push(`Correspondance : ${rankedPhrase.matchedKeywords.join(', ')}`);
        }
        if (contextualSortingActive && rankedPhrase.matchPercent > 0) {
            titleParts.push(`Match estimé : ${rankedPhrase.matchPercent}%`);
        }

        return titleParts.join('\n');
    }

    function createSavedPhrasesMenuMatchBadge(matchPercent) {
        const percentBadge = document.createElement('span');
        percentBadge.textContent = `${matchPercent}%`;
        percentBadge.style.display = 'inline-flex';
        percentBadge.style.alignItems = 'center';
        percentBadge.style.justifyContent = 'center';
        percentBadge.style.padding = '3px 7px';
        percentBadge.style.borderRadius = '999px';
        percentBadge.style.background = 'rgba(34,197,94,0.18)';
        percentBadge.style.border = '1px solid rgba(74,222,128,0.28)';
        percentBadge.style.color = '#bbf7d0';
        percentBadge.style.fontSize = '10px';
        percentBadge.style.fontWeight = '700';
        percentBadge.style.flexShrink = '0';
        return percentBadge;
    }

    function createSavedPhrasesMenuTextLabel(previewText) {
        const textLabel = document.createElement('span');
        textLabel.textContent = previewText;
        textLabel.style.flex = '1';
        textLabel.style.minWidth = '0';
        textLabel.style.textAlign = 'left';
        textLabel.style.whiteSpace = 'nowrap';
        textLabel.style.overflow = 'hidden';
        textLabel.style.textOverflow = 'ellipsis';
        return textLabel;
    }

    function createSavedPhrasesMenuItem(menu, rankedPhrase, contextualSortingActive) {
        const phraseText = rankedPhrase.phrase.text;
        const previewText = truncateSavedPhrasePreviewText(phraseText);
        const item = document.createElement('button');
        item.type = 'button';
        item.title = buildSavedPhrasesMenuItemTitle(rankedPhrase, contextualSortingActive);
        item.style.background = 'transparent';
        item.style.border = 'none';
        item.style.color = '#e4e4e7';
        item.style.padding = '8px 12px';
        item.style.borderRadius = '8px';
        item.style.fontSize = '12px';
        item.style.cursor = 'pointer';
        item.style.width = '100%';
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.justifyContent = 'space-between';
        item.style.gap = '10px';
        item.style.transition = 'all 0.15s ease';

        const applyIdleState = () => {
            item.style.background = 'transparent';
            item.style.color = '#e4e4e7';
        };

        const applyActiveState = () => {
            item.style.background = 'rgba(139, 92, 246, 0.15)';
            item.style.color = '#fff';
        };

        if (contextualSortingActive && rankedPhrase.matchPercent > 0) {
            item.appendChild(createSavedPhrasesMenuMatchBadge(rankedPhrase.matchPercent));
        }

        item.appendChild(createSavedPhrasesMenuTextLabel(previewText));

        item.addEventListener('mouseenter', applyActiveState);
        item.addEventListener('mouseleave', () => {
            if (document.activeElement === item) return;
            applyIdleState();
        });
        item.addEventListener('focus', applyActiveState);
        item.addEventListener('blur', applyIdleState);
        item.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            const nextInput = getChatInput();
            if (!nextInput) {
                if (typeof showToast === 'function') showToast('Champ de texte non trouvé.', true);
                return;
            }

            const result = insertSavedPhraseIntoChatInput(nextInput, phraseText, {
                replaceExistingText: savedPhrasesReplaceInput === true
            });
            if (!result.ok) {
                if (typeof showToast === 'function') showToast(result.message, true);
                return;
            }

            hideSavedPhrasesMenu(menu);
        });

        return item;
    }

    function createSavedPhrasesMenuDivider() {
        const divider = document.createElement('div');
        divider.style.height = '1px';
        divider.style.margin = '6px 4px';
        divider.style.background = 'rgba(255,255,255,0.08)';
        return divider;
    }

    function createSavedPhrasesMenuMoreButton(menu, hiddenCount) {
        const moreBtn = document.createElement('button');
        moreBtn.type = 'button';
        moreBtn.textContent = `Autres (${hiddenCount})`;
        moreBtn.style.background = 'rgba(124,58,237,0.16)';
        moreBtn.style.border = '1px solid rgba(139,92,246,0.22)';
        moreBtn.style.color = '#ddd6fe';
        moreBtn.style.padding = '9px 12px';
        moreBtn.style.borderRadius = '10px';
        moreBtn.style.fontSize = '12px';
        moreBtn.style.fontWeight = '600';
        moreBtn.style.textAlign = 'left';
        moreBtn.style.cursor = 'pointer';
        moreBtn.style.width = '100%';
        moreBtn.style.transition = 'all 0.15s ease';

        const applyIdleState = () => {
            moreBtn.style.background = 'rgba(124,58,237,0.16)';
            moreBtn.style.borderColor = 'rgba(139,92,246,0.22)';
        };

        const applyActiveState = () => {
            moreBtn.style.background = 'rgba(124,58,237,0.24)';
            moreBtn.style.borderColor = 'rgba(139,92,246,0.34)';
        };

        moreBtn.addEventListener('mouseenter', applyActiveState);
        moreBtn.addEventListener('mouseleave', () => {
            if (document.activeElement === moreBtn) return;
            applyIdleState();
        });
        moreBtn.addEventListener('focus', applyActiveState);
        moreBtn.addEventListener('blur', applyIdleState);
        moreBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            hideSavedPhrasesMenu(menu);
            openSavedPhrasesPickerModal();
        });

        return moreBtn;
    }

    /**
     * Reconstruit le menu compact des réponses rapides à partir du classement contextuel courant.
     *
     * @param {HTMLElement} menu
     * @param {HTMLElement|null} [input=getChatInput()]
     * @returns {void}
     */
    function buildSavedPhrasesMenuContent(menu, input = getChatInput()) {
        if (!(menu instanceof HTMLElement)) return;

        menu.innerHTML = '';

        const rankedPhrases = getRankedSavedPhrases(input);
        const visiblePhraseCount = Math.min(rankedPhrases.length, MAX_VISIBLE_SAVED_PHRASES_IN_MENU);
        const contextualSortingActive = rankedPhrases.length > 0 && rankedPhrases[0].score > 0;

        menu.appendChild(createSavedPhrasesMenuHeader(contextualSortingActive));

        if (contextualSortingActive) {
            menu.appendChild(createSavedPhrasesMenuContextLabel());
        }

        for (let i = 0; i < visiblePhraseCount; i++) {
            const rankedPhrase = rankedPhrases[i];
            if (!rankedPhrase?.phrase) continue;
            menu.appendChild(createSavedPhrasesMenuItem(menu, rankedPhrase, contextualSortingActive));
        }

        if (rankedPhrases.length > MAX_VISIBLE_SAVED_PHRASES_IN_MENU) {
            menu.appendChild(createSavedPhrasesMenuDivider());
            menu.appendChild(createSavedPhrasesMenuMoreButton(
                menu,
                rankedPhrases.length - MAX_VISIBLE_SAVED_PHRASES_IN_MENU
            ));
        }
    }

    /**
     * Monte le bouton et le menu compact des réponses rapides dans la toolbar du chat.
     *
     * @returns {void}
     */
    function injectSavedPhrasesToolbar() {
        if (!isSupportedPage()) return;
        if (!savedPhrasesEnabled) {
            removeSavedPhrasesToolbar();
            return;
        }

        installSavedPhrasesToolbarGlobalHandlers();

        const textInput = getChatInput();
        if (!textInput) return;
        const mountContext = getChatInputToolbarMountContext(textInput);
        const rail = getOrCreateChatInputToolbarRail(mountContext);
        if (!(rail instanceof HTMLElement)) return;

        let wrapper = document.getElementById(PHRASES_MENU_WRAPPER_ID);
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.id = PHRASES_MENU_WRAPPER_ID;
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.gap = '8px';
            wrapper.style.justifyContent = 'flex-end';
            wrapper.style.position = 'relative';
            wrapper.style.zIndex = '50';
            wrapper.style.overflow = 'visible';
            wrapper.style.pointerEvents = 'auto';
            wrapper.style.flexShrink = '0';
        }

        if (wrapper.parentNode !== rail) {
            rail.appendChild(wrapper);
        }

        if (savedPhrases.length === 0) {
            wrapper.style.display = 'none';
            syncChatInputToolbarReservedSpace(textInput);
            return;
        }

        wrapper.style.display = 'flex';
        if (wrapper.dataset.tmInitialized === '1') {
            syncChatInputToolbarReservedSpace(textInput);
            syncNativeChatInputActionButtons(textInput);
            return;
        }

        wrapper.innerHTML = '';

        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.innerHTML = '<span style="margin-right:4px;">✨</span> Réponses rapides';
        toggleBtn.title = 'Ouvrir les réponses rapides';
        toggleBtn.setAttribute('aria-label', 'Ouvrir les réponses rapides');
        toggleBtn.style.background = 'linear-gradient(135deg, rgba(88,28,135,0.7) 0%, rgba(30,58,138,0.7) 100%)';
        toggleBtn.style.border = '1px solid rgba(139,92,246,0.25)';
        toggleBtn.style.color = '#e0e7ff';
        toggleBtn.style.fontSize = '12px';
        toggleBtn.style.fontWeight = '600';
        toggleBtn.style.padding = '6px 14px';
        toggleBtn.style.borderRadius = '999px';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.backdropFilter = 'blur(10px)';
        toggleBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)';
        toggleBtn.style.transition = 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)';

        toggleBtn.addEventListener('mouseenter', () => {
            toggleBtn.style.filter = 'brightness(1.15)';
            toggleBtn.style.transform = 'scale(1.02)';
            toggleBtn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
            toggleBtn.style.border = '1px solid rgba(139,92,246,0.4)';
        });
        toggleBtn.addEventListener('mouseleave', () => {
            toggleBtn.style.filter = 'brightness(1)';
            toggleBtn.style.transform = 'scale(1)';
            toggleBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)';
            toggleBtn.style.border = '1px solid rgba(139,92,246,0.25)';
        });

        const quickAddBtn = document.createElement('button');
        quickAddBtn.type = 'button';
        quickAddBtn.textContent = '+';
        quickAddBtn.title = 'Ajouter une réponse rapide depuis le texte du chat';
        quickAddBtn.setAttribute('aria-label', 'Ajouter une réponse rapide depuis le texte du chat');
        quickAddBtn.style.width = '34px';
        quickAddBtn.style.height = '34px';
        quickAddBtn.style.border = '1px solid rgba(59,130,246,0.28)';
        quickAddBtn.style.background = 'linear-gradient(135deg, rgba(30,64,175,0.7) 0%, rgba(8,145,178,0.7) 100%)';
        quickAddBtn.style.color = '#eff6ff';
        quickAddBtn.style.fontSize = '18px';
        quickAddBtn.style.fontWeight = '700';
        quickAddBtn.style.lineHeight = '1';
        quickAddBtn.style.borderRadius = '999px';
        quickAddBtn.style.cursor = 'pointer';
        quickAddBtn.style.backdropFilter = 'blur(10px)';
        quickAddBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)';
        quickAddBtn.style.transition = 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)';

        quickAddBtn.addEventListener('mouseenter', () => {
            quickAddBtn.style.filter = 'brightness(1.12)';
            quickAddBtn.style.transform = 'scale(1.03)';
            quickAddBtn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
            quickAddBtn.style.border = '1px solid rgba(96,165,250,0.42)';
        });

        quickAddBtn.addEventListener('mouseleave', () => {
            quickAddBtn.style.filter = 'brightness(1)';
            quickAddBtn.style.transform = 'scale(1)';
            quickAddBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)';
            quickAddBtn.style.border = '1px solid rgba(59,130,246,0.28)';
        });

        const menu = document.createElement('div');
        menu.setAttribute('data-tm-saved-phrases-menu', '1');
        menu.style.display = 'none';
        menu.style.position = 'absolute';
        menu.style.bottom = 'calc(100% + 8px)';
        menu.style.right = '0';
        menu.style.background = 'rgba(24, 24, 27, 0.75)';
        menu.style.backdropFilter = 'blur(16px)';
        menu.style.border = '1px solid rgba(255,255,255,0.08)';
        menu.style.borderRadius = '14px';
        menu.style.padding = '6px';
        menu.style.minWidth = '220px';
        menu.style.maxWidth = '300px';
        menu.style.maxHeight = 'none';
        menu.style.overflow = 'hidden';
        menu.style.boxShadow = '0 10px 40px rgba(0,0,0,0.6)';
        menu.style.flexDirection = 'column';
        menu.style.gap = '2px';
        menu.style.zIndex = '1000';
        menu.style.opacity = '0';
        menu.style.transform = 'translateY(10px) scale(0.95)';
        menu.style.transformOrigin = 'bottom right';
        menu.style.transition = 'opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';

        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();

            if (menu.dataset.tmOpen === '1') {
                hideSavedPhrasesMenu(menu);
            } else {
                buildSavedPhrasesMenuContent(menu, getChatInput());
                closeKlipyGifMenu();
                closeImageUploadMenu();
                closeSavedPhrasesMenu();
                showSavedPhrasesMenu(menu);
            }
        });

        menu.addEventListener('click', (e) => e.stopPropagation());
        menu.addEventListener('keydown', (event) => {
            if (menu.dataset.tmOpen !== '1') return;

            if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
                event.preventDefault();
                event.stopPropagation();
                moveSavedPhrasesMenuFocus(menu, 1);
                return;
            }

            if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
                event.preventDefault();
                event.stopPropagation();
                moveSavedPhrasesMenuFocus(menu, -1);
                return;
            }

            if (event.key === 'Home') {
                event.preventDefault();
                event.stopPropagation();
                focusSavedPhrasesMenuButton(menu, 0);
                return;
            }

            if (event.key === 'End') {
                const buttons = getSavedPhrasesMenuFocusableButtons(menu);
                if (buttons.length === 0) return;

                event.preventDefault();
                event.stopPropagation();
                focusSavedPhrasesMenuButton(menu, buttons.length - 1);
                return;
            }
        });

        quickAddBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            closeKlipyGifMenu();
            closeImageUploadMenu();
            closeSavedPhrasesMenu();
            openSavedPhraseQuickAddModal(getChatInputCurrentValue(textInput), textInput);
        });

        wrapper.appendChild(toggleBtn);
        wrapper.appendChild(quickAddBtn);
        wrapper.appendChild(menu);
        wrapper.dataset.tmInitialized = '1';
        syncChatInputToolbarReservedSpace(textInput);
        syncNativeChatInputActionButtons(textInput);
    }

    function getKlipyGifMenu() {
        const menu = document.querySelector('[data-tm-klipy-gif-menu="1"]');
        return menu instanceof HTMLElement ? menu : null;
    }

    function getKlipyGifMenuAnchor() {
        const wrapper = document.getElementById(GIF_MENU_WRAPPER_ID);
        return wrapper instanceof HTMLElement ? wrapper : null;
    }

    function applyKlipyGifMenuAlignmentState(menu = getKlipyGifMenu()) {
        if (!(menu instanceof HTMLElement)) return;

        if (chatInputToolbarAlignRight) {
            menu.style.left = 'auto';
            menu.style.right = '0';
            menu.style.transformOrigin = 'bottom right';
            if (menu.dataset.tmOpen === '1') {
                positionKlipyGifMenu(menu);
            }
            return;
        }

        menu.style.left = '0';
        menu.style.right = 'auto';
        menu.style.transformOrigin = 'bottom left';
        if (menu.dataset.tmOpen === '1') {
            positionKlipyGifMenu(menu);
        }
    }

    function positionKlipyGifMenu(menu) {
        if (!(menu instanceof HTMLElement)) return;

        const anchor = getKlipyGifMenuAnchor();
        if (!(anchor instanceof HTMLElement)) return;

        if (isChatPage() && document.body instanceof HTMLElement) {
            if (menu.parentElement !== document.body) {
                document.body.appendChild(menu);
            }

            menu.style.setProperty('position', 'fixed', 'important');
            menu.style.setProperty('right', 'auto', 'important');
            menu.style.setProperty('bottom', 'auto', 'important');
            menu.style.setProperty('left', '-9999px', 'important');
            menu.style.setProperty('top', '-9999px', 'important');
            menu.style.setProperty('z-index', '1600', 'important');

            const anchorRect = anchor.getBoundingClientRect();
            const menuRect = menu.getBoundingClientRect();
            if (anchorRect.width <= 0 || anchorRect.height <= 0 || menuRect.width <= 0 || menuRect.height <= 0) return;

            const maxLeft = Math.max(8, window.innerWidth - menuRect.width - 8);
            const maxTop = Math.max(8, window.innerHeight - menuRect.height - 8);
            const nextLeft = chatInputToolbarAlignRight
                ? clamp(anchorRect.right - menuRect.width, 8, maxLeft)
                : clamp(anchorRect.left, 8, maxLeft);
            const nextTop = clamp(anchorRect.top - menuRect.height - 8, 8, maxTop);

            menu.style.setProperty('left', `${nextLeft}px`, 'important');
            menu.style.setProperty('top', `${nextTop}px`, 'important');
            menu.style.transformOrigin = chatInputToolbarAlignRight ? 'bottom right' : 'bottom left';
            return;
        }

        if (menu.parentElement !== anchor) {
            anchor.appendChild(menu);
        }

        menu.style.setProperty('position', 'absolute', 'important');
        menu.style.setProperty('top', 'auto', 'important');
        menu.style.setProperty('bottom', 'calc(100% + 8px)', 'important');
        menu.style.setProperty('z-index', isHomePage() ? '1400' : '1500', 'important');

        if (chatInputToolbarAlignRight) {
            menu.style.setProperty('left', 'auto', 'important');
            menu.style.setProperty('right', '0', 'important');
            menu.style.transformOrigin = 'bottom right';
            return;
        }

        menu.style.setProperty('left', '0', 'important');
        menu.style.setProperty('right', 'auto', 'important');
        menu.style.transformOrigin = 'bottom left';
    }

    function clearKlipyGifSearchDebounce() {
        if (!klipyGifSearchDebounceTimer) return;
        clearTimeout(klipyGifSearchDebounceTimer);
        klipyGifSearchDebounceTimer = null;
    }

    function clearKlipyGifMenuHideTimer(menu) {
        if (!(menu instanceof HTMLElement)) return;

        const timerId = Number(menu.dataset.tmHideTimerId || 0);
        if (timerId > 0) {
            clearTimeout(timerId);
            delete menu.dataset.tmHideTimerId;
        }
    }

    function clearKlipyGifMenuRepositionFrame(menu) {
        if (!(menu instanceof HTMLElement)) return;

        const frameId = Number(menu.dataset.tmPositionFrameId || 0);
        if (frameId > 0) {
            window.cancelAnimationFrame(frameId);
            delete menu.dataset.tmPositionFrameId;
        }
    }

    function scheduleKlipyGifMenuReposition(menu, frameCount = 2) {
        if (!(menu instanceof HTMLElement)) return;

        clearKlipyGifMenuRepositionFrame(menu);

        let remainingFrames = Math.max(1, Number(frameCount) || 1);
        const tick = () => {
            if (!(menu instanceof HTMLElement) || menu.dataset.tmOpen !== '1') {
                delete menu.dataset.tmPositionFrameId;
                return;
            }

            positionKlipyGifMenu(menu);
            remainingFrames -= 1;

            if (remainingFrames <= 0) {
                delete menu.dataset.tmPositionFrameId;
                return;
            }

            const nextFrameId = window.requestAnimationFrame(tick);
            menu.dataset.tmPositionFrameId = String(nextFrameId);
        };

        const initialFrameId = window.requestAnimationFrame(tick);
        menu.dataset.tmPositionFrameId = String(initialFrameId);
    }

    function showKlipyGifMenu(menu) {
        if (!(menu instanceof HTMLElement)) return;

        clearKlipyGifMenuHideTimer(menu);
        menu.style.display = 'flex';
        menu.dataset.tmOpen = '1';
        positionKlipyGifMenu(menu);
        scheduleKlipyGifMenuReposition(menu, 3);
        void menu.offsetWidth;
        menu.style.opacity = '1';
        menu.style.transform = 'translateY(0) scale(1)';
    }

    function hideKlipyGifMenu(menu) {
        if (!(menu instanceof HTMLElement)) return;

        clearKlipyGifSearchDebounce();
        clearKlipyGifMenuHideTimer(menu);
        clearKlipyGifMenuRepositionFrame(menu);
        menu.dataset.tmOpen = '0';
        menu.style.opacity = '0';
        menu.style.transform = 'translateY(10px) scale(0.95)';

        const timerId = window.setTimeout(() => {
            if (menu.dataset.tmOpen === '1') return;

            menu.style.display = 'none';
            delete menu.dataset.tmHideTimerId;
        }, 200);

        menu.dataset.tmHideTimerId = String(timerId);
    }

    function closeKlipyGifMenu() {
        const menu = getKlipyGifMenu();
        if (menu) {
            hideKlipyGifMenu(menu);
        }
    }

    function removeKlipyGifToolbar() {
        clearKlipyGifSearchDebounce();

        const menu = getKlipyGifMenu();
        if (menu) {
            clearKlipyGifMenuHideTimer(menu);
            clearKlipyGifMenuRepositionFrame(menu);
            menu.remove();
        }

        const wrapper = document.getElementById(GIF_MENU_WRAPPER_ID);
        if (wrapper) {
            wrapper.remove();
        }

        syncNativeChatInputActionButtons();
        syncChatInputToolbarReservedSpace();
    }

    // Klipy GIF picker - toolbar/menu UI
    function installKlipyGifToolbarGlobalHandlers() {
        if (klipyGifToolbarEventsInstalled) return;

        klipyGifToolbarEventsInstalled = true;

        document.addEventListener('click', (event) => {
            const wrapper = document.getElementById(GIF_MENU_WRAPPER_ID);
            const menu = getKlipyGifMenu();
            if (!(wrapper instanceof HTMLElement)) return;
            if (event.target instanceof Node && wrapper.contains(event.target)) return;
            if (menu instanceof HTMLElement && event.target instanceof Node && menu.contains(event.target)) return;

            closeKlipyGifMenu();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeKlipyGifMenu();
            }
        }, true);

        window.addEventListener('blur', () => {
            closeKlipyGifMenu();
        });
    }

    function getKlipyGifMenuElements(menu) {
        if (!(menu instanceof HTMLElement)) {
            return {
                searchInput: null,
                status: null,
                results: null,
                loadMoreBtn: null
            };
        }

        return {
            searchInput: menu.querySelector('[data-tm-klipy-search="1"]'),
            status: menu.querySelector('[data-tm-klipy-status="1"]'),
            results: menu.querySelector('[data-tm-klipy-results="1"]'),
            loadMoreBtn: menu.querySelector('[data-tm-klipy-more="1"]')
        };
    }

    function setKlipyGifMenuStatus(menu, message, isError = false) {
        const { status } = getKlipyGifMenuElements(menu);
        if (!(status instanceof HTMLElement)) return;

        status.textContent = message;
        status.style.color = isError ? '#fca5a5' : '#cbd5f5';
    }

    function updateKlipyGifMoreButton(menu, visible, isLoading = false) {
        const { loadMoreBtn } = getKlipyGifMenuElements(menu);
        if (!(loadMoreBtn instanceof HTMLButtonElement)) return;

        loadMoreBtn.style.display = visible ? 'inline-flex' : 'none';
        loadMoreBtn.disabled = isLoading;
        loadMoreBtn.textContent = isLoading ? 'Chargement...' : 'Afficher plus';
        loadMoreBtn.style.cursor = isLoading ? 'progress' : 'pointer';
        loadMoreBtn.style.opacity = isLoading ? '0.72' : '1';
    }

    function createKlipyGifResultCard(result, menu) {
        const card = document.createElement('button');
        card.type = 'button';
        card.title = result.title || 'Insérer ce GIF Klipy';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.gap = '8px';
        card.style.padding = '8px';
        card.style.borderRadius = '12px';
        card.style.border = '1px solid rgba(255,255,255,0.08)';
        card.style.background = 'rgba(255,255,255,0.03)';
        card.style.cursor = 'pointer';
        card.style.color = '#f8fafc';
        card.style.textAlign = 'left';
        card.style.transition = 'transform 0.16s ease, border-color 0.16s ease, background 0.16s ease';
        card.style.minWidth = '0';

        const preview = document.createElement('img');
        preview.src = result.previewUrl;
        preview.alt = result.title || 'GIF Klipy';
        preview.loading = 'lazy';
        preview.referrerPolicy = 'no-referrer';
        preview.style.display = 'block';
        preview.style.width = '100%';
        preview.style.aspectRatio = result.width > 0 && result.height > 0 ? `${result.width} / ${result.height}` : '1 / 1';
        preview.style.maxHeight = '140px';
        preview.style.objectFit = 'cover';
        preview.style.borderRadius = '10px';
        preview.style.background = 'rgba(15,23,42,0.55)';

        const title = document.createElement('div');
        title.textContent = result.title || 'GIF Klipy';
        title.style.fontSize = '11px';
        title.style.fontWeight = '700';
        title.style.lineHeight = '1.35';
        title.style.color = '#e2e8f0';
        title.style.whiteSpace = 'nowrap';
        title.style.overflow = 'hidden';
        title.style.textOverflow = 'ellipsis';

        const subtitle = document.createElement('div');
        subtitle.textContent = result.tags.length > 0 ? result.tags.join(' · ') : 'Insérer la balise [img][/img]';
        subtitle.style.fontSize = '10px';
        subtitle.style.lineHeight = '1.35';
        subtitle.style.color = '#94a3b8';
        subtitle.style.whiteSpace = 'nowrap';
        subtitle.style.overflow = 'hidden';
        subtitle.style.textOverflow = 'ellipsis';

        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-1px)';
            card.style.borderColor = 'rgba(34,197,94,0.28)';
            card.style.background = 'rgba(34,197,94,0.08)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.borderColor = 'rgba(255,255,255,0.08)';
            card.style.background = 'rgba(255,255,255,0.03)';
        });

        card.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            const nextInput = getChatInput();
            if (!nextInput) {
                showToast('Champ de texte non trouvé.', true);
                return;
            }

            const resultInsertion = insertGifIntoChatInput(nextInput, result.gifUrl);
            if (!resultInsertion.ok) {
                showToast(resultInsertion.message, true);
                return;
            }

            hideKlipyGifMenu(menu);
        });

        card.appendChild(preview);
        card.appendChild(title);
        card.appendChild(subtitle);
        return card;
    }

    function renderKlipyGifResults(menu, results, append = false) {
        const { results: resultsContainer } = getKlipyGifMenuElements(menu);
        if (!(resultsContainer instanceof HTMLElement)) return;

        if (!append) {
            resultsContainer.innerHTML = '';
        }

        if (!Array.isArray(results) || results.length === 0) {
            if (!append) {
                const emptyState = document.createElement('div');
                emptyState.textContent = 'Aucun GIF disponible pour cette recherche.';
                emptyState.style.padding = '10px 12px';
                emptyState.style.borderRadius = '10px';
                emptyState.style.background = 'rgba(255,255,255,0.03)';
                emptyState.style.border = '1px dashed rgba(255,255,255,0.08)';
                emptyState.style.fontSize = '11px';
                emptyState.style.color = '#94a3b8';
                emptyState.style.textAlign = 'center';
                resultsContainer.appendChild(emptyState);
            }
            return;
        }

        results.forEach((result) => {
            resultsContainer.appendChild(createKlipyGifResultCard(result, menu));
        });
    }

    /**
     * Charge et affiche les résultats Klipy dans le menu GIF, en mode initial ou pagination.
     *
     * @param {HTMLElement} menu
     * @param {{ append?: boolean }} [options={}]
     * @returns {Promise<void>}
     */
    async function loadKlipyGifResults(menu, { append = false } = {}) {
        if (!(menu instanceof HTMLElement)) return;

        const { searchInput } = getKlipyGifMenuElements(menu);
        if (!(searchInput instanceof HTMLInputElement)) return;

        const rawQuery = String(searchInput.value || '').trim();
        const effectiveQuery = rawQuery.length >= KLIPY_SEARCH_MIN_LENGTH ? rawQuery : '';
        const nextCursor = append ? String(menu.dataset.tmKlipyNext || '') : '';

        if (append && !nextCursor) return;

        const requestId = String(++klipyGifRequestSerial);
        menu.dataset.tmKlipyRequestId = requestId;

        updateKlipyGifMoreButton(menu, append || !!menu.dataset.tmKlipyNext, append);
        setKlipyGifMenuStatus(
            menu,
            rawQuery && rawQuery.length < KLIPY_SEARCH_MIN_LENGTH
                ? `Tendances Klipy. Tape au moins ${KLIPY_SEARCH_MIN_LENGTH} caractères pour chercher.`
                : effectiveQuery
                    ? `Recherche Klipy: ${effectiveQuery}`
                    : 'Chargement des tendances Klipy...'
        );

        try {
            const payload = await fetchKlipyGifFeed({
                query: effectiveQuery,
                pos: nextCursor
            });

            if (menu.dataset.tmKlipyRequestId !== requestId) return;

            renderKlipyGifResults(menu, payload.results, append);
            menu.dataset.tmKlipyLoaded = '1';
            menu.dataset.tmKlipyQuery = effectiveQuery;
            menu.dataset.tmKlipyNext = payload.next || '';

            if (payload.results.length === 0 && !append) {
                setKlipyGifMenuStatus(
                    menu,
                    effectiveQuery
                        ? `Aucun GIF Klipy pour "${effectiveQuery}".`
                        : 'Aucun GIF tendance disponible pour le moment.',
                    true
                );
            } else if (rawQuery && rawQuery.length < KLIPY_SEARCH_MIN_LENGTH) {
                setKlipyGifMenuStatus(menu, `Tendances Klipy. Tape au moins ${KLIPY_SEARCH_MIN_LENGTH} caractères pour chercher.`);
            } else {
                setKlipyGifMenuStatus(
                    menu,
                    effectiveQuery
                        ? `Résultats Klipy pour "${effectiveQuery}".`
                        : 'Tendances Klipy.'
                );
            }

            updateKlipyGifMoreButton(menu, !!payload.next, false);
            scheduleKlipyGifMenuReposition(menu, append ? 2 : 3);
        } catch (error) {
            if (menu.dataset.tmKlipyRequestId !== requestId) return;

            if (!append) {
                renderKlipyGifResults(menu, [], false);
            }

            updateKlipyGifMoreButton(menu, false, false);
            setKlipyGifMenuStatus(
                menu,
                `Erreur Klipy: ${error instanceof Error ? error.message : 'chargement impossible.'}`,
                true
            );
            scheduleKlipyGifMenuReposition(menu, 2);
        }
    }

    function scheduleKlipyGifSearch(menu) {
        clearKlipyGifSearchDebounce();
        klipyGifSearchDebounceTimer = window.setTimeout(() => {
            klipyGifSearchDebounceTimer = null;
            loadKlipyGifResults(menu);
        }, KLIPY_SEARCH_DEBOUNCE_MS);
    }

    function getOrCreateKlipyGifToolbarWrapper(rail) {
        let wrapper = document.getElementById(GIF_MENU_WRAPPER_ID);
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.id = GIF_MENU_WRAPPER_ID;
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.justifyContent = 'flex-start';
            wrapper.style.position = 'relative';
            wrapper.style.zIndex = '50';
            wrapper.style.overflow = 'visible';
            wrapper.style.pointerEvents = 'auto';
        }

        wrapper.style.zIndex = isChatPage() ? '280' : '50';

        const phrasesWrapper = document.getElementById(PHRASES_MENU_WRAPPER_ID);
        if (wrapper.parentNode !== rail) {
            if (phrasesWrapper instanceof HTMLElement && phrasesWrapper.parentElement === rail) {
                rail.insertBefore(wrapper, phrasesWrapper);
            } else {
                rail.appendChild(wrapper);
            }
        } else if (phrasesWrapper instanceof HTMLElement && phrasesWrapper.parentElement === rail && wrapper.nextElementSibling !== phrasesWrapper) {
            rail.insertBefore(wrapper, phrasesWrapper);
        }

        wrapper.style.display = 'flex';
        return wrapper;
    }

    function syncKlipyGifToolbarMountState(textInput, menu = null) {
        applyKlipyGifMenuAlignmentState(menu);
        syncChatInputToolbarReservedSpace(textInput);
        syncNativeChatInputActionButtons(textInput);
    }

    function createKlipyGifToggleButton() {
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.innerHTML = '<span style="margin-right:4px;">🎞</span> GIF';
        toggleBtn.title = 'Ouvrir le picker GIF Klipy';
        toggleBtn.setAttribute('aria-label', 'Ouvrir le picker GIF Klipy');
        toggleBtn.style.background = 'linear-gradient(135deg, rgba(21,128,61,0.72) 0%, rgba(5,150,105,0.72) 100%)';
        toggleBtn.style.border = '1px solid rgba(74,222,128,0.26)';
        toggleBtn.style.color = '#ecfdf5';
        toggleBtn.style.fontSize = '12px';
        toggleBtn.style.fontWeight = '600';
        toggleBtn.style.padding = '6px 14px';
        toggleBtn.style.borderRadius = '999px';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.backdropFilter = 'blur(10px)';
        toggleBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)';
        toggleBtn.style.transition = 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)';

        toggleBtn.addEventListener('mouseenter', () => {
            toggleBtn.style.filter = 'brightness(1.12)';
            toggleBtn.style.transform = 'scale(1.02)';
            toggleBtn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
            toggleBtn.style.border = '1px solid rgba(134,239,172,0.42)';
        });

        toggleBtn.addEventListener('mouseleave', () => {
            toggleBtn.style.filter = 'brightness(1)';
            toggleBtn.style.transform = 'scale(1)';
            toggleBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)';
            toggleBtn.style.border = '1px solid rgba(74,222,128,0.26)';
        });

        return toggleBtn;
    }

    function createKlipyGifMenuSurface() {
        const menu = document.createElement('div');
        menu.setAttribute('data-tm-klipy-gif-menu', '1');
        menu.style.display = 'none';
        menu.style.position = 'absolute';
        menu.style.bottom = 'calc(100% + 8px)';
        menu.style.left = '0';
        menu.style.width = 'min(640px, calc(100vw - 28px))';
        menu.style.maxHeight = 'min(76vh, 620px)';
        menu.style.background = 'rgba(17,24,39,0.9)';
        menu.style.backdropFilter = 'blur(16px)';
        menu.style.border = '1px solid rgba(255,255,255,0.08)';
        menu.style.borderRadius = '16px';
        menu.style.padding = '10px';
        menu.style.boxShadow = '0 18px 45px rgba(0,0,0,0.48)';
        menu.style.flexDirection = 'column';
        menu.style.gap = '10px';
        menu.style.zIndex = '1000';
        menu.style.opacity = '0';
        menu.style.transform = 'translateY(10px) scale(0.95)';
        menu.style.transition = 'opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
        applyKlipyGifMenuAlignmentState(menu);
        return menu;
    }

    function buildKlipyGifMenuHeader() {
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.justifyContent = 'space-between';
        header.style.gap = '10px';

        const title = document.createElement('div');
        title.textContent = 'Klipy GIF';
        title.style.fontSize = '12px';
        title.style.fontWeight = '700';
        title.style.color = '#f8fafc';

        const subtitle = document.createElement('div');
        subtitle.textContent = '';
        subtitle.style.fontSize = '10px';
        subtitle.style.color = '#94a3b8';

        const titleBlock = document.createElement('div');
        titleBlock.appendChild(title);
        titleBlock.appendChild(subtitle);

        const providerLink = document.createElement('a');
        providerLink.href = 'https://klipy.com/';
        providerLink.target = '_blank';
        providerLink.rel = 'noreferrer noopener';
        providerLink.textContent = 'Klipy';
        providerLink.style.fontSize = '10px';
        providerLink.style.fontWeight = '700';
        providerLink.style.color = '#86efac';
        providerLink.style.textDecoration = 'none';

        header.appendChild(titleBlock);
        header.appendChild(providerLink);
        return header;
    }

    function createKlipyGifSearchInput() {
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Rechercher un GIF Klipy';
        searchInput.setAttribute('data-tm-klipy-search', '1');
        searchInput.style.width = '100%';
        searchInput.style.background = 'rgba(15,23,42,0.75)';
        searchInput.style.color = '#f8fafc';
        searchInput.style.border = '1px solid rgba(255,255,255,0.08)';
        searchInput.style.borderRadius = '12px';
        searchInput.style.padding = '10px 12px';
        searchInput.style.outline = 'none';
        searchInput.style.fontSize = '12px';
        return searchInput;
    }

    function createKlipyGifStatusElement() {
        const status = document.createElement('div');
        status.setAttribute('data-tm-klipy-status', '1');
        status.textContent = `Tendances Klipy. Tape au moins ${KLIPY_SEARCH_MIN_LENGTH} caractères pour chercher.`;
        status.style.fontSize = '11px';
        status.style.lineHeight = '1.45';
        status.style.color = '#cbd5f5';
        return status;
    }

    function createKlipyGifResultsGrid() {
        const results = document.createElement('div');
        results.setAttribute('data-tm-klipy-results', '1');
        results.style.display = 'grid';
        results.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
        results.style.gap = '8px';
        results.style.maxHeight = '420px';
        results.style.overflowY = 'auto';
        results.style.paddingRight = '2px';
        return results;
    }

    function createKlipyGifLoadMoreButton() {
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.type = 'button';
        loadMoreBtn.setAttribute('data-tm-klipy-more', '1');
        loadMoreBtn.textContent = 'Afficher plus';
        loadMoreBtn.style.display = 'none';
        loadMoreBtn.style.alignSelf = 'center';
        loadMoreBtn.style.border = '1px solid rgba(74,222,128,0.22)';
        loadMoreBtn.style.background = 'rgba(22,163,74,0.12)';
        loadMoreBtn.style.color = '#dcfce7';
        loadMoreBtn.style.borderRadius = '999px';
        loadMoreBtn.style.padding = '8px 12px';
        loadMoreBtn.style.fontSize = '11px';
        loadMoreBtn.style.fontWeight = '700';
        loadMoreBtn.style.cursor = 'pointer';
        return loadMoreBtn;
    }

    function createKlipyGifMenuFooter() {
        const footer = document.createElement('div');
        footer.textContent = '';
        footer.style.fontSize = '10px';
        footer.style.lineHeight = '1.45';
        footer.style.color = '#64748b';
        return footer;
    }

    function createKlipyGifMenuView() {
        const menu = createKlipyGifMenuSurface();
        const header = buildKlipyGifMenuHeader();
        const searchInput = createKlipyGifSearchInput();
        const status = createKlipyGifStatusElement();
        const results = createKlipyGifResultsGrid();
        const loadMoreBtn = createKlipyGifLoadMoreButton();
        const footer = createKlipyGifMenuFooter();

        menu.appendChild(header);
        menu.appendChild(searchInput);
        menu.appendChild(status);
        menu.appendChild(results);
        menu.appendChild(loadMoreBtn);
        menu.appendChild(footer);

        return { menu, searchInput, loadMoreBtn };
    }

    function bindKlipyGifToolbarInteractions(toggleBtn, menu, searchInput, loadMoreBtn) {
        toggleBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (menu.dataset.tmOpen === '1') {
                hideKlipyGifMenu(menu);
                return;
            }

            closeSavedPhrasesMenu();
            closeImageUploadMenu();
            closeKlipyGifMenu();
            showKlipyGifMenu(menu);

            if (menu.dataset.tmKlipyLoaded !== '1') {
                loadKlipyGifResults(menu);
            }

            searchInput.focus();
        });

        searchInput.addEventListener('input', () => {
            delete menu.dataset.tmKlipyLoaded;
            delete menu.dataset.tmKlipyNext;
            scheduleKlipyGifSearch(menu);
        });

        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                clearKlipyGifSearchDebounce();
                loadKlipyGifResults(menu);
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                hideKlipyGifMenu(menu);
            }
        });

        loadMoreBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            loadKlipyGifResults(menu, { append: true });
        });

        menu.addEventListener('click', (event) => {
            event.stopPropagation();
        });
    }

    function initializeKlipyGifToolbarWrapper(wrapper) {
        wrapper.innerHTML = '';

        const toggleBtn = createKlipyGifToggleButton();
        const { menu, searchInput, loadMoreBtn } = createKlipyGifMenuView();

        bindKlipyGifToolbarInteractions(toggleBtn, menu, searchInput, loadMoreBtn);

        wrapper.appendChild(toggleBtn);
        wrapper.appendChild(menu);
        wrapper.dataset.tmInitialized = '1';
    }

    /**
     * Monte le bouton et le picker GIF Klipy dans la toolbar du chat.
     *
     * @returns {void}
     */
    function injectKlipyGifToolbar() {
        if (!isSupportedPage()) return;
        if (!klipyGifsEnabled) {
            removeKlipyGifToolbar();
            return;
        }

        installKlipyGifToolbarGlobalHandlers();

        const textInput = getChatInput();
        if (!textInput) return;
        const mountContext = getChatInputToolbarMountContext(textInput);
        const rail = getOrCreateChatInputToolbarRail(mountContext);
        if (!(rail instanceof HTMLElement)) return;

        const wrapper = getOrCreateKlipyGifToolbarWrapper(rail);
        if (wrapper.dataset.tmInitialized === '1') {
            syncKlipyGifToolbarMountState(textInput);
            return;
        }

        initializeKlipyGifToolbarWrapper(wrapper);
        syncKlipyGifToolbarMountState(textInput, getKlipyGifMenu());
    }

    function getImageUploadMenu() {
        const menu = document.querySelector('[data-tm-image-upload-menu="1"]');
        return menu instanceof HTMLElement ? menu : null;
    }

    function getImageUploadMenuAnchor() {
        const wrapper = document.getElementById(IMAGE_UPLOAD_MENU_WRAPPER_ID);
        return wrapper instanceof HTMLElement ? wrapper : null;
    }

    function applyImageUploadMenuAlignmentState(menu = getImageUploadMenu()) {
        if (!(menu instanceof HTMLElement)) return;

        if (chatInputToolbarAlignRight) {
            menu.style.left = 'auto';
            menu.style.right = '0';
            menu.style.transformOrigin = 'bottom right';
            if (menu.dataset.tmOpen === '1') positionImageUploadMenu(menu);
            return;
        }

        menu.style.left = '0';
        menu.style.right = 'auto';
        menu.style.transformOrigin = 'bottom left';
        if (menu.dataset.tmOpen === '1') positionImageUploadMenu(menu);
    }

    function positionImageUploadMenu(menu) {
        if (!(menu instanceof HTMLElement)) return;

        const anchor = getImageUploadMenuAnchor();
        if (!(anchor instanceof HTMLElement)) return;

        if (isChatPage() && document.body instanceof HTMLElement) {
            if (menu.parentElement !== document.body) {
                document.body.appendChild(menu);
            }

            menu.style.setProperty('position', 'fixed', 'important');
            menu.style.setProperty('right', 'auto', 'important');
            menu.style.setProperty('bottom', 'auto', 'important');
            menu.style.setProperty('left', '-9999px', 'important');
            menu.style.setProperty('top', '-9999px', 'important');
            menu.style.setProperty('z-index', '1600', 'important');

            const anchorRect = anchor.getBoundingClientRect();
            const menuRect = menu.getBoundingClientRect();
            if (anchorRect.width <= 0 || anchorRect.height <= 0 || menuRect.width <= 0 || menuRect.height <= 0) return;

            const maxLeft = Math.max(8, window.innerWidth - menuRect.width - 8);
            const maxTop = Math.max(8, window.innerHeight - menuRect.height - 8);
            const nextLeft = chatInputToolbarAlignRight
                ? clamp(anchorRect.right - menuRect.width, 8, maxLeft)
                : clamp(anchorRect.left, 8, maxLeft);
            const nextTop = clamp(anchorRect.top - menuRect.height - 8, 8, maxTop);

            menu.style.setProperty('left', `${nextLeft}px`, 'important');
            menu.style.setProperty('top', `${nextTop}px`, 'important');
            menu.style.transformOrigin = chatInputToolbarAlignRight ? 'bottom right' : 'bottom left';
            return;
        }

        if (menu.parentElement !== anchor) {
            anchor.appendChild(menu);
        }

        menu.style.setProperty('position', 'absolute', 'important');
        menu.style.setProperty('top', 'auto', 'important');
        menu.style.setProperty('bottom', 'calc(100% + 8px)', 'important');
        menu.style.setProperty('z-index', isHomePage() ? '1400' : '1500', 'important');

        if (chatInputToolbarAlignRight) {
            menu.style.setProperty('left', 'auto', 'important');
            menu.style.setProperty('right', '0', 'important');
            menu.style.transformOrigin = 'bottom right';
            return;
        }

        menu.style.setProperty('left', '0', 'important');
        menu.style.setProperty('right', 'auto', 'important');
        menu.style.transformOrigin = 'bottom left';
    }

    function clearImageUploadMenuHideTimer(menu) {
        if (!(menu instanceof HTMLElement)) return;

        const timerId = Number(menu.dataset.tmHideTimerId || 0);
        if (timerId > 0) {
            clearTimeout(timerId);
            delete menu.dataset.tmHideTimerId;
        }
    }

    function clearImageUploadMenuRepositionFrame(menu) {
        if (!(menu instanceof HTMLElement)) return;

        const frameId = Number(menu.dataset.tmPositionFrameId || 0);
        if (frameId > 0) {
            window.cancelAnimationFrame(frameId);
            delete menu.dataset.tmPositionFrameId;
        }
    }

    function scheduleImageUploadMenuReposition(menu, frameCount = 2) {
        if (!(menu instanceof HTMLElement)) return;

        clearImageUploadMenuRepositionFrame(menu);
        let remainingFrames = Math.max(1, Number(frameCount) || 1);

        const tick = () => {
            if (!(menu instanceof HTMLElement) || menu.dataset.tmOpen !== '1') {
                delete menu.dataset.tmPositionFrameId;
                return;
            }

            positionImageUploadMenu(menu);
            remainingFrames -= 1;

            if (remainingFrames <= 0) {
                delete menu.dataset.tmPositionFrameId;
                return;
            }

            const nextFrameId = window.requestAnimationFrame(tick);
            menu.dataset.tmPositionFrameId = String(nextFrameId);
        };

        const initialFrameId = window.requestAnimationFrame(tick);
        menu.dataset.tmPositionFrameId = String(initialFrameId);
    }

    function showImageUploadMenu(menu) {
        if (!(menu instanceof HTMLElement)) return;

        clearImageUploadMenuHideTimer(menu);
        refreshImageUploadMenu(menu);
        menu.style.display = 'flex';
        menu.dataset.tmOpen = '1';
        positionImageUploadMenu(menu);
        scheduleImageUploadMenuReposition(menu, 3);
        void menu.offsetWidth;
        menu.style.opacity = '1';
        menu.style.transform = 'translateY(0) scale(1)';
    }

    function hideImageUploadMenu(menu) {
        if (!(menu instanceof HTMLElement)) return;

        clearImageUploadMenuHideTimer(menu);
        clearImageUploadMenuRepositionFrame(menu);
        menu.dataset.tmOpen = '0';
        menu.style.opacity = '0';
        menu.style.transform = 'translateY(10px) scale(0.95)';

        const timerId = window.setTimeout(() => {
            if (menu.dataset.tmOpen === '1') return;

            menu.style.display = 'none';
            delete menu.dataset.tmHideTimerId;
        }, 200);

        menu.dataset.tmHideTimerId = String(timerId);
    }

    function closeImageUploadMenu() {
        const menu = getImageUploadMenu();
        if (menu) {
            hideImageUploadMenu(menu);
        }
    }

    function removeImageUploadToolbar() {
        const menu = getImageUploadMenu();
        if (menu) {
            clearImageUploadMenuHideTimer(menu);
            clearImageUploadMenuRepositionFrame(menu);
            menu.remove();
        }

        const wrapper = document.getElementById(IMAGE_UPLOAD_MENU_WRAPPER_ID);
        if (wrapper) {
            wrapper.remove();
        }

        syncNativeChatInputActionButtons();
        syncChatInputToolbarReservedSpace();
    }

    function installImageUploadToolbarGlobalHandlers() {
        if (imageUploadToolbarEventsInstalled) return;

        imageUploadToolbarEventsInstalled = true;

        document.addEventListener('click', (event) => {
            const wrapper = document.getElementById(IMAGE_UPLOAD_MENU_WRAPPER_ID);
            const menu = getImageUploadMenu();
            if (!(wrapper instanceof HTMLElement)) return;
            if (event.target instanceof Node && wrapper.contains(event.target)) return;
            if (menu instanceof HTMLElement && event.target instanceof Node && menu.contains(event.target)) return;

            closeImageUploadMenu();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeImageUploadMenu();
        }, true);

        window.addEventListener('blur', () => {
            closeImageUploadMenu();
        });
    }

    function getImageUploadMenuElements(menu) {
        if (!(menu instanceof HTMLElement)) {
            return {
                expirationSelect: null,
                pickBtn: null,
                fileInput: null,
                dropzone: null,
                pendingList: null,
                uploadBtn: null,
                insertToggle: null,
                directUrlInput: null,
                directUrlAddBtn: null,
                catalogList: null,
                purgeBtn: null,
                status: null
            };
        }

        return {
            expirationSelect: menu.querySelector('[data-tm-upimg-expiration="1"]'),
            pickBtn: menu.querySelector('[data-tm-upimg-pick="1"]'),
            fileInput: menu.querySelector('[data-tm-upimg-file-input="1"]'),
            dropzone: menu.querySelector('[data-tm-upimg-dropzone="1"]'),
            pendingList: menu.querySelector('[data-tm-upimg-pending="1"]'),
            uploadBtn: menu.querySelector('[data-tm-upimg-upload="1"]'),
            insertToggle: menu.querySelector('[data-tm-upimg-insert-after-upload="1"]'),
            directUrlInput: menu.querySelector('[data-tm-upimg-direct-url="1"]'),
            directUrlAddBtn: menu.querySelector('[data-tm-upimg-add-url="1"]'),
            catalogList: menu.querySelector('[data-tm-upimg-catalog="1"]'),
            purgeBtn: menu.querySelector('[data-tm-upimg-purge="1"]'),
            status: menu.querySelector('[data-tm-upimg-status="1"]')
        };
    }

    function setImageUploadMenuStatus(menu, message, isError = false) {
        const { status } = getImageUploadMenuElements(menu);
        if (!(status instanceof HTMLElement)) return;

        status.textContent = message;
        status.style.color = isError ? '#fca5a5' : '#cbd5f5';
    }

    function renderImageUploadExpirationOptions(selectedSeconds = imageHostingExpirationSeconds) {
        return [
            [0, 'Permanent'],
            [600, '10 min'],
            [3600, '1 h'],
            [86400, '1 jour'],
            [604800, '7 jours'],
            [2592000, '30 jours'],
            [15552000, '180 jours']
        ].map(([value, label]) => `
            <option value="${value}" ${normalizeImageHostingExpirationSeconds(selectedSeconds) === value ? 'selected' : ''}>${label}</option>
        `).join('');
    }

    function setPendingImageUploadFiles(files) {
        pendingImageUploadFiles = extractImageFilesFromFileList(files).filter((file) => file.size <= IMAGE_UPLOAD_MAX_BYTES);
    }

    function appendPendingImageUploadFiles(files) {
        const nextFiles = extractImageFilesFromFileList(files).filter((file) => file.size <= IMAGE_UPLOAD_MAX_BYTES);
        pendingImageUploadFiles = [...pendingImageUploadFiles, ...nextFiles].slice(0, 12);
    }

    function setLocalImagePreviewSource(image, file) {
        if (!(image instanceof HTMLImageElement) || !(file instanceof File)) return;

        // Tr4ker n'autorise pas blob: dans img-src. Une Data URL est autorisée
        // par sa CSP et ne sert qu'à l'aperçu local avant l'upload.
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            if (!image.isConnected || typeof reader.result !== 'string') return;
            image.src = reader.result;
        }, { once: true });
        reader.addEventListener('error', () => {
            image.removeAttribute('src');
        }, { once: true });
        reader.readAsDataURL(file);
    }

    function refreshImageUploadPendingList(menu) {
        const { pendingList, uploadBtn } = getImageUploadMenuElements(menu);
        if (!(pendingList instanceof HTMLElement)) return;

        pendingList.innerHTML = '';

        if (pendingImageUploadFiles.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = 'Aucune image en attente.';
            empty.style.fontSize = '11px';
            empty.style.color = '#94a3b8';
            pendingList.appendChild(empty);
        } else {
            pendingImageUploadFiles.forEach((file, index) => {
                const row = document.createElement('div');
                row.style.display = 'grid';
                row.style.gridTemplateColumns = '56px minmax(0, 1fr) 24px';
                row.style.alignItems = 'center';
                row.style.gap = '8px';
                row.style.padding = '8px';
                row.style.borderRadius = '12px';
                row.style.background = 'rgba(255,255,255,0.04)';
                row.style.border = '1px solid rgba(255,255,255,0.06)';

                const preview = document.createElement('img');
                preview.alt = file.name || `Image ${index + 1}`;
                preview.loading = 'lazy';
                preview.style.width = '56px';
                preview.style.height = '56px';
                preview.style.borderRadius = '10px';
                preview.style.objectFit = 'cover';
                preview.style.background = '#09090b';
                preview.style.border = '1px solid rgba(255,255,255,0.08)';
                setLocalImagePreviewSource(preview, file);

                const body = document.createElement('div');
                body.style.minWidth = '0';

                const name = document.createElement('div');
                name.textContent = file.name || `image-${index + 1}`;
                name.title = `${name.textContent} · ${formatFileSize(file.size)}`;
                name.style.minWidth = '0';
                name.style.overflow = 'hidden';
                name.style.textOverflow = 'ellipsis';
                name.style.whiteSpace = 'nowrap';
                name.style.fontSize = '11px';
                name.style.fontWeight = '700';
                name.style.color = '#e2e8f0';

                const meta = document.createElement('div');
                meta.textContent = formatFileSize(file.size);
                meta.style.marginTop = '4px';
                meta.style.fontSize = '10px';
                meta.style.color = '#94a3b8';

                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.textContent = '×';
                removeBtn.title = 'Retirer cette image de la file';
                removeBtn.style.border = 'none';
                removeBtn.style.background = '#3f3f46';
                removeBtn.style.color = '#fff';
                removeBtn.style.width = '24px';
                removeBtn.style.height = '24px';
                removeBtn.style.borderRadius = '8px';
                removeBtn.style.cursor = 'pointer';
                removeBtn.style.flex = '0 0 auto';
                removeBtn.addEventListener('click', () => {
                    pendingImageUploadFiles = pendingImageUploadFiles.filter((_, fileIndex) => fileIndex !== index);
                    refreshImageUploadMenu(menu);
                });

                body.appendChild(name);
                body.appendChild(meta);
                row.appendChild(preview);
                row.appendChild(body);
                row.appendChild(removeBtn);
                pendingList.appendChild(row);
            });
        }

        if (uploadBtn instanceof HTMLButtonElement) {
            uploadBtn.disabled = pendingImageUploadFiles.length === 0;
            uploadBtn.style.opacity = pendingImageUploadFiles.length === 0 ? '0.55' : '1';
            uploadBtn.style.cursor = pendingImageUploadFiles.length === 0 ? 'not-allowed' : 'pointer';
        }
    }

    function createImageUploadCatalogItem(record, menu) {
        const card = document.createElement('div');
        card.style.display = 'grid';
        card.style.gridTemplateColumns = '48px minmax(0, 1fr)';
        card.style.gap = '8px';
        card.style.padding = '8px';
        card.style.borderRadius = '12px';
        card.style.background = 'rgba(255,255,255,0.03)';
        card.style.border = '1px solid rgba(255,255,255,0.06)';

        const image = document.createElement('img');
        image.src = record.thumbUrl || record.url;
        image.alt = record.title || 'Image';
        image.loading = 'lazy';
        image.referrerPolicy = 'no-referrer';
        image.style.width = '48px';
        image.style.height = '48px';
        image.style.borderRadius = '9px';
        image.style.objectFit = 'cover';
        image.style.background = '#09090b';
        image.addEventListener('error', () => {
            const result = removeImageCatalogRecord(record.id);
            if (result.ok) {
                refreshImageUploadMenu(menu);
                setImageUploadMenuStatus(menu, 'Image invalide retirée du catalogue.');
            }
        }, { once: true });

        const body = document.createElement('div');
        body.style.minWidth = '0';

        const title = document.createElement('div');
        title.textContent = record.title || 'Image';
        title.title = record.title || record.url;
        title.style.fontSize = '11px';
        title.style.fontWeight = '700';
        title.style.color = '#f8fafc';
        title.style.overflow = 'hidden';
        title.style.textOverflow = 'ellipsis';
        title.style.whiteSpace = 'nowrap';

        const meta = document.createElement('div');
        meta.textContent = record.expiresAt ? `expire ${formatImageCatalogDate(record.expiresAt)}` : 'permanent';
        meta.style.fontSize = '10px';
        meta.style.color = '#94a3b8';
        meta.style.marginTop = '3px';

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '6px';
        actions.style.flexWrap = 'wrap';
        actions.style.marginTop = '7px';

        const insertBtn = document.createElement('button');
        insertBtn.type = 'button';
        insertBtn.textContent = 'Insérer';
        insertBtn.style.border = 'none';
        insertBtn.style.background = '#0f766e';
        insertBtn.style.color = '#fff';
        insertBtn.style.borderRadius = '8px';
        insertBtn.style.padding = '6px 8px';
        insertBtn.style.cursor = 'pointer';
        insertBtn.style.fontSize = '11px';
        insertBtn.style.fontWeight = '700';
        insertBtn.addEventListener('click', () => {
            const result = insertImageIntoChatInput(getChatInput(), record.url);
            setImageUploadMenuStatus(menu, result.message, !result.ok);
            if (result.ok) hideImageUploadMenu(menu);
        });

        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.textContent = 'Copier';
        copyBtn.style.border = 'none';
        copyBtn.style.background = '#2563eb';
        copyBtn.style.color = '#fff';
        copyBtn.style.borderRadius = '8px';
        copyBtn.style.padding = '6px 8px';
        copyBtn.style.cursor = 'pointer';
        copyBtn.style.fontSize = '11px';
        copyBtn.style.fontWeight = '700';
        copyBtn.addEventListener('click', async () => {
            const copied = await copyTextToClipboard(record.url);
            setImageUploadMenuStatus(menu, copied ? 'Lien image copié.' : 'Copie impossible.', !copied);
        });

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = record.deleteUrl ? 'Suppr.' : 'Retirer';
        removeBtn.title = record.deleteUrl
            ? 'Supprimer via ImgBB, vérifier que l’image ne charge plus, puis retirer l’entrée locale'
            : 'Retirer seulement cette entrée du catalogue local';
        removeBtn.style.border = 'none';
        removeBtn.style.background = '#3f3f46';
        removeBtn.style.color = '#fca5a5';
        removeBtn.style.borderRadius = '8px';
        removeBtn.style.padding = '6px 8px';
        removeBtn.style.cursor = 'pointer';
        removeBtn.style.fontSize = '11px';
        removeBtn.style.fontWeight = '700';
        removeBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (record.deleteUrl) {
                const confirmed = await confirmImageCatalogRemoteDeletion(record);
                if (!confirmed) return;
                setImageUploadMenuStatus(menu, 'Suppression ImgBB en cours, vérification du lien image...');
            }

            removeBtn.disabled = true;
            removeBtn.style.opacity = '0.65';
            const result = await deleteImageCatalogRecord(record);
            refreshImageUploadMenu(menu);
            setImageUploadMenuStatus(menu, result.message, !result.ok);
        });

        actions.appendChild(insertBtn);
        actions.appendChild(copyBtn);
        actions.appendChild(removeBtn);
        body.appendChild(title);
        body.appendChild(meta);
        body.appendChild(actions);
        card.appendChild(image);
        card.appendChild(body);
        return card;
    }

    function refreshImageUploadCatalogList(menu) {
        const { catalogList } = getImageUploadMenuElements(menu);
        if (!(catalogList instanceof HTMLElement)) return;

        saveImageCatalog(imageCatalog);
        catalogList.innerHTML = '';

        if (imageCatalog.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = 'Aucune image cataloguée.';
            empty.style.fontSize = '11px';
            empty.style.color = '#94a3b8';
            empty.style.padding = '6px 2px';
            catalogList.appendChild(empty);
            return;
        }

        imageCatalog.slice(0, 8).forEach((record) => {
            catalogList.appendChild(createImageUploadCatalogItem(record, menu));
        });
    }

    function refreshImageUploadMenu(menu) {
        const elements = getImageUploadMenuElements(menu);

        if (elements.expirationSelect instanceof HTMLSelectElement) {
            elements.expirationSelect.value = String(imageHostingExpirationSeconds);
        }

        refreshImageUploadPendingList(menu);
        refreshImageUploadCatalogList(menu);
        scheduleImageUploadMenuReposition(menu, 2);
    }

    async function uploadPendingImageFilesFromMenu(menu) {
        const { insertToggle } = getImageUploadMenuElements(menu);
        const shouldInsertAfterUpload = insertToggle instanceof HTMLInputElement ? insertToggle.checked : true;
        const files = [...pendingImageUploadFiles];

        if (files.length === 0) {
            setImageUploadMenuStatus(menu, 'Aucune image à uploader.', true);
            return;
        }

        if (!normalizeImgBbApiKey(imgbbApiKey)) {
            setImageUploadMenuStatus(menu, 'Renseigne la clé API ImgBB dans les paramètres avant l’upload.', true);
            return;
        }

        const uploadedRecords = [];

        for (const file of files) {
            setImageUploadMenuStatus(menu, `Upload en cours : ${file.name || 'image'}...`);
            try {
                const record = await uploadImageFileToImgBb(file, imageHostingExpirationSeconds);
                const result = addImageCatalogRecord(record);
                if (!result.ok) throw new Error(result.message);
                uploadedRecords.push(record);
            } catch (e) {
                setImageUploadMenuStatus(menu, e?.message || 'Upload ImgBB impossible.', true);
                refreshImageUploadMenu(menu);
                return;
            }
        }

        pendingImageUploadFiles = [];
        refreshImageUploadMenu(menu);

        if (shouldInsertAfterUpload && uploadedRecords.length > 0) {
            const input = getChatInput();
            const markup = uploadedRecords.map((record) => buildImageEmbedMarkup(record.url)).filter(Boolean).join(' ');
            const result = insertTextIntoChatInput(input, markup, 'Image insérée après upload.');
            setImageUploadMenuStatus(
                menu,
                result.ok
                    ? `${uploadedRecords.length} image${uploadedRecords.length > 1 ? 's' : ''} uploadée${uploadedRecords.length > 1 ? 's' : ''} et insérée${uploadedRecords.length > 1 ? 's' : ''}.`
                    : result.message,
                !result.ok
            );
            if (result.ok) hideImageUploadMenu(menu);
            return;
        }

        setImageUploadMenuStatus(menu, `${uploadedRecords.length} image${uploadedRecords.length > 1 ? 's' : ''} uploadée${uploadedRecords.length > 1 ? 's' : ''}.`);
    }

    function createImageUploadToggleButton() {
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.innerHTML = '<span style="margin-right:4px;">↑</span> Up-Img';
        toggleBtn.title = 'Uploader ou insérer une image';
        toggleBtn.setAttribute('aria-label', 'Uploader ou insérer une image');
        toggleBtn.style.background = 'linear-gradient(135deg, rgba(2,132,199,0.78) 0%, rgba(14,116,144,0.78) 100%)';
        toggleBtn.style.border = '1px solid rgba(125,211,252,0.30)';
        toggleBtn.style.color = '#ecfeff';
        toggleBtn.style.fontSize = '12px';
        toggleBtn.style.fontWeight = '600';
        toggleBtn.style.padding = '6px 14px';
        toggleBtn.style.borderRadius = '999px';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.backdropFilter = 'blur(10px)';
        toggleBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)';
        toggleBtn.style.transition = 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
        return toggleBtn;
    }

    function createImageUploadMenuSurface() {
        const menu = document.createElement('div');
        menu.setAttribute('data-tm-image-upload-menu', '1');
        menu.style.display = 'none';
        menu.style.position = 'absolute';
        menu.style.bottom = 'calc(100% + 8px)';
        menu.style.left = '0';
        menu.style.width = 'min(560px, calc(100vw - 28px))';
        menu.style.maxHeight = 'min(76vh, 640px)';
        menu.style.background = 'rgba(17,24,39,0.94)';
        menu.style.backdropFilter = 'blur(16px)';
        menu.style.border = '1px solid rgba(255,255,255,0.08)';
        menu.style.borderRadius = '16px';
        menu.style.padding = '10px';
        menu.style.boxShadow = '0 18px 45px rgba(0,0,0,0.48)';
        menu.style.flexDirection = 'column';
        menu.style.gap = '10px';
        menu.style.zIndex = '1000';
        menu.style.opacity = '0';
        menu.style.transform = 'translateY(10px) scale(0.95)';
        menu.style.transition = 'opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
        menu.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
                <div>
                    <div style="font-size:12px;font-weight:700;color:#f8fafc;">Upload image</div>
                    <div style="font-size:10px;color:#94a3b8;margin-top:2px;">ImgBB · ${imageCatalog.length} image${imageCatalog.length > 1 ? 's' : ''} cataloguée${imageCatalog.length > 1 ? 's' : ''}</div>
                </div>
            </div>

            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:flex-end;">
                <span style="font-size:11px;color:#cbd5e1;">Durée de vie</span>
                <select data-tm-upimg-expiration="1" style="background:rgba(15,23,42,0.75);color:#f8fafc;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:9px 10px;outline:none;font-size:12px;">
                    ${renderImageUploadExpirationOptions()}
                </select>
            </div>

            <div data-tm-upimg-dropzone="1" tabindex="0" style="padding:12px;border-radius:14px;border:1px dashed rgba(56,189,248,0.46);background:rgba(14,165,233,0.08);color:#e0f2fe;outline:none;">
                <div style="font-size:12px;font-weight:700;">Coller ou glisser une image</div>
                <div style="font-size:10px;color:#93c5fd;line-height:1.45;margin-top:4px;">Ctrl+V depuis l’input du chat ouvre aussi ce panneau.</div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:9px;">
                    <button data-tm-upimg-pick="1" type="button" style="border:none;background:#0284c7;color:#fff;border-radius:10px;padding:8px 10px;cursor:pointer;font-size:11px;font-weight:700;">Choisir image</button>
                    <label style="display:flex;align-items:center;gap:7px;font-size:11px;color:#cbd5e1;cursor:pointer;">
                        <input data-tm-upimg-insert-after-upload="1" type="checkbox" checked style="width:14px;height:14px;accent-color:#06b6d4;">
                        <span>Insérer après upload</span>
                    </label>
                    <input data-tm-upimg-file-input="1" type="file" accept="image/*" multiple style="display:none;">
                </div>
            </div>

            <div data-tm-upimg-pending="1" style="display:grid;gap:6px;"></div>

            <button data-tm-upimg-upload="1" type="button" style="border:none;background:#0f766e;color:#fff;border-radius:10px;padding:9px 11px;cursor:pointer;font-size:12px;font-weight:700;">Uploader</button>

            <div style="display:flex;gap:8px;align-items:center;">
                <input data-tm-upimg-direct-url="1" type="url" placeholder="Ajouter un lien direct image" style="flex:1;min-width:0;background:rgba(15,23,42,0.75);color:#f8fafc;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:9px 10px;outline:none;font-size:12px;">
                <button data-tm-upimg-add-url="1" type="button" style="border:none;background:#3f3f46;color:#fff;border-radius:10px;padding:9px 10px;cursor:pointer;font-size:11px;font-weight:700;">Ajouter</button>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                <div style="font-size:12px;font-weight:700;color:#d4d4d8;">Catalogue</div>
                <button data-tm-upimg-purge="1" type="button" style="border:none;background:#3f3f46;color:#fff;border-radius:999px;padding:6px 9px;cursor:pointer;font-size:10px;font-weight:700;">Purger</button>
            </div>
            <div data-tm-upimg-catalog="1" style="display:grid;gap:8px;max-height:250px;overflow-y:auto;padding-right:2px;"></div>
            <div data-tm-upimg-status="1" style="min-height:16px;font-size:11px;line-height:1.45;color:#cbd5f5;"></div>
        `;
        applyImageUploadMenuAlignmentState(menu);
        return menu;
    }

    function bindImageUploadMenuInteractions(toggleBtn, menu) {
        const elements = getImageUploadMenuElements(menu);

        toggleBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (menu.dataset.tmOpen === '1') {
                hideImageUploadMenu(menu);
                return;
            }

            closeSavedPhrasesMenu();
            closeKlipyGifMenu();
            showImageUploadMenu(menu);
        });

        elements.expirationSelect?.addEventListener('change', () => {
            saveImageHostingExpirationSeconds(elements.expirationSelect?.value);
            refreshImageUploadMenu(menu);
            setImageUploadMenuStatus(menu, `Durée de vie : ${formatImageHostingExpirationLabel()}.`);
        });

        elements.pickBtn?.addEventListener('click', () => elements.fileInput?.click());

        elements.fileInput?.addEventListener('change', () => {
            if (elements.fileInput instanceof HTMLInputElement) {
                appendPendingImageUploadFiles(elements.fileInput.files);
                elements.fileInput.value = '';
                refreshImageUploadMenu(menu);
                showImageUploadMenu(menu);
            }
        });

        elements.dropzone?.addEventListener('dragover', (event) => {
            event.preventDefault();
            if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
        });

        elements.dropzone?.addEventListener('drop', (event) => {
            event.preventDefault();
            appendPendingImageUploadFiles(extractImageFilesFromDataTransfer(event.dataTransfer));
            refreshImageUploadMenu(menu);
        });

        elements.dropzone?.addEventListener('paste', (event) => {
            const files = extractImageFilesFromDataTransfer(event.clipboardData);
            if (files.length === 0) return;
            event.preventDefault();
            appendPendingImageUploadFiles(files);
            refreshImageUploadMenu(menu);
        });

        elements.uploadBtn?.addEventListener('click', () => {
            uploadPendingImageFilesFromMenu(menu);
        });

        elements.directUrlAddBtn?.addEventListener('click', async () => {
            const url = elements.directUrlInput instanceof HTMLInputElement ? elements.directUrlInput.value : '';
            setImageUploadMenuStatus(menu, 'Validation du lien image...');
            const result = await addManualImageCatalogUrl(url);
            refreshImageUploadMenu(menu);
            setImageUploadMenuStatus(menu, result.message, !result.ok);
            if (result.ok && elements.directUrlInput instanceof HTMLInputElement) {
                elements.directUrlInput.value = '';
            }
        });

        elements.directUrlInput?.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            elements.directUrlAddBtn?.click();
        });

        elements.purgeBtn?.addEventListener('click', async () => {
            const fakeControls = {
                setFeedback: (message, isError = false) => setImageUploadMenuStatus(menu, message, isError),
                refreshImageCatalogList: () => refreshImageUploadMenu(menu)
            };
            const result = await purgeInvalidImageCatalogRecords({}, fakeControls);
            refreshImageUploadMenu(menu);
            setImageUploadMenuStatus(menu, result.message, !result.ok);
        });

        menu.addEventListener('click', (event) => event.stopPropagation());
    }

    function getOrCreateImageUploadToolbarWrapper(rail) {
        let wrapper = document.getElementById(IMAGE_UPLOAD_MENU_WRAPPER_ID);
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.id = IMAGE_UPLOAD_MENU_WRAPPER_ID;
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.justifyContent = 'flex-start';
            wrapper.style.position = 'relative';
            wrapper.style.zIndex = '50';
            wrapper.style.overflow = 'visible';
            wrapper.style.pointerEvents = 'auto';
        }

        wrapper.style.zIndex = isChatPage() ? '280' : '50';

        const phrasesWrapper = document.getElementById(PHRASES_MENU_WRAPPER_ID);
        if (wrapper.parentNode !== rail) {
            if (phrasesWrapper instanceof HTMLElement && phrasesWrapper.parentElement === rail) {
                rail.insertBefore(wrapper, phrasesWrapper);
            } else {
                rail.appendChild(wrapper);
            }
        } else if (phrasesWrapper instanceof HTMLElement && phrasesWrapper.parentElement === rail && wrapper.nextElementSibling !== phrasesWrapper) {
            rail.insertBefore(wrapper, phrasesWrapper);
        }

        wrapper.style.display = 'flex';
        return wrapper;
    }

    function initializeImageUploadToolbarWrapper(wrapper) {
        wrapper.innerHTML = '';

        const toggleBtn = createImageUploadToggleButton();
        const menu = createImageUploadMenuSurface();
        bindImageUploadMenuInteractions(toggleBtn, menu);

        wrapper.appendChild(toggleBtn);
        wrapper.appendChild(menu);
        wrapper.dataset.tmInitialized = '1';
    }

    function syncImageUploadToolbarMountState(textInput, menu = null) {
        applyImageUploadMenuAlignmentState(menu);
        syncChatInputToolbarReservedSpace(textInput);
        syncNativeChatInputActionButtons(textInput);
    }

    function injectImageUploadToolbar() {
        if (!isSupportedPage()) return;
        if (!imageHostingEnabled) {
            removeImageUploadToolbar();
            return;
        }

        installImageUploadToolbarGlobalHandlers();

        const textInput = getChatInput();
        if (!textInput) return;
        const mountContext = getChatInputToolbarMountContext(textInput);
        const rail = getOrCreateChatInputToolbarRail(mountContext);
        if (!(rail instanceof HTMLElement)) return;

        const wrapper = getOrCreateImageUploadToolbarWrapper(rail);
        if (wrapper.dataset.tmInitialized === '1') {
            syncImageUploadToolbarMountState(textInput);
            return;
        }

        initializeImageUploadToolbarWrapper(wrapper);
        syncImageUploadToolbarMountState(textInput, getImageUploadMenu());
    }

    function openImageUploadMenuWithFiles(files) {
        const imageFiles = extractImageFilesFromFileList(files);
        if (imageFiles.length === 0) return false;

        if (!imageHostingEnabled) {
            showToast('Upload image désactivé dans les paramètres.', true);
            return false;
        }

        injectImageUploadToolbar();
        const menu = getImageUploadMenu();
        if (!(menu instanceof HTMLElement)) {
            showToast('Bouton Up-Img indisponible.', true);
            return false;
        }

        setPendingImageUploadFiles(imageFiles);
        showImageUploadMenu(menu);
        if (pendingImageUploadFiles.length === 0) {
            setImageUploadMenuStatus(menu, `Image trop lourde. Taille max : ${formatFileSize(IMAGE_UPLOAD_MAX_BYTES)}.`, true);
            return true;
        }

        setImageUploadMenuStatus(menu, `${pendingImageUploadFiles.length} image${pendingImageUploadFiles.length > 1 ? 's' : ''} prête${pendingImageUploadFiles.length > 1 ? 's' : ''} à uploader.`);
        return true;
    }

    function installImagePasteHandler() {
        if (imagePasteHandlerInstalled) return;
        imagePasteHandlerInstalled = true;

        document.addEventListener('paste', (event) => {
            if (!imageHostingEnabled || !isSupportedPage()) return;

            const target = event.target;
            if (!(target instanceof HTMLElement)) return;

            const input = isChatInputCandidate(target)
                ? target
                : target.closest('input[type="text"], textarea, [contenteditable="true"]');
            if (!(input instanceof HTMLElement) || !isChatInputCandidate(input)) return;

            const files = extractImageFilesFromDataTransfer(event.clipboardData);
            if (files.length === 0) return;

            event.preventDefault();
            openImageUploadMenuWithFiles(files);
        }, true);
    }

    function startObserver() {
        if (observer) observer.disconnect();

        const target = getActiveChatRoot();
        if (!target) return;

        observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(processNode);
            }
        });

        observer.observe(target, {
            childList: true,
            subtree: true
        });
    }

    function findMessageElementFromTarget(target) {
        let current = target instanceof HTMLElement ? target : null;

        while (current && current !== document.body) {
            if (isChatMessage(current)) return current;
            current = current.parentElement;
        }

        return null;
    }

    function getMessageTextContent(messageEl) {
        if (!(messageEl instanceof HTMLElement)) return '';

        if (isTr4kerPage()) {
            const textBlock = messageEl.querySelector('[class*="msgBubble"]');
            return (textBlock?.textContent || '').trim();
        }

        if (isChatPage()) {
            const textBlock = messageEl.querySelector(':scope > .flex-1.min-w-0 > .text-sm.text-gray-200.break-words');
            return (textBlock?.textContent || '').trim();
        }

        if (isHomePage()) {
            const textBlock = messageEl.querySelector(':scope > .flex-1.min-w-0 > p.break-words.leading-snug');
            return (textBlock?.textContent || '').trim();
        }

        return '';
    }

    function getMessageTimestampText(messageEl) {
        if (!(messageEl instanceof HTMLElement)) return '';

        if (isTr4kerPage()) {
            return String(messageEl.querySelector('[class*="msgTime"]')?.textContent || '').trim();
        }

        if (isChatPage()) {
            const metaSpans = Array.from(messageEl.querySelectorAll(':scope > .flex-1.min-w-0 > .flex.items-baseline span'));
            const parsedCandidate = metaSpans
                .map((span) => (span.textContent || '').trim())
                .find((text) => parseMessageTimestampKey(text) > 0);

            if (parsedCandidate) return parsedCandidate;

            return metaSpans
                .map((span) => (span.textContent || '').trim())
                .filter(Boolean)
                .pop() || '';
        }

        if (isHomePage()) {
            const metaSpans = messageEl.querySelectorAll(':scope > .flex-1.min-w-0 > .flex.items-center span:not(.text-xs.font-bold)');
            return Array.from(metaSpans)
                .map((span) => span.textContent.trim())
                .filter(Boolean)
                .join(' | ');
        }

        return '';
    }

    function parseMessageTimestampKey(timestampText) {
        const raw = String(timestampText || '').trim();
        if (!raw) return 0;

        const match = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s*[aà]\s*|\s+)(\d{1,2}):(\d{2})(?::(\d{2}))?/i);
        if (!match) return 0;

        const [, dayRaw, monthRaw, yearRaw, hourRaw, minuteRaw, secondRaw = '0'] = match;
        const day = Number(dayRaw);
        const monthIndex = Number(monthRaw) - 1;
        const year = Number(yearRaw);
        const hour = Number(hourRaw);
        const minute = Number(minuteRaw);
        const second = Number(secondRaw);

        const timestamp = new Date(year, monthIndex, day, hour, minute, second).getTime();
        return Number.isFinite(timestamp) ? timestamp : 0;
    }

    function getMentionNotificationSignature(messageEl) {
        if (!(messageEl instanceof HTMLElement)) return null;

        const username = normalizeName(getLogicalUsername(messageEl) || '');
        const messageText = getMessageTextContent(messageEl);
        const replyContextText = getMessageReplyContextText(messageEl);
        const messageTimestamp = getMessageTimestampText(messageEl);
        const messageTimestampKey = parseMessageTimestampKey(messageTimestamp);
        const normalizedMessageText = normalizeMentionComparableText(messageText);
        const normalizedReplyContextText = normalizeMentionComparableText(replyContextText).replace(/^@+/, '');
        const stableTimestampToken = isTr4kerPage() && messageEl.hasAttribute('data-msg-id')
            ? `id:${messageEl.getAttribute('data-msg-id')}`
            : messageTimestampKey > 0
            ? String(messageTimestampKey)
            : normalizeMentionComparableText(messageTimestamp);

        if (!username || (!messageText && !replyContextText)) {
            logMentionDebug('signature: invalid message data', {
                username,
                messageText,
                replyContextText,
                messageTimestamp,
                messageTimestampKey
            });
            return null;
        }

        if (messageTimestamp && messageTimestampKey <= 0) {
            logMentionDebug('signature: timestamp not parsed, using hash fallback only', {
                username,
                messageTimestamp,
                messageText,
                replyContextText
            });
        }

        const signatureParts = [username, stableTimestampToken, normalizedMessageText];

        // Keep reply-context-only mentions distinct without making home/chat hashes diverge.
        if (!normalizedMessageText && normalizedReplyContextText) {
            signatureParts.push(`reply:${normalizedReplyContextText}`);
        }

        return {
            hash: hashString(signatureParts.join('|')),
            messageTimestamp,
            messageTimestampKey
        };
    }

    function getMessageReplyContextText(messageEl) {
        if (!(messageEl instanceof HTMLElement) || !isChatPage()) return '';

        if (isTr4kerPage()) {
            const author = messageEl.querySelector('[class*="quoteAuthor"]');
            const body = messageEl.querySelector('[class*="quoteBody"]');
            return [author?.textContent, body?.textContent].filter(Boolean).join(' : ').trim();
        }

        const replyButton = messageEl.querySelector(':scope > .flex-1.min-w-0 > .flex.items-center.gap-2.mb-1.text-xs button[type="button"]');
        return String(replyButton?.textContent || '').trim();
    }

    function getMessageReplyAuthorText(messageEl) {
        if (!(messageEl instanceof HTMLElement) || !isChatPage()) return '';

        if (isTr4kerPage()) {
            return String(messageEl.querySelector('[class*="quoteAuthor"]')?.textContent || '').trim();
        }

        return getMessageReplyContextText(messageEl);
    }

    function getMessageReplyContextRow(messageEl) {
        if (!(messageEl instanceof HTMLElement) || !isChatPage()) return null;

        if (isTr4kerPage()) {
            return messageEl.querySelector('[class*="quote"]');
        }

        return messageEl.querySelector(':scope > .flex-1.min-w-0 > .flex.items-center.gap-2.mb-1.text-xs');
    }

    function syncMessageReplyContextHover(messageEl) {
        const replyRow = getMessageReplyContextRow(messageEl);
        if (!(replyRow instanceof HTMLElement)) return;

        const replyTargetText = getMessageReplyContextText(messageEl);
        const previewEl = replyRow.querySelector('span:last-child');
        if (!(previewEl instanceof HTMLElement)) return;

        const previewText = String(previewEl.textContent || '').trim();
        const hoverText = [replyTargetText, previewText].filter(Boolean).join('\n');

        if (!hoverText) {
            replyRow.removeAttribute('title');
            previewEl.removeAttribute('title');
            return;
        }

        replyRow.title = hoverText;
        previewEl.title = hoverText;
    }

    function getButtonSearchLabel(button) {
        if (!(button instanceof HTMLButtonElement)) return '';

        return normalizeMentionComparableText(
            [
                button.getAttribute('aria-label'),
                button.getAttribute('title'),
                button.textContent
            ]
                .filter(Boolean)
                .join(' ')
        );
    }

    function getMessageActionButtonsContainer(messageEl) {
        if (!(messageEl instanceof HTMLElement) || !isChatPage()) return null;

        if (isTr4kerPage()) {
            return messageEl.querySelector('[data-msg-actions]');
        }

        return messageEl.querySelector(
            ':scope > .absolute.right-2.-top-3.flex.items-center.gap-0\\.5.bg-zinc-900.border.border-zinc-700.rounded-lg.shadow-lg.px-1.py-0\\.5.z-10'
        );
    }

    function getMessageReplyActionButton(messageEl) {
        if (!(messageEl instanceof HTMLElement) || !isChatPage()) return null;

        const actionButtonsContainer = getMessageActionButtonsContainer(messageEl);
        const directReplyButton = actionButtonsContainer?.querySelector('button[title="Répondre"], button[title="Repondre"], button[aria-label*="Répondre"], button[aria-label*="Reply"]');
        if (directReplyButton instanceof HTMLButtonElement) {
            return directReplyButton;
        }

        const usernameButton = isTr4kerPage()
            ? messageEl.querySelector('[class*="msgSender"]')
            : messageEl.querySelector(':scope > .flex-1.min-w-0 > .flex.items-baseline button[type="button"]');
        const replyContextButton = messageEl.querySelector(':scope > .flex-1.min-w-0 > .flex.items-center.gap-2.mb-1.text-xs button[type="button"]');
        const buttons = Array.from(
            (actionButtonsContainer || messageEl).querySelectorAll('button')
        );

        const labeledReplyButton = buttons.find((button) => {
            if (!(button instanceof HTMLButtonElement)) return false;
            if (button === usernameButton || button === replyContextButton) return false;

            const label = getButtonSearchLabel(button);

            return /\b(repondre|reponse|reply)\b/.test(label);
        });

        if (labeledReplyButton instanceof HTMLButtonElement) {
            return labeledReplyButton;
        }

        const iconOnlyButtons = buttons.filter((button) => {
            if (!(button instanceof HTMLButtonElement)) return false;
            if (button === usernameButton || button === replyContextButton) return false;

            const label = getButtonSearchLabel(button);
            if (label) return false;
            return !!button.querySelector('svg');
        });

        return iconOnlyButtons.length === 1 ? iconOnlyButtons[0] : null;
    }

    function getMessageReactionActionButton(messageEl) {
        if (!(messageEl instanceof HTMLElement) || !isChatPage()) return null;

        const actionButtonsContainer = getMessageActionButtonsContainer(messageEl);
        const directReactionButton = actionButtonsContainer?.querySelector('button[title="Réagir"], button[title="Reagir"], button[aria-label*="Réagir"], button[aria-label*="React"]');
        if (directReactionButton instanceof HTMLButtonElement) {
            return directReactionButton;
        }

        const usernameButton = isTr4kerPage()
            ? messageEl.querySelector('[class*="msgSender"]')
            : messageEl.querySelector(':scope > .flex-1.min-w-0 > .flex.items-baseline button[type="button"]');
        const replyContextButton = messageEl.querySelector(':scope > .flex-1.min-w-0 > .flex.items-center.gap-2.mb-1.text-xs button[type="button"]');
        const replyActionButton = getMessageReplyActionButton(messageEl);
        const buttons = Array.from(
            (actionButtonsContainer || messageEl).querySelectorAll('button')
        );

        const labeledReactionButton = buttons.find((button) => {
            if (!(button instanceof HTMLButtonElement)) return false;
            if (button === usernameButton || button === replyContextButton || button === replyActionButton) return false;

            const label = getButtonSearchLabel(button);
            return /\b(reaction|reactions|reagir|react|emoji|emojis|emote)\b/.test(label);
        });

        if (labeledReactionButton instanceof HTMLButtonElement) {
            return labeledReactionButton;
        }

        const iconOnlyButtons = buttons.filter((button) => {
            if (!(button instanceof HTMLButtonElement)) return false;
            if (button === usernameButton || button === replyContextButton || button === replyActionButton) return false;

            const label = getButtonSearchLabel(button);
            if (label) return false;
            return !!button.querySelector('svg');
        });

        return iconOnlyButtons.length === 1 ? iconOnlyButtons[0] : null;
    }

    function isReactionPickerElement(element) {
        if (!(element instanceof HTMLDivElement)) return false;

        if (isTr4kerPage()) {
            if (isUserscriptEmojiControl(element)) return false;

            const context = getActiveNativeReactionPickerContext();
            if (!context) return false;

            const className = String(element.getAttribute('class') || '').toLowerCase();
            const buttons = Array.from(element.querySelectorAll('button'));
            const rect = element.getBoundingClientRect();
            const messageEl = element.closest('[data-msg-id]');

            // Le popover peut être rendu dans la ligne du message ou déplacé
            // sous body par React. Son contexte est donc le clic préalable sur
            // le bouton « Réagir » du message concerné, jamais son apparence.
            return (
                rect.width > 0 &&
                rect.height > 0 &&
                buttons.length >= 3 &&
                /reaction|picker|emoji/.test(className) &&
                (!(messageEl instanceof HTMLElement) || messageEl === context.messageEl)
            );
        }

        if (!element.classList.contains('absolute')) return false;
        if (!element.classList.contains('bg-zinc-900')) return false;
        if (!element.classList.contains('border-zinc-700')) return false;
        if (!element.classList.contains('rounded-xl')) return false;
        if (!element.classList.contains('shadow-2xl')) return false;
        if (!element.classList.contains('z-50')) return false;

        const quickReactionsGrid = element.querySelector(':scope > div.grid.grid-cols-8');
        const customReactionsGrid = element.querySelector(':scope > div > div.grid.grid-cols-7');
        return !!quickReactionsGrid && !!customReactionsGrid;
    }

    function isReactionUsageGridElement(element) {
        if (!(element instanceof HTMLDivElement)) return false;
        if (isTr4kerPage()) {
            return element.classList.contains('grid') || element.querySelectorAll('button').length >= 3;
        }
        if (!element.classList.contains('grid')) return false;

        return element.classList.contains('grid-cols-8') || element.classList.contains('grid-cols-7');
    }

    function findReactionUsagePickerRootFromTarget(target) {
        if (!(target instanceof Element)) return null;

        let current = target;
        while (current instanceof HTMLElement) {
            if (current instanceof HTMLDivElement && isReactionPickerElement(current)) {
                return current;
            }
            current = current.parentElement;
        }

        return null;
    }

    function isUserscriptEmojiControl(element) {
        if (!(element instanceof Element)) return false;

        return !!element.closest(
            `[${CHAT_INPUT_TOOLBAR_RAIL_ATTR}="1"], ` +
            `#${EMOJI_QUICK_ACCESS_WRAPPER_ID}, ` +
            `#${PHRASES_MENU_WRAPPER_ID}, ` +
            `#${GIF_MENU_WRAPPER_ID}, ` +
            `#${IMAGE_UPLOAD_MENU_WRAPPER_ID}, ` +
            '[data-tm-saved-phrases-menu="1"], ' +
            '[data-tm-klipy-gif-menu="1"], ' +
            '[data-tm-image-upload-menu="1"]'
        );
    }

    function getActiveNativeEmojiPickerContext() {
        if (!nativeEmojiPickerContext) return null;
        if (Date.now() - nativeEmojiPickerContext.openedAt <= NATIVE_PICKER_CONTEXT_TIMEOUT_MS) {
            return nativeEmojiPickerContext;
        }

        nativeEmojiPickerContext = null;
        return null;
    }

    function getActiveNativeReactionPickerContext() {
        if (!nativeReactionPickerContext) return null;
        if (Date.now() - nativeReactionPickerContext.openedAt <= NATIVE_PICKER_CONTEXT_TIMEOUT_MS) {
            return nativeReactionPickerContext;
        }

        nativeReactionPickerContext = null;
        return null;
    }

    function findNativeEmojiInputTrigger(target) {
        if (!(target instanceof Element) || !isTr4kerPage()) return null;

        const button = target.closest('button');
        if (!(button instanceof HTMLButtonElement) || isUserscriptEmojiControl(button)) return null;

        const input = getChatInput();
        if (!(input instanceof HTMLElement)) return null;

        const inputScope = input.closest('[class*="inputField"], [class*="inputArea"]');
        if (!(inputScope instanceof HTMLElement) || !inputScope.contains(button)) return null;

        return /\b(?:emoji|emojis|emote)\b/.test(getButtonSearchLabel(button)) ? button : null;
    }

    function installNativePickerContextTracker() {
        document.addEventListener('click', (event) => {
            if (!isChatPage() || !isTr4kerPage()) return;
            if (!(event.target instanceof Element)) return;

            const emojiTrigger = findNativeEmojiInputTrigger(event.target);
            if (emojiTrigger instanceof HTMLButtonElement) {
                nativeEmojiPickerContext = {
                    openedAt: Date.now(),
                    trigger: emojiTrigger
                };
                nativeReactionPickerContext = null;
                return;
            }

            const clickedButton = event.target.closest('button');
            if (!(clickedButton instanceof HTMLButtonElement) || isUserscriptEmojiControl(clickedButton)) return;

            const messageEl = findMessageElementFromTarget(clickedButton);
            const reactionButton = messageEl instanceof HTMLElement
                ? getMessageReactionActionButton(messageEl)
                : null;
            if (clickedButton !== reactionButton && !reactionButton?.contains(clickedButton)) return;

            nativeReactionPickerContext = {
                openedAt: Date.now(),
                messageEl,
                trigger: reactionButton
            };
            nativeEmojiPickerContext = null;
        }, true);
    }

    function isUserscriptControlReactionRecord(record) {
        const label = normalizeMentionComparableText(
            [record?.label, record?.title, record?.alt]
                .filter(Boolean)
                .join(' ')
        );

        return /\b(?:ouvrir|fermer|open|close)\b.*\b(?:picker|menu)\b.*\b(?:gif|klipy|image|img)\b/.test(label);
    }

    function isNativeEmojiPickerElement(element) {
        if (!(element instanceof HTMLDivElement)) return false;

        if (isTr4kerPage()) {
            // Les menus GIF/images/phrases du userscript contiennent aussi des
            // boutons et des images. Ils ne doivent jamais être pris pour le
            // picker emoji natif ni alimenter ses favoris.
            if (isUserscriptEmojiControl(element)) return false;
            if (!getActiveNativeEmojiPickerContext()) return false;

            const className = String(element.getAttribute('class') || '').toLowerCase();
            const buttons = Array.from(element.querySelectorAll('button'));
            const rect = element.getBoundingClientRect();
            return (
                rect.width > 0 &&
                rect.height > 0 &&
                buttons.length >= 3 &&
                (/emoji|picker/.test(className) || buttons.some((button) => button.querySelector('img')))
            );
        }

        if (!element.classList.contains('absolute')) return false;
        if (!element.classList.contains('bg-zinc-900')) return false;
        if (!element.classList.contains('border-zinc-700')) return false;
        if (!element.classList.contains('rounded-xl')) return false;
        if (!element.classList.contains('shadow-2xl')) return false;

        const headerLabel = element.querySelector(':scope > div:first-child span');
        const headerText = normalizeMentionComparableText(headerLabel?.textContent || '');
        if (!/\bemojis?\b/.test(headerText)) return false;

        const emojiGrid = element.querySelector(':scope > div:last-child > div.grid.grid-cols-7');
        if (!(emojiGrid instanceof HTMLDivElement)) return false;

        return !!emojiGrid.querySelector('button[title] img');
    }

    function findNativeEmojiPickerButtonFromTarget(target) {
        if (!(target instanceof Element)) return null;

        // Les boutons du picker Tr4ker n'ont pas systématiquement type="button".
        const button = target.closest('button');
        if (!(button instanceof HTMLButtonElement)) return null;
        if (isUserscriptEmojiControl(button)) return null;
        if (!isTr4kerPage() && !(button.querySelector('img') instanceof HTMLImageElement)) return null;

        let picker = null;
        if (isTr4kerPage()) {
            let current = button.parentElement;
            while (current && current !== document.body) {
                if (current instanceof HTMLDivElement && isNativeEmojiPickerElement(current)) {
                    picker = current;
                    break;
                }
                current = current.parentElement;
            }
        } else {
            picker = button.closest('div.absolute.bg-zinc-900.border.border-zinc-700.rounded-xl.shadow-2xl');
        }
        if (!(picker instanceof HTMLDivElement) || !isNativeEmojiPickerElement(picker)) return null;

        if (isTr4kerPage()) {
            const pickerButtonText = String(button.textContent || '').trim();
            const pickerMetadata = [
                button.getAttribute('data-emoji'),
                button.getAttribute('data-value'),
                button.getAttribute('data-name'),
                button.getAttribute('title'),
                button.getAttribute('aria-label')
            ]
                .map((value) => String(value || '').trim())
                .filter(Boolean);
            const hasEmojiAsset = button.querySelector('img') instanceof HTMLImageElement;
            const hasUnicodeEmoji = !!normalizeReactionEmojiValue(pickerButtonText);
            const hasShortcode = pickerMetadata.some((value) => /^:[^:\s][^:]*:$/.test(value));

            // Ignore les onglets et boutons de navigation du picker : seuls les
            // éléments qui représentent réellement un emoji sont comptabilisés.
            return hasEmojiAsset || hasUnicodeEmoji || hasShortcode ? button : null;
        }

        const emojiGrid = button.closest('div.grid.grid-cols-7');
        if (!(emojiGrid instanceof HTMLDivElement) || !picker.contains(emojiGrid)) return null;

        return button;
    }

    function findNativeEmojiPickerFromTarget(target) {
        if (!(target instanceof Element)) return null;

        if (isTr4kerPage()) {
            let current = target instanceof HTMLElement ? target : null;
            while (current && current !== document.body) {
                if (current instanceof HTMLDivElement && isNativeEmojiPickerElement(current)) return current;
                current = current.parentElement;
            }
            return null;
        }

        const picker = target.closest('div.absolute.bg-zinc-900.border.border-zinc-700.rounded-xl.shadow-2xl');
        return picker instanceof HTMLDivElement && isNativeEmojiPickerElement(picker) ? picker : null;
    }

    function findReactionPickerButtonFromTarget(target) {
        if (!(target instanceof Element)) return null;

        const button = target.closest('button[type="button"]');
        if (!(button instanceof HTMLButtonElement)) return null;
        const picker = isTr4kerPage()
            ? findReactionUsagePickerRootFromTarget(button)
            : button.closest('div.absolute.bg-zinc-900.border.border-zinc-700.rounded-xl.shadow-2xl.z-50');
        if (!(picker instanceof HTMLDivElement) || !isReactionPickerElement(picker)) return null;

        return button;
    }

    function findReactionUsageButtonFromTarget(target) {
        if (!(target instanceof Element)) return null;

        const button = target.closest('button');
        if (!(button instanceof HTMLButtonElement)) return null;
        if (isUserscriptEmojiControl(button)) return null;

        const picker = findReactionUsagePickerRootFromTarget(button);
        if (!(picker instanceof HTMLDivElement)) return null;

        if (isTr4kerPage()) {
            const context = getActiveNativeReactionPickerContext();
            if (!context) return null;

            const buttonMessageEl = findMessageElementFromTarget(button);
            const pickerMessageEl = picker.closest('[data-msg-id]');
            if (
                (buttonMessageEl instanceof HTMLElement && buttonMessageEl !== context.messageEl) ||
                (pickerMessageEl instanceof HTMLElement && pickerMessageEl !== context.messageEl)
            ) return null;

            const record = extractReactionUsageRecordFromButton(button);
            const hasEmojiValue = !!normalizeReactionEmojiValue(
                record?.emojiValue || record?.label || record?.title || record?.alt || ''
            );
            const hasEmojiAsset = button.querySelector('img') instanceof HTMLImageElement;
            const hasEmojiDataset = [
                button.getAttribute('data-emoji'),
                button.getAttribute('data-value'),
                button.getAttribute('data-name')
            ].some((value) => !!String(value || '').trim());

            // Tr4ker utilise des classes CSS modules, sans conteneur `div.grid`.
            // Écarter les contrôles du picker et ne conserver que les emojis.
            return hasEmojiValue || hasEmojiAsset || hasEmojiDataset ? button : null;
        }

        const nearestGrid = button.closest('div.grid');
        if (!(nearestGrid instanceof HTMLDivElement) || !picker.contains(nearestGrid)) return null;
        if (!isReactionUsageGridElement(nearestGrid)) return null;

        return button;
    }

    function applyManualQuickAccessPickerMarker(button, isFavorite) {
        if (!(button instanceof HTMLButtonElement)) return;

        if (quickAccessMode !== QUICK_ACCESS_MODE_MANUAL || !isFavorite) {
            if (button.getAttribute(MANUAL_QUICK_ACCESS_PICKER_MARKER_ATTR) === '1') {
                button.removeAttribute(MANUAL_QUICK_ACCESS_PICKER_MARKER_ATTR);
                button.style.removeProperty('outline');
                button.style.removeProperty('outline-offset');
            }
            return;
        }

        button.setAttribute(MANUAL_QUICK_ACCESS_PICKER_MARKER_ATTR, '1');
        button.style.outline = '2px solid rgba(251,191,36,0.88)';
        button.style.outlineOffset = '2px';
    }

    function syncManualQuickAccessPickerMarkers(root = document) {
        if (!(root instanceof Document) && !(root instanceof HTMLElement)) return;

        root.querySelectorAll('button').forEach((button) => {
            if (!(button instanceof HTMLButtonElement)) return;

            const emojiButton = findNativeEmojiPickerButtonFromTarget(button);
            if (emojiButton === button) {
                applyManualQuickAccessPickerMarker(
                    button,
                    isManualEmojiFavoriteRecord(extractEmojiUsageRecordFromButton(button))
                );
                return;
            }

            const reactionButton = findReactionUsageButtonFromTarget(button);
            if (reactionButton === button) {
                applyManualQuickAccessPickerMarker(
                    button,
                    isManualReactionFavoriteRecord(extractReactionUsageRecordFromButton(button))
                );
                return;
            }

            applyManualQuickAccessPickerMarker(button, false);
        });
    }

    function findVisibleReactionPicker() {
        const candidates = Array.from(document.querySelectorAll('div')).filter(isReactionPickerElement);
        return candidates.find((element) => {
            const rect = element.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
        }) || null;
    }

    function applyReactionPickerFloatingStyle(picker, leftPx, topPx) {
        if (!(picker instanceof HTMLElement)) return;

        picker.style.position = 'fixed';
        picker.style.right = 'auto';
        picker.style.bottom = 'auto';
        picker.style.left = `${leftPx}px`;
        picker.style.top = `${topPx}px`;
        picker.style.setProperty('z-index', String(REACTION_PICKER_Z_INDEX), 'important');
    }

    function elevateVisibleReactionPicker(attempt = 0) {
        const picker = findVisibleReactionPicker();
        if (!(picker instanceof HTMLElement)) {
            if (attempt >= 8) return;
            window.setTimeout(() => {
                elevateVisibleReactionPicker(attempt + 1);
            }, 24);
            return;
        }

        const rect = picker.getBoundingClientRect();
        const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
        const maxTop = Math.max(8, window.innerHeight - rect.height - 8);
        const nextLeft = clamp(rect.left, 8, maxLeft);
        const nextTop = clamp(rect.top, 8, maxTop);

        applyReactionPickerFloatingStyle(picker, nextLeft, nextTop);
    }

    function positionReactionPickerNearPointer(clientX, clientY, attempt = 0) {
        const picker = findVisibleReactionPicker();
        if (!(picker instanceof HTMLElement)) {
            if (attempt >= 8) return;
            window.setTimeout(() => {
                positionReactionPickerNearPointer(clientX, clientY, attempt + 1);
            }, 24);
            return;
        }

        const rect = picker.getBoundingClientRect();
        const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
        const maxTop = Math.max(8, window.innerHeight - rect.height - 8);
        const nextLeft = messageActionsLeftEnabled
            ? clamp(clientX - rect.width - LONG_PRESS_REACTION_PICKER_OFFSET_X, 8, maxLeft)
            : clamp(clientX + LONG_PRESS_REACTION_PICKER_OFFSET_X, 8, maxLeft);
        const nextTop = clamp(clientY + LONG_PRESS_REACTION_PICKER_OFFSET_Y, 8, maxTop);

        applyReactionPickerFloatingStyle(picker, nextLeft, nextTop);
    }

    function splitTrailingUrlSuffix(rawUrl) {
        let url = String(rawUrl || '');
        let suffix = '';

        while (url) {
            const lastChar = url.slice(-1);

            if (/[.,!?;:]/.test(lastChar)) {
                suffix = lastChar + suffix;
                url = url.slice(0, -1);
                continue;
            }

            if (lastChar === ')') {
                const opens = (url.match(/\(/g) || []).length;
                const closes = (url.match(/\)/g) || []).length;
                if (closes > opens) {
                    suffix = lastChar + suffix;
                    url = url.slice(0, -1);
                    continue;
                }
            }

            if (lastChar === ']') {
                const opens = (url.match(/\[/g) || []).length;
                const closes = (url.match(/\]/g) || []).length;
                if (closes > opens) {
                    suffix = lastChar + suffix;
                    url = url.slice(0, -1);
                    continue;
                }
            }

            if (lastChar === '}') {
                const opens = (url.match(/\{/g) || []).length;
                const closes = (url.match(/\}/g) || []).length;
                if (closes > opens) {
                    suffix = lastChar + suffix;
                    url = url.slice(0, -1);
                    continue;
                }
            }

            break;
        }

        return { url, suffix };
    }

    function createLinkifiedUrlElement(urlText) {
        const normalizedUrl = String(urlText || '').trim();
        if (!normalizedUrl) return null;

        const link = document.createElement('a');
        link.href = /^https?:\/\//i.test(normalizedUrl) ? normalizedUrl : `https://${normalizedUrl}`;
        link.textContent = normalizedUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('data-tm-linkified-url', '1');
        return link;
    }

    function getEmbeddableImageCandidates(rawUrl) {
        const normalizedUrl = String(rawUrl || '').trim();
        if (!normalizedUrl) return [];

        let parsedUrl;
        try {
            parsedUrl = new URL(normalizedUrl, location.origin);
        } catch (e) {
            return [];
        }

        if (!/^https?:$/i.test(parsedUrl.protocol)) return [];
        return DIRECT_IMAGE_PATH_RE.test(parsedUrl.pathname) ? [parsedUrl.href] : [];
    }

    function parseYouTubeTimeToSeconds(rawValue) {
        const value = String(rawValue || '').trim().toLowerCase();
        if (!value) return 0;
        if (/^\d+$/.test(value)) return Number(value) || 0;

        let totalSeconds = 0;
        const matcher = /(\d+)(h|m|s)/g;
        let match;

        while ((match = matcher.exec(value)) !== null) {
            const amount = Number(match[1]) || 0;
            const unit = match[2];

            if (unit === 'h') totalSeconds += amount * 3600;
            if (unit === 'm') totalSeconds += amount * 60;
            if (unit === 's') totalSeconds += amount;
        }

        return totalSeconds;
    }

    function normalizeYouTubeVideoTitle(value, fallback = DEFAULT_YOUTUBE_PLAYER_TITLE) {
        const normalizedTitle = String(value || '')
            .replace(/\s+/g, ' ')
            .trim();

        return normalizedTitle || fallback;
    }

    function getFallbackYouTubePlayerTitle(videoId = '') {
        const normalizedVideoId = String(videoId || '').trim();
        if (!normalizedVideoId) return DEFAULT_YOUTUBE_PLAYER_TITLE;
        return `YouTube · ${normalizedVideoId}`;
    }

    function setYouTubePlayerTitle(titleText) {
        const player = document.getElementById(YOUTUBE_PLAYER_ID);
        if (!(player instanceof HTMLElement)) return;

        const titleEl = player.querySelector('[data-tm-youtube-player-title="1"]');
        if (!(titleEl instanceof HTMLElement)) return;

        const normalizedTitle = normalizeYouTubeVideoTitle(titleText);
        titleEl.textContent = normalizedTitle;
        titleEl.title = normalizedTitle;
    }

    async function fetchYouTubeVideoTitle(videoId, watchUrl) {
        const normalizedVideoId = String(videoId || '').trim();
        const normalizedWatchUrl = String(watchUrl || '').trim();

        if (!normalizedVideoId || !normalizedWatchUrl) return '';
        if (youtubeVideoTitleCache.has(normalizedVideoId)) {
            return youtubeVideoTitleCache.get(normalizedVideoId) || '';
        }

        try {
            const oEmbedUrl = new URL('https://www.youtube.com/');
            oEmbedUrl.searchParams.set('url', normalizedWatchUrl);
            oEmbedUrl.searchParams.set('format', 'json');

            const response = await requestExternal(oEmbedUrl.toString(), {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                },
                credentials: 'omit',
                timeout: 15000
            });

            if (!response.ok) return '';

            const payload = await response.json();
            const resolvedTitle = normalizeYouTubeVideoTitle(
                payload?.title,
                ''
            );

            if (!resolvedTitle) return '';

            youtubeVideoTitleCache.set(normalizedVideoId, resolvedTitle);
            return resolvedTitle;
        } catch (e) {
            return '';
        }
    }

    function getYouTubeVideoDescriptor(rawUrl) {
        const normalizedUrl = String(rawUrl || '').trim();
        if (!normalizedUrl) return null;

        const isYouTubeFragment = /^(?:watch\?v=|shorts\/|embed\/|live\/)/i.test(normalizedUrl);
        const urlToParse = isYouTubeFragment
            ? `https://www.youtube.com/${normalizedUrl}`
            : normalizedUrl;

        let parsedUrl;
        try {
            parsedUrl = new URL(urlToParse, location.origin);
        } catch (e) {
            return null;
        }

        if (!/^https?:$/i.test(parsedUrl.protocol)) return null;

        const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
        const pathnameParts = parsedUrl.pathname.split('/').filter(Boolean);
        let videoId = '';

        if (hostname === 'youtu.be') {
            videoId = pathnameParts[0] || '';
        } else if (hostname === 'youtube.com' || hostname === 'music.youtube.com' || hostname === 'youtube-nocookie.com') {
            if (parsedUrl.pathname === '/watch') {
                videoId = parsedUrl.searchParams.get('v') || '';
            } else if (pathnameParts[0] === 'shorts' || pathnameParts[0] === 'embed' || pathnameParts[0] === 'live') {
                videoId = pathnameParts[1] || '';
            }
        }

        // Un identifiant de vidéo YouTube fait exactement 11 caractères.
        // Cette contrainte évite qu'un texte adjacent (par exemple « play »)
        // soit absorbé dans l'identifiant lors d'un nouveau rendu du message.
        if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return null;

        const startSeconds = Math.max(
            parseYouTubeTimeToSeconds(parsedUrl.searchParams.get('t')),
            parseYouTubeTimeToSeconds(parsedUrl.searchParams.get('start')),
            parseYouTubeTimeToSeconds(parsedUrl.searchParams.get('time_continue'))
        );
        const embedUrl = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);

        embedUrl.searchParams.set('autoplay', '1');
        embedUrl.searchParams.set('rel', '0');
        embedUrl.searchParams.set('modestbranding', '1');
        embedUrl.searchParams.set('playsinline', '1');

        if (startSeconds > 0) {
            embedUrl.searchParams.set('start', String(startSeconds));
        }

        const watchUrl = new URL('https://www.youtube.com/watch');
        watchUrl.searchParams.set('v', videoId);

        return {
            videoId,
            embedUrl: embedUrl.toString(),
            watchUrl: watchUrl.toString()
        };
    }

    function getYouTubeVideoDescriptorsFromText(rawText) {
        const sourceText = String(rawText || '');
        if (!sourceText) return [];

        const descriptors = [];
        const seenVideoIds = new Set();
        YOUTUBE_FRAGMENT_RE.lastIndex = 0;

        let match;
        while ((match = YOUTUBE_FRAGMENT_RE.exec(sourceText)) !== null) {
            const descriptor = getYouTubeVideoDescriptor(match[1]);
            if (!descriptor || seenVideoIds.has(descriptor.videoId)) continue;

            seenVideoIds.add(descriptor.videoId);
            descriptors.push(descriptor);
        }

        return descriptors;
    }

    function getYouTubeVideoDescriptorsFromTextBlock(textBlock) {
        if (!(textBlock instanceof HTMLElement)) return [];

        const descriptors = [];
        const seenVideoIds = new Set();
        const walker = document.createTreeWalker(textBlock, NodeFilter.SHOW_TEXT);
        let textNode;

        while ((textNode = walker.nextNode())) {
            const parent = textNode.parentElement;
            // Les liens et les boutons sont déjà traités séparément. Ne pas
            // relire le libellé « play » injecté par le userscript.
            if (parent?.closest('a, button[data-tm-youtube-play-link="1"]')) continue;

            getYouTubeVideoDescriptorsFromText(textNode.nodeValue || '').forEach((descriptor) => {
                if (seenVideoIds.has(descriptor.videoId)) return;
                seenVideoIds.add(descriptor.videoId);
                descriptors.push(descriptor);
            });
        }

        return descriptors;
    }

    function createYouTubePlayButton(videoDescriptor) {
        if (!videoDescriptor) return null;

        const playButton = document.createElement('button');
        playButton.type = 'button';
        playButton.textContent = 'play';
        playButton.title = 'Lire dans le player';
        playButton.setAttribute('aria-label', 'Lire dans le player');
        playButton.setAttribute('data-tm-youtube-play-link', '1');
        playButton.setAttribute('data-tm-youtube-embed-url', videoDescriptor.embedUrl);
        playButton.setAttribute('data-tm-youtube-video-id', videoDescriptor.videoId);
        playButton.setAttribute('data-tm-youtube-watch-url', videoDescriptor.watchUrl);
        return playButton;
    }

    function linkifyTextNodeUrls(textNode) {
        if (!(textNode instanceof Text)) return;

        const sourceText = textNode.nodeValue || '';
        if (!URL_CANDIDATE_RE.test(sourceText)) return;

        URL_MATCH_RE.lastIndex = 0;

        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        let didReplace = false;
        let match;

        while ((match = URL_MATCH_RE.exec(sourceText)) !== null) {
            const rawUrl = match[0];
            const startIndex = match.index;
            const leadingText = sourceText.slice(lastIndex, startIndex);
            const { url, suffix } = splitTrailingUrlSuffix(rawUrl);

            if (leadingText) {
                fragment.appendChild(document.createTextNode(leadingText));
            }

            if (url) {
                const link = createLinkifiedUrlElement(url);
                if (link) {
                    fragment.appendChild(link);
                    didReplace = true;
                } else {
                    fragment.appendChild(document.createTextNode(rawUrl));
                }
            } else {
                fragment.appendChild(document.createTextNode(rawUrl));
            }

            if (suffix) {
                fragment.appendChild(document.createTextNode(suffix));
            }

            lastIndex = startIndex + rawUrl.length;
        }

        if (!didReplace) return;

        const trailingText = sourceText.slice(lastIndex);
        if (trailingText) {
            fragment.appendChild(document.createTextNode(trailingText));
        }

        textNode.replaceWith(fragment);
    }

    function linkifyMessageTextBlock(messageEl) {
        const textBlock = getMessageTextBlock(messageEl);
        if (!(textBlock instanceof HTMLElement)) return;

        ensureLinkifiedUrlStyle();

        const walker = document.createTreeWalker(
            textBlock,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode(node) {
                    if (!(node instanceof Text)) return NodeFilter.FILTER_REJECT;
                    if (!URL_CANDIDATE_RE.test(node.nodeValue || '')) return NodeFilter.FILTER_REJECT;

                    const parent = node.parentElement;
                    if (!(parent instanceof HTMLElement)) return NodeFilter.FILTER_REJECT;
                    if (parent.closest('a, button, textarea, script, style')) return NodeFilter.FILTER_REJECT;

                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const textNodes = [];
        let currentNode = walker.nextNode();

        while (currentNode) {
            textNodes.push(currentNode);
            currentNode = walker.nextNode();
        }

        textNodes.forEach((node) => {
            linkifyTextNodeUrls(node);
        });
    }

    function syncEmbeddedImagePreviews(messageEl) {
        const textBlock = getMessageTextBlock(messageEl);
        if (!(textBlock instanceof HTMLElement)) return;

        const staleInlinePreviews = Array.from(textBlock.querySelectorAll('span[data-tm-embedded-image-preview="1"]'));
        staleInlinePreviews.forEach((preview) => {
            preview.remove();
        });

        const linkifiedLinks = Array.from(textBlock.querySelectorAll('a[data-tm-linkified-url="1"]'));

        if (!embedUrlImagesEnabled) {
            linkifiedLinks.forEach((link) => {
                link.removeAttribute('data-tm-linkified-image');
            });
            return;
        }

        ensureEmbeddedImageStyle();

        linkifiedLinks.forEach((link) => {
            if (!(link instanceof HTMLAnchorElement)) return;

            const candidateUrls = getEmbeddableImageCandidates(link.href);
            if (candidateUrls.length > 0) {
                link.setAttribute('data-tm-linkified-image', '1');
            } else {
                link.removeAttribute('data-tm-linkified-image');
            }
        });
    }

    function syncYouTubePlayButtons(messageEl) {
        const textBlock = getMessageTextBlock(messageEl);
        if (!(textBlock instanceof HTMLElement)) return;

        const staleButtons = Array.from(textBlock.querySelectorAll('button[data-tm-youtube-play-link="1"]'));
        staleButtons.forEach((button) => {
            button.remove();
        });

        ensureYouTubeLinkActionStyle();

        const linkedVideoIds = new Set();
        const candidateLinks = Array.from(textBlock.querySelectorAll('a[href]'));
        candidateLinks.forEach((link) => {
            if (!(link instanceof HTMLAnchorElement)) return;

            const videoDescriptor = getYouTubeVideoDescriptor(link.href);
            if (!videoDescriptor) return;

            linkedVideoIds.add(videoDescriptor.videoId);
            const playButton = createYouTubePlayButton(videoDescriptor);
            if (!playButton) return;

            link.insertAdjacentElement('afterend', playButton);
        });

        // Tr4ker bloque les URLs dans les messages. Les utilisateurs peuvent
        // donc envoyer uniquement le suffixe YouTube, par exemple watch?v=ID.
        const textVideoDescriptors = getYouTubeVideoDescriptorsFromTextBlock(textBlock);
        textVideoDescriptors.forEach((videoDescriptor) => {
            if (linkedVideoIds.has(videoDescriptor.videoId)) return;

            const playButton = createYouTubePlayButton(videoDescriptor);
            if (!playButton) return;

            textBlock.appendChild(document.createTextNode(' '));
            textBlock.appendChild(playButton);
        });
    }

    function unlinkifyMessageTextBlock(messageEl) {
        const textBlock = getMessageTextBlock(messageEl);
        if (!(textBlock instanceof HTMLElement)) return;

        const youtubeButtons = Array.from(textBlock.querySelectorAll('button[data-tm-youtube-play-link="1"]'));
        youtubeButtons.forEach((button) => {
            button.remove();
        });

        const previews = Array.from(textBlock.querySelectorAll('span[data-tm-embedded-image-preview="1"]'));
        previews.forEach((preview) => {
            preview.remove();
        });

        const links = Array.from(textBlock.querySelectorAll('a[data-tm-linkified-url="1"]'));
        links.forEach((link) => {
            link.replaceWith(document.createTextNode(link.textContent || ''));
        });

        textBlock.normalize();
    }

    function updateMessageTextBlockUrls(messageEl) {
        // Les bulles de Tr4ker sont gérées directement par React. Remplacer un
        // nœud texte ici désynchronise l'arbre DOM de React et peut faire
        // échouer le démontage d'une conversation (NotFoundError/removeChild).
        // Tr4ker rend déjà les URL sous forme de liens natifs : ne modifions
        // donc jamais son texte, mais gardons le bouton du mini-player YouTube.
        if (isTr4kerPage()) {
            syncYouTubePlayButtons(messageEl);
            return;
        }

        if (linkifyUrlsEnabled) {
            linkifyMessageTextBlock(messageEl);
            syncEmbeddedImagePreviews(messageEl);
        } else {
            unlinkifyMessageTextBlock(messageEl);
        }

        syncYouTubePlayButtons(messageEl);
    }

    function getMessageTextBlock(messageEl) {
        if (!(messageEl instanceof HTMLElement)) return null;

        if (isTr4kerPage()) {
            return messageEl.querySelector('[class*="msgBubble"]');
        }

        if (isChatPage()) {
            return messageEl.querySelector(':scope > .flex-1.min-w-0 > .text-sm.text-gray-200.break-words');
        }

        if (isHomePage()) {
            return messageEl.querySelector(':scope > .flex-1.min-w-0 > p.break-words.leading-snug');
        }

        return null;
    }

    function getMessageContentImageFromTarget(target) {
        if (!(target instanceof Element)) return null;

        const image = target.closest('img');
        if (!(image instanceof HTMLImageElement)) return null;
        if (image.closest(`#${PANEL_ID}, #${AFK_PANEL_ID}, #${MODAL_ID}, #${OVERLAY_ID}, #${IMAGE_VIEWER_MODAL_ID}, #${IMAGE_VIEWER_OVERLAY_ID}, #${TOAST_ID}`)) return null;

        const messageEl = findMessageElementFromTarget(image);
        if (!messageEl || !messageEl.contains(image)) return null;

        const textBlock = getMessageTextBlock(messageEl);
        if (!(textBlock instanceof HTMLElement) || !textBlock.contains(image)) return null;
        if (!image.currentSrc && !image.src) return null;
        if ((image.naturalWidth && image.naturalWidth <= 32) || (image.naturalHeight && image.naturalHeight <= 32)) {
            return null;
        }

        return image;
    }

    function getMessageLinkImagePreviewCandidatesFromTarget(target) {
        if (!(target instanceof Element) || !embedUrlImagesEnabled) return null;

        const link = target.closest('a[data-tm-linkified-url="1"][data-tm-linkified-image="1"]');
        if (!(link instanceof HTMLAnchorElement)) return null;
        if (link.closest(`#${PANEL_ID}, #${AFK_PANEL_ID}, #${MODAL_ID}, #${OVERLAY_ID}, #${IMAGE_VIEWER_MODAL_ID}, #${IMAGE_VIEWER_OVERLAY_ID}, #${TOAST_ID}`)) return null;

        const messageEl = findMessageElementFromTarget(link);
        if (!messageEl || !messageEl.contains(link)) return null;

        const textBlock = getMessageTextBlock(messageEl);
        if (!(textBlock instanceof HTMLElement) || !textBlock.contains(link)) return null;

        const candidateUrls = getEmbeddableImageCandidates(link.href);
        if (candidateUrls.length === 0) return null;

        return {
            hoverTarget: link,
            candidateUrls
        };
    }

    function getOrCreateImagePreview() {
        let preview = document.getElementById(IMAGE_PREVIEW_ID);
        if (preview) return preview;
        if (!document.body) return null;

        preview = document.createElement('div');
        preview.id = IMAGE_PREVIEW_ID;
        preview.style.position = 'fixed';
        preview.style.zIndex = '1000003';
        preview.style.display = 'none';
        preview.style.pointerEvents = 'auto';
        preview.style.cursor = 'zoom-in';
        preview.style.padding = '8px';
        preview.style.borderRadius = '14px';
        preview.style.background = 'rgba(24,24,27,0.96)';
        preview.style.border = '1px solid rgba(255,255,255,0.08)';
        preview.style.boxShadow = '0 18px 38px rgba(0,0,0,0.42)';
        preview.style.backdropFilter = 'blur(8px)';

        const img = document.createElement('img');
        img.alt = '';
        img.style.display = 'block';
        img.style.maxWidth = 'min(520px, calc(100vw - 40px))';
        img.style.maxHeight = 'min(70vh, 560px)';
        img.style.borderRadius = '10px';
        img.style.objectFit = 'contain';

        preview.appendChild(img);
        preview.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            const rawCandidates = preview.getAttribute('data-tm-viewer-candidates') || '[]';

            try {
                const candidateUrls = JSON.parse(rawCandidates);
                if (Array.isArray(candidateUrls) && candidateUrls.length > 0) {
                    openImageViewerFromCandidates(candidateUrls);
                }
            } catch (e) {
                // Ignore malformed preview payloads.
            }
        });

        document.body.appendChild(preview);
        return preview;
    }

    function positionImagePreview(clientX, clientY) {
        const preview = document.getElementById(IMAGE_PREVIEW_ID);
        if (!(preview instanceof HTMLElement) || preview.style.display === 'none') return;

        const offset = 18;
        const rect = preview.getBoundingClientRect();
        const maxLeft = window.innerWidth - rect.width - 12;
        const maxTop = window.innerHeight - rect.height - 12;
        const left = clamp(clientX + offset, 12, Math.max(12, maxLeft));
        const top = clamp(clientY + offset, 12, Math.max(12, maxTop));

        preview.style.left = `${left}px`;
        preview.style.top = `${top}px`;
    }

    function hideImagePreview() {
        hoveredMessageImage = null;

        const preview = document.getElementById(IMAGE_PREVIEW_ID);
        if (!(preview instanceof HTMLElement)) return;

        preview.style.display = 'none';
        preview.style.left = '-9999px';
        preview.style.top = '-9999px';

        const image = preview.firstElementChild;
        if (image instanceof HTMLImageElement) {
            image.onload = null;
            image.onerror = null;
            image.removeAttribute('src');
        }

        preview.removeAttribute('data-tm-preview-signature');
        preview.removeAttribute('data-tm-viewer-candidates');
    }

    function showImagePreviewFromCandidates(hoverTarget, candidateUrls, clientX, clientY) {
        const preview = getOrCreateImagePreview();
        if (!(preview instanceof HTMLElement)) return;
        if (!(hoverTarget instanceof Element)) return;
        if (!Array.isArray(candidateUrls) || candidateUrls.length === 0) {
            hideImagePreview();
            return;
        }

        const previewImage = preview.firstElementChild;
        if (!(previewImage instanceof HTMLImageElement)) return;

        const candidateSignature = hashString(candidateUrls.join('|'));
        const alreadyLoaded = preview.getAttribute('data-tm-preview-signature') === candidateSignature;

        hoveredMessageImage = hoverTarget;

        if (alreadyLoaded && previewImage.currentSrc) {
            preview.style.display = 'block';
            positionImagePreview(clientX, clientY);
            return;
        }

        let candidateIndex = 0;

        preview.style.display = 'none';
        preview.style.left = '-9999px';
        preview.style.top = '-9999px';
        preview.setAttribute('data-tm-preview-signature', candidateSignature);
        preview.setAttribute('data-tm-viewer-candidates', JSON.stringify(candidateUrls));

        function tryNextCandidate() {
            if (preview.getAttribute('data-tm-preview-signature') !== candidateSignature) return;

            if (candidateIndex >= candidateUrls.length) {
                if (hoveredMessageImage === hoverTarget) {
                    hideImagePreview();
                }
                return;
            }

            previewImage.src = candidateUrls[candidateIndex];
            candidateIndex += 1;
        }

        previewImage.onload = () => {
            if (preview.getAttribute('data-tm-preview-signature') !== candidateSignature) return;

            preview.style.display = 'block';
            positionImagePreview(clientX, clientY);
        };

        previewImage.onerror = () => {
            if (preview.getAttribute('data-tm-preview-signature') !== candidateSignature) return;
            tryNextCandidate();
        };

        tryNextCandidate();
    }

    function showImagePreview(imageEl, clientX, clientY) {
        const source = imageEl.currentSrc || imageEl.src;
        if (!source) {
            hideImagePreview();
            return;
        }

        showImagePreviewFromCandidates(imageEl, [source], clientX, clientY);
    }

    function messageMentionsWatchedUser(messageEl) {
        const watchedUsername = mentionSettings.username;
        if (!watchedUsername) return false;

        const messageText = getMessageTextContent(messageEl);
        const normalizedWatchedUsername = normalizeMentionComparableText(watchedUsername);
        const normalizedMessageText = normalizeMentionComparableText(messageText);
        const mentionRegex = new RegExp(
            `(^|[^\\p{L}\\p{N}_])@${escapeRegExp(normalizedWatchedUsername)}(?=$|[^\\p{L}\\p{N}_])`,
            'u'
        );
        const directMentionMatched = !!normalizedWatchedUsername && !!normalizedMessageText && mentionRegex.test(normalizedMessageText);

        let replyContextText = '';
        let replyAuthorText = '';
        let normalizedReplyContextText = '';
        let replyMentionMatched = false;

        if (mentionSettings.includeReplyContext === true && isChatPage()) {
            replyContextText = getMessageReplyContextText(messageEl);
            replyAuthorText = getMessageReplyAuthorText(messageEl);
            normalizedReplyContextText = normalizeMentionComparableText(replyAuthorText).replace(/^@+/, '');
            replyMentionMatched = !!normalizedWatchedUsername && normalizedReplyContextText === normalizedWatchedUsername;
        }

        const matched = directMentionMatched || replyMentionMatched;

        logMentionDebug('mention check', {
            watchedUsername,
            normalizedWatchedUsername,
            messageText,
            normalizedMessageText,
            replyContextText,
            replyAuthorText,
            normalizedReplyContextText,
            directMentionMatched,
            replyMentionMatched,
            matched
        });

        return matched;
    }

    function findUsernameTrigger(target) {
        if (!(target instanceof Element)) return null;

        if (isTr4kerPage()) {
            // Le bouton de pseudo Tr4ker ne porte pas d'attribut type="button".
            return target.closest('button[class*="msgSender"], [class*="msgSender"]');
        }

        if (isChatPage()) {
            return target.closest('button[type="button"]');
        }

        if (isHomePage()) {
            return target.closest('span.text-xs.font-bold');
        }

        return null;
    }

    function isExcludedMessageShortcutTarget(target) {
        if (!(target instanceof Element)) return true;

        return !!target.closest(
            [
                `#${PANEL_ID}`,
                `#${AFK_PANEL_ID}`,
                `#${MODAL_ID}`,
                `#${OVERLAY_ID}`,
                `#${IMAGE_VIEWER_MODAL_ID}`,
                `#${IMAGE_VIEWER_OVERLAY_ID}`,
                `#${TOAST_ID}`,
                'button',
                'a',
                'textarea',
                'input',
                'select',
                'option',
                'label',
                'img'
            ].join(', ')
        );
    }

    function installQuickToggleHandler() {
        document.addEventListener('click', (event) => {
            if (!event.altKey || event.button !== 0 || modalOpen || !isSupportedPage()) return;

            const target = event.target;
            if (!(target instanceof Element)) return;

            const trigger = findUsernameTrigger(target);
            if (!trigger) return;

            const messageEl = findMessageElementFromTarget(trigger);
            if (!messageEl || !messageEl.contains(trigger)) return;

            const username = getUsernameFromMessage(messageEl);
            if (!username) return;

            event.preventDefault();
            event.stopPropagation();

            const result = addOrToggleUser(username);
            showToast(result.message, !result.ok);
        }, true);
    }

    function installNativeReplyShortcutHandler() {
        document.addEventListener('dblclick', (event) => {
            if (modalOpen || !isChatPage()) return;
            if (event.button !== 0) return;

            const target = event.target;
            if (!(target instanceof Element)) return;
            if (isExcludedMessageShortcutTarget(target)) return;

            const messageEl = findMessageElementFromTarget(target);
            if (!messageEl || !messageEl.contains(target)) return;

            const replyButton = getMessageReplyActionButton(messageEl);
            if (!(replyButton instanceof HTMLButtonElement) || replyButton.disabled) return;

            event.preventDefault();
            event.stopPropagation();
            replyButton.click();
        }, true);
    }

    function installSavedPhrasesReplyContextTracker() {
        document.addEventListener('click', (event) => {
            if (modalOpen || !isChatPage()) return;

            const target = event.target;
            if (!(target instanceof Element)) return;

            const clickedButton = target.closest('button');
            if (!(clickedButton instanceof HTMLButtonElement)) return;

            const messageEl = findMessageElementFromTarget(clickedButton);
            if (!messageEl || !messageEl.contains(clickedButton)) return;

            const replyButton = getMessageReplyActionButton(messageEl);
            if (!(replyButton instanceof HTMLButtonElement) || replyButton.disabled) return;
            if (clickedButton !== replyButton && !replyButton.contains(clickedButton)) return;

            setSavedPhrasesReplyContextFromMessage(messageEl);
            scheduleChatInputToolbarResync();
        }, true);
    }

    function installNativeReactionButtonPositionHandler() {
        document.addEventListener('click', (event) => {
            if (modalOpen || !isChatPage()) return;

            // Le picker Tr4ker est ancré à la ligne du message. Le transformer
            // en élément fixed agrandit parfois la zone défilable horizontalement
            // du chat : on laisse donc le positionnement natif intact.
            if (isTr4kerPage()) return;

            const target = event.target;
            if (!(target instanceof Element)) return;

            const clickedButton = target.closest('button');
            if (!(clickedButton instanceof HTMLButtonElement)) return;

            const messageEl = findMessageElementFromTarget(clickedButton);
            if (!messageEl || !messageEl.contains(clickedButton)) return;

            const reactionButton = getMessageReactionActionButton(messageEl);
            if (!(reactionButton instanceof HTMLButtonElement) || reactionButton.disabled) return;
            if (clickedButton !== reactionButton && !reactionButton.contains(clickedButton)) return;

            elevateVisibleReactionPicker();

            if (messageActionsLeftEnabled) {
                positionReactionPickerNearPointer(event.clientX, event.clientY);
            }
        }, true);
    }

    function clearLongPressReactionState() {
        if (!longPressReactionState) return;

        if (longPressReactionState.timerId) {
            clearTimeout(longPressReactionState.timerId);
        }

        longPressReactionState = null;
    }

    function installNativeReactionShortcutHandler() {
        document.addEventListener('pointerdown', (event) => {
            clearLongPressReactionState();

            if (modalOpen || !isChatPage()) return;
            if (!event.isPrimary || event.button !== 0) return;

            const target = event.target;
            if (!(target instanceof Element)) return;
            if (isExcludedMessageShortcutTarget(target)) return;

            const messageEl = findMessageElementFromTarget(target);
            if (!messageEl || !messageEl.contains(target)) return;

            const reactionButton = getMessageReactionActionButton(messageEl);
            if (!(reactionButton instanceof HTMLButtonElement) || reactionButton.disabled) return;

            const state = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                reactionButton,
                triggered: false,
                timerId: window.setTimeout(() => {
                    if (!longPressReactionState || longPressReactionState.pointerId !== event.pointerId) return;

                    longPressReactionState.triggered = true;
                    reactionButton.click();
                    if (!isTr4kerPage()) {
                        positionReactionPickerNearPointer(event.clientX, event.clientY);
                    }
                }, LONG_PRESS_REACTION_DELAY_MS)
            };

            longPressReactionState = state;
        }, true);

        document.addEventListener('pointermove', (event) => {
            if (!longPressReactionState || longPressReactionState.pointerId !== event.pointerId) return;

            const movedX = Math.abs(event.clientX - longPressReactionState.startX);
            const movedY = Math.abs(event.clientY - longPressReactionState.startY);
            if (movedX > LONG_PRESS_REACTION_MOVE_THRESHOLD_PX || movedY > LONG_PRESS_REACTION_MOVE_THRESHOLD_PX) {
                clearLongPressReactionState();
            }
        }, true);

        document.addEventListener('pointerup', (event) => {
            if (!longPressReactionState || longPressReactionState.pointerId !== event.pointerId) return;
            clearLongPressReactionState();
        }, true);

        document.addEventListener('pointercancel', (event) => {
            if (!longPressReactionState || longPressReactionState.pointerId !== event.pointerId) return;
            clearLongPressReactionState();
        }, true);

        document.addEventListener('contextmenu', () => {
            clearLongPressReactionState();
        }, true);

        window.addEventListener('blur', () => {
            clearLongPressReactionState();
        });
    }

    function installImagePreviewHandler() {
        document.addEventListener('mousemove', (event) => {
            if (imageViewerOpen || modalOpen || !isSupportedPage()) {
                if (hoveredMessageImage) hideImagePreview();
                return;
            }

            if (event.target instanceof Element && event.target.closest(`#${IMAGE_PREVIEW_ID}`)) {
                return;
            }

            const linkPreview = getMessageLinkImagePreviewCandidatesFromTarget(event.target);
            if (linkPreview) {
                if (hoveredMessageImage !== linkPreview.hoverTarget) {
                    showImagePreviewFromCandidates(
                        linkPreview.hoverTarget,
                        linkPreview.candidateUrls,
                        event.clientX,
                        event.clientY
                    );
                    return;
                }

                positionImagePreview(event.clientX, event.clientY);
                return;
            }

            const image = getMessageContentImageFromTarget(event.target);
            if (!image) {
                if (hoveredMessageImage) hideImagePreview();
                return;
            }

            if (hoveredMessageImage !== image) {
                showImagePreview(image, event.clientX, event.clientY);
                return;
            }

            positionImagePreview(event.clientX, event.clientY);
        }, true);

        document.addEventListener('scroll', () => {
            if (hoveredMessageImage) hideImagePreview();
        }, true);

        document.addEventListener('click', (event) => {
            if (imageViewerOpen || modalOpen || !isSupportedPage()) return;

            const target = event.target;
            if (!(target instanceof Element)) return;

            const linkPreview = getMessageLinkImagePreviewCandidatesFromTarget(target);
            if (linkPreview) {
                event.preventDefault();
                event.stopPropagation();
                openImageViewerFromCandidates(linkPreview.candidateUrls);
                return;
            }

            const image = getMessageContentImageFromTarget(target);
            if (!(image instanceof HTMLImageElement)) return;

            const source = image.currentSrc || image.src;
            if (!source) return;

            event.preventDefault();
            event.stopPropagation();
            openImageViewerFromCandidates([source]);
        }, true);
    }

    function installNativeEmojiUsageTracker() {
        logEmojiDebug('tracker: installed');

        document.addEventListener('click', (event) => {
            if (!isSupportedPage()) return;
            if (quickAccessMode === QUICK_ACCESS_MODE_MANUAL) {
                window.setTimeout(() => {
                    syncManualQuickAccessPickerMarkers();
                }, 0);
            }

            const picker = findNativeEmojiPickerFromTarget(event.target);
            if (picker instanceof HTMLDivElement) {
                logEmojiDebug('click: inside native emoji picker', {
                    targetTag: event.target instanceof Element ? event.target.tagName : '',
                    targetClass: event.target instanceof Element ? event.target.className : '',
                    pickerRect: picker.getBoundingClientRect().toJSON?.() || null
                });
                syncManualQuickAccessPickerMarkers(picker);
            }

            const emojiButton = findNativeEmojiPickerButtonFromTarget(event.target);
            if (!(emojiButton instanceof HTMLButtonElement)) {
                if (picker instanceof HTMLDivElement) {
                    logEmojiDebug('click: picker detected but emoji button not resolved', {
                        targetHtml: event.target instanceof Element ? event.target.outerHTML.slice(0, 300) : ''
                    });
                }
                return;
            }

            if (isManualQuickAccessPickerToggleEvent(event)) {
                event.preventDefault();
                event.stopImmediatePropagation();

                const result = toggleManualEmojiFavoriteFromButton(emojiButton);
                syncManualQuickAccessPickerMarkers(picker || document);
                showToast(result.message, !result.ok);
                return;
            }

            const extractedRecord = extractEmojiUsageRecordFromButton(emojiButton);
            logEmojiDebug('click: emoji button resolved', {
                title: extractedRecord?.title || '',
                alt: extractedRecord?.alt || '',
                src: extractedRecord?.src || '',
                key: extractedRecord?.key || ''
            });

            recordEmojiUsageFromButton(emojiButton);
        }, true);

        document.addEventListener('pointerdown', (event) => {
            if (!isSupportedPage()) return;

            const picker = findNativeEmojiPickerFromTarget(event.target);
            if (!(picker instanceof HTMLDivElement)) return;
            syncManualQuickAccessPickerMarkers(picker);

            logEmojiDebug('pointerdown: inside native emoji picker', {
                targetTag: event.target instanceof Element ? event.target.tagName : '',
                targetClass: event.target instanceof Element ? event.target.className : ''
            });
        }, true);
    }

    function installReactionUsageTracker() {
        logEmojiDebug('reaction tracker: installed');

        const trackReactionInteraction = (eventName, event) => {
            if (!isChatPage()) return;
            if ('button' in event && event.button !== 0) return;

            const reactionButton = findReactionUsageButtonFromTarget(event.target);
            if (!(reactionButton instanceof HTMLButtonElement)) return;

            const picker = findReactionUsagePickerRootFromTarget(reactionButton);
            if (picker instanceof HTMLElement) {
                syncManualQuickAccessPickerMarkers(picker);
            }

            if (isManualQuickAccessPickerToggleEvent(event)) {
                if (eventName !== 'click') return;

                event.preventDefault();
                event.stopImmediatePropagation();

                const result = toggleManualReactionFavoriteFromButton(reactionButton);
                syncManualQuickAccessPickerMarkers(picker || document);
                showToast(result.message, !result.ok);
                return;
            }

            const extractedRecord = extractReactionUsageRecordFromButton(reactionButton);
            logEmojiDebug(`reaction ${eventName}: button resolved`, {
                label: extractedRecord?.label || '',
                title: extractedRecord?.title || '',
                alt: extractedRecord?.alt || '',
                src: extractedRecord?.src || '',
                key: extractedRecord?.key || ''
            });
            if (shouldSkipDuplicateReactionUsage(extractedRecord?.key || '')) {
                logEmojiDebug(`reaction ${eventName}: duplicate ignored`, {
                    key: extractedRecord?.key || ''
                });
                return;
            }

            recordReactionUsageFromButton(reactionButton);
        };

        document.addEventListener('pointerdown', (event) => {
            trackReactionInteraction('pointerdown', event);
        }, true);

        document.addEventListener('click', (event) => {
            trackReactionInteraction('click', event);
        }, true);
    }

    function installYouTubePlayerHandler() {
        document.addEventListener('click', (event) => {
            if (modalOpen || !isSupportedPage()) return;

            const target = event.target;
            if (!(target instanceof Element)) return;

            const playButton = target.closest('button[data-tm-youtube-play-link="1"]');
            if (!(playButton instanceof HTMLButtonElement)) return;

            const embedUrl = playButton.getAttribute('data-tm-youtube-embed-url') || '';
            const videoId = playButton.getAttribute('data-tm-youtube-video-id') || '';
            const watchUrl = playButton.getAttribute('data-tm-youtube-watch-url') || '';
            if (!embedUrl) return;

            event.preventDefault();
            event.stopPropagation();
            openYouTubePlayer(embedUrl, { videoId, watchUrl });
        }, true);
    }

    function stopObserver() {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
    }

    function prepareForTr4kerRouteTransition() {
        if (!isTr4kerPage()) return;

        // Ne pas laisser l'observateur traiter une bulle pendant que React la
        // démonte. Les contrôles YouTube seront recréés après le rendu du
        // nouveau canal par refreshForRoute().
        stopObserver();
        document.querySelectorAll('button[data-tm-youtube-play-link="1"]').forEach((button) => {
            button.remove();
        });
    }

    function refreshForRoute() {
        const currentChatContextKey = getCurrentChatContextKey();

        if (!isChatPage()) {
            clearSavedPhrasesReplyContext();
        } else if (savedPhrasesReplyContext && savedPhrasesReplyContext.contextKey !== currentChatContextKey) {
            clearSavedPhrasesReplyContext();
        }

        lastChatContextKey = currentChatContextKey;

        if (isSupportedPage()) {
            statsDisplayMode = loadStatsDisplayMode();
            statsHidden = loadStatsHidden();
            chatScrollbarEnabled = loadChatScrollbarEnabled();
            messageActionsLeftEnabled = loadMessageActionsLeftEnabled();

            if (isHomePage() && !getHomepageChatContainer()) {
                removeEmojiQuickAccessToolbar();
                removeMessageReactionQuickAccessButtons();
                removeSavedPhrasesToolbar();
                removeKlipyGifToolbar();
                removeImageUploadToolbar();
                stopObserver();
                return;
            }

            createStatsBox();
            syncHomepageCollapseUi(true);
            applyBoxPosition();
            applyChatPageScrollbarState();
            applyMessageActionsPositionState();
            applyHomeChatPopoverState();
            applyNativeChatInputPopoverState();
            injectEmojiQuickAccessToolbar();
            injectSavedPhrasesToolbar();
            injectKlipyGifToolbar();
            injectImageUploadToolbar();
            applyChatInputToolbarAlignmentState();
            syncNativeChatInputActionButtons();

            if (isAfkEnabledForCurrentContext()) {
                startAfkReplayProtectionForCurrentContext();
                seedAfkSeenMessagesFromCurrentRoot();
            } else {
                clearAfkReplayProtection();
            }

            if (isHomePage() && homeChatCollapsed) {
                stopObserver();
            } else {
                processAllMessages();
                startObserver();
            }

            refreshReactionQuickAccessButtons();
            renderAfkPanel();
        } else {
            applyMessageActionsPositionState();
            applyHomeChatPopoverState();
            applyNativeChatInputPopoverState();
            stopObserver();
            removeEmojiQuickAccessToolbar();
            removeMessageReactionQuickAccessButtons();
            removeSavedPhrasesToolbar();
            removeKlipyGifToolbar();
            removeImageUploadToolbar();
            removeStatsBox();
            closeSettingsModal();
            closeImageViewer();
            closeYouTubePlayer();
            hideImagePreview();
            removeToast();
            syncNativeChatInputActionButtons();
            renderAfkPanel();
        }
    }

    function installRouteWatcher() {
        if (routeWatcher) return;

        let lastUrl = location.href;
        let lastPageType = getCurrentPageType();

        routeWatcher = setInterval(() => {
            const currentPageType = getCurrentPageType();

            if (isChatPage()) {
                applyChatPageScrollbarState();
            }

            if (location.href !== lastUrl || currentPageType !== lastPageType) {
                lastUrl = location.href;
                lastPageType = currentPageType;
                refreshForRoute();
            } else if (isChatPage() && getCurrentChatContextKey() !== lastChatContextKey) {
                lastChatContextKey = getCurrentChatContextKey();
                clearSavedPhrasesReplyContext();
                injectEmojiQuickAccessToolbar();
                injectSavedPhrasesToolbar();
                injectKlipyGifToolbar();
                injectImageUploadToolbar();
                applyChatInputToolbarAlignmentState();
                syncNativeChatInputActionButtons();
                if (isAfkEnabledForCurrentContext()) {
                    startAfkReplayProtectionForCurrentContext();
                    seedAfkSeenMessagesFromCurrentRoot();
                } else {
                    clearAfkReplayProtection();
                }
                processAllMessages();
                refreshReactionQuickAccessButtons();
                renderAfkPanel();
            } else if (isTr4kerPage() && isChatPage() && !getChatPageMessagesRoot()) {
                refreshForRoute();
            } else if (isHomePage() && !getHomepageChatContainer()) {
                removeEmojiQuickAccessToolbar();
                removeMessageReactionQuickAccessButtons();
                removeSavedPhrasesToolbar();
                removeKlipyGifToolbar();
                removeImageUploadToolbar();
                stopObserver();
            } else if (isHomePage() && needsHomepageCollapseUiRefresh()) {
                syncHomepageCollapseUi();
            } else if (isHomePage() && getHomepageChatContainer() && !observer) {
                refreshForRoute();
            } else if (isSupportedPage()) {
                const emojiWrapper = document.getElementById(EMOJI_QUICK_ACCESS_WRAPPER_ID);
                if (
                    (emojiQuickAccessLimit <= 0 || getQuickAccessEmojiRecords(1).length === 0) &&
                    emojiWrapper instanceof HTMLElement
                ) {
                    removeEmojiQuickAccessToolbar();
                }

                if (!savedPhrasesEnabled) {
                    removeSavedPhrasesToolbar();
                }

                if (!klipyGifsEnabled) {
                    removeKlipyGifToolbar();
                }

                if (!imageHostingEnabled) {
                    removeImageUploadToolbar();
                }

                const textInput = getChatInput();
                if (textInput) {
                    const mountContext = getChatInputToolbarMountContext(textInput);
                    const toolbarHost = getChatInputToolbarRailHost(mountContext) || mountContext.mountParent;
                    const currentEmojiWrapper = document.getElementById(EMOJI_QUICK_ACCESS_WRAPPER_ID);
                    const phrasesWrapper = document.getElementById(PHRASES_MENU_WRAPPER_ID);
                    const gifWrapper = document.getElementById(GIF_MENU_WRAPPER_ID);
                    const imageUploadWrapper = document.getElementById(IMAGE_UPLOAD_MENU_WRAPPER_ID);
                    let toolbarNeedsSync = !isChatInputToolbarLayoutStable(mountContext);

                    if (
                        emojiQuickAccessLimit > 0 &&
                        getQuickAccessEmojiRecords(1).length > 0 &&
                        toolbarHost &&
                        (!currentEmojiWrapper || !toolbarHost.contains(currentEmojiWrapper))
                    ) {
                        injectEmojiQuickAccessToolbar();
                        toolbarNeedsSync = true;
                    }

                    if (
                        savedPhrasesEnabled &&
                        savedPhrases.length > 0 &&
                        toolbarHost &&
                        (!phrasesWrapper || !toolbarHost.contains(phrasesWrapper))
                    ) {
                        injectSavedPhrasesToolbar();
                        toolbarNeedsSync = true;
                    }

                    if (klipyGifsEnabled && toolbarHost && (!gifWrapper || !toolbarHost.contains(gifWrapper))) {
                        injectKlipyGifToolbar();
                        toolbarNeedsSync = true;
                    }

                    if (imageHostingEnabled && toolbarHost && (!imageUploadWrapper || !toolbarHost.contains(imageUploadWrapper))) {
                        injectImageUploadToolbar();
                        toolbarNeedsSync = true;
                    }

                    if (toolbarNeedsSync) {
                        applyChatInputToolbarAlignmentState();
                        syncNativeChatInputActionButtons(textInput);
                    }
                }

                refreshReactionQuickAccessButtons();
                renderAfkPanel();
            }
        }, 500);

        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = function () {
            prepareForTr4kerRouteTransition();
            const result = originalPushState.apply(this, arguments);
            setTimeout(refreshForRoute, 50);
            return result;
        };

        history.replaceState = function () {
            prepareForTr4kerRouteTransition();
            const result = originalReplaceState.apply(this, arguments);
            setTimeout(refreshForRoute, 50);
            return result;
        };

        window.addEventListener('popstate', () => {
            prepareForTr4kerRouteTransition();
            setTimeout(refreshForRoute, 50);
        });

        window.addEventListener('resize', () => {
            const gifMenu = getKlipyGifMenu();
            if (gifMenu instanceof HTMLElement && gifMenu.dataset.tmOpen === '1') {
                positionKlipyGifMenu(gifMenu);
            }

            const afkPanel = document.getElementById(AFK_PANEL_ID);
            if (afkPanel instanceof HTMLElement) {
                constrainAfkPanelToViewport(afkPanel);
            }

            if (statsBox instanceof HTMLElement) {
                constrainStatsBoxToViewport(true, false);
            }

            if (!isChatPage() || !messageActionsLeftEnabled) return;
            processAllMessages();
        });

        window.addEventListener('storage', (event) => {
            if (
                event.key !== STORAGE_KEY_AFK_STATE &&
                event.key !== STORAGE_KEY_AFK_ACTIVITY &&
                event.key !== STORAGE_KEY_AFK_PANEL_POSITION &&
                event.key !== STORAGE_KEY_AFK_PANEL_HIDDEN
            ) {
                return;
            }

            afkState = loadAfkState();
            afkActivityRecords = loadAfkActivityRecords();
            afkPanelPosition = loadAfkPanelPosition();
            afkPanelHidden = loadAfkPanelHidden();

            if (isAfkEnabledForCurrentContext()) {
                startAfkReplayProtectionForCurrentContext();
                seedAfkSeenMessagesFromCurrentRoot();
            } else {
                clearAfkReplayProtection();
            }

            renderAfkPanel();
        });
    }

    document.addEventListener('keydown', function (e) {
        const key = String(e.key || '').toLowerCase();
        const isClassicShortcut = e.ctrlKey && e.altKey && !e.metaKey && key === 'c';
        const isMacShortcut = e.ctrlKey && e.metaKey && !e.altKey && key === 'c';
        const isClassicAfkShortcut = e.ctrlKey && e.altKey && !e.metaKey && key === 'a';
        const isMacAfkShortcut = e.ctrlKey && e.metaKey && !e.altKey && key === 'a';
        const isClassicSavedPhrasesShortcut = e.ctrlKey && e.altKey && !e.metaKey && key === 'r';
        const isMacSavedPhrasesShortcut = e.ctrlKey && e.metaKey && !e.altKey && key === 'r';

        if (isClassicShortcut || isMacShortcut) {
            if (!isSupportedPage()) return;
            if (imageViewerOpen) return;
            e.preventDefault();
            openSettingsModal();
            return;
        }

        if (isClassicSavedPhrasesShortcut || isMacSavedPhrasesShortcut) {
            if (!isSupportedPage()) return;
            if (imageViewerOpen || modalOpen) return;
            e.preventDefault();

            if (!openSavedPhrasesMenuFromShortcut()) {
                showToast('Réponses rapides indisponibles.', true);
            }
            return;
        }

        if (isClassicAfkShortcut || isMacAfkShortcut) {
            if (!isSupportedPage()) return;
            if (imageViewerOpen) return;
            e.preventDefault();

            if (!afkState.enabled && afkPanelHidden && shouldDisplayAfkPanelForCurrentPage()) {
                saveAfkPanelHidden(false);
                renderAfkPanel();
                showToast('Panneau AFK réouvert.');
                return;
            }

            const result = toggleAfkModeForCurrentContext();
            showToast(result.message, !result.ok);
        }
    });

    function init() {
        installQuickToggleHandler();
        installNativeReplyShortcutHandler();
        installAfkAutoDisableOnManualSend();
        installSavedPhrasesReplyContextTracker();
        installNativeReactionButtonPositionHandler();
        installNativeReactionShortcutHandler();
        installNativePickerContextTracker();
        installNativeEmojiUsageTracker();
        installReactionUsageTracker();
        installImagePreviewHandler();
        installYouTubePlayerHandler();
        installImagePasteHandler();
        installRouteWatcher();
        document.addEventListener('click', handleStatsBoxActionClick, true);
        refreshForRoute();
        console.log(`[Tr4ker Chat] Script actif. Raccourcis : Ctrl+Alt+C / Ctrl+Cmd+C · Ctrl+Alt+R / Ctrl+Cmd+R · ${formatAfkShortcutLabel()}`);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
