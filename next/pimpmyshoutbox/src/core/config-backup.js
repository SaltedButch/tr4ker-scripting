export const CONFIGURATION_IMPORTED_EVENT = 'tm-t4-next:configuration-imported';

const EXPORT_VERSION = 1;

// Liste blanche reprise de la V3. Les clés de secrets (notamment ImgBB) et les
// historiques de session sont volontairement exclues.
const V3_STORAGE_KEYS = [
    'tm_hidden_shout_users_t4',
    'tm_t4_stats_box_position_chat', 'tm_t4_stats_box_size_chat',
    'tm_t4_stats_box_collapsed_chat', 'tm_t4_stats_box_hidden_chat',
    'tm_t4_settings_bubble_enabled', 'tm_t4_debug_mode',
    'tm_highlighted_shout_users_t4', 'tm_t4_mention_highlight_settings',
    'tm_t4_cross_channel_mention_enabled', 'tm_t4_cross_channel_mention_channels',
    'tm_t4_mention_inbox_v1', 'tm_t4_mention_inbox_enabled',
    'tm_t4_chat_font_scale', 'tm_t4_chat_scrollbar_enabled',
    'tm_t4_profile_hover_enabled', 'tm_t4_custom_background_enabled',
    'tm_t4_custom_background_color', 'tm_t4_message_actions_left_enabled',
    'tm_t4_topbar_stats_enabled', 'tm_t4_topbar_stats_all_site',
    'tm_t4_topbar_stats_show_credits', 'tm_t4_topbar_stats_show_buffer',
    'tm_t4_topbar_stats_show_total_upload', 'tm_t4_topbar_stats_show_total_download',
    'tm_t4_topbar_stats_show_periodic_section', 'tm_t4_topbar_stats_mode',
    'tm_t4_topbar_stats_show_global_ratio', 'tm_t4_topbar_stats_show_24h',
    'tm_t4_topbar_stats_show_7d', 'tm_t4_topbar_stats_show_30d',
    'tm_t4_matrix_global_upload', 'tm_t4_matrix_global_download',
    'tm_t4_matrix_ticker_enabled', 'tm_t4_matrix_ticker_speed',
    'tm_t4_matrix_ticker_pause_hover', 'tm_t4_matrix_period_24h_ratio',
    'tm_t4_matrix_period_24h_upload', 'tm_t4_matrix_period_24h_download',
    'tm_t4_matrix_period_7d_ratio', 'tm_t4_matrix_period_7d_upload',
    'tm_t4_matrix_period_7d_download', 'tm_t4_matrix_period_30d_ratio',
    'tm_t4_matrix_period_30d_upload', 'tm_t4_matrix_period_30d_download',
    'tm_t4_matrix_carousel_interval', 'tm_t4_matrix_carousel_pause_hover',
    'tm_t4_topbar_burger_enabled', 'tm_t4_linkify_urls', 'tm_t4_embed_url_images',
    'tm_t4_saved_phrases', 'tm_t4_saved_phrases_enabled',
    'tm_t4_saved_phrases_replace_input', 'tm_t4_klipy_gifs_enabled',
    'tm_t4_t9_emoj_enabled', 'tm_t4_image_hosting_enabled',
    'tm_t4_image_hosting_expiration_seconds', 'tm_t4_emoji_usage_counts',
    'tm_t4_reaction_usage_counts', 'tm_t4_emoji_quick_access_limit',
    'tm_t4_reaction_quick_access_limit', 'tm_t4_quick_access_mode',
    'tm_t4_manual_emoji_favorites', 'tm_t4_manual_reaction_favorites',
    'tm_t4_chat_input_toolbar_inline', 'tm_t4_chat_input_toolbar_align_right',
    'tm_t4_chat_sidebar_width', 'tm_t4_chat_sidebar_collapsed',
    'tm_t4_youtube_inline_enabled',
    'tm_t4_image_hosting_enabled', 'tm_t4_image_hosting_expiration_seconds',
    'tm_t4_credit_recap_enabled', 'tm_t4_private_message_notifications_enabled',
    'tm_t4_afk_channels', 'tm_t4_afk_panel_position',
    'tm_t4_grade_pseudonym_colors', 'tm_t4_grade_pseudonym_effects'
];

const NEXT_STORAGE_KEYS = [
    'tm-t4-next:settings:active-area',
    'tm-t4-next:settings:active-subcategory',
    'tm-t4-next:settings:bounds',
    'tm-t4-next:feature:blacklist:enabled',
    'tm-t4-next:feature:mentions:enabled',
    'tm-t4-next:feature:profile-hover:enabled',
    'tm-t4-next:feature:pimp-my-grade:enabled',
    'tm-t4-next:feature:klipy-gifs:enabled',
    'tm-t4-next:feature:t9-emoj:enabled',
    'tm-t4-next:feature:imgbb-upload:enabled',
    'tm-t4-next:feature:adult-mode:enabled',
    'tm-t4-next:feature:highlight-users:enabled',
    'tm-t4-next:feature:chat-sidebar:enabled',
    'tm-t4-next:feature:youtube-player:enabled',
    'tm-t4-next:feature:t9-header:enabled',
    'tm-t4-next:feature:matrix-header:enabled',
    'tm-t4-next:feature:sober-header:enabled',
    'tm-t4-next:feature:custom-background:enabled',
    'tm-t4-next:feature:message-actions-left:enabled',
    'tm-t4-next:feature:chat-font-size:enabled',
    'tm-t4-next:feature:chat-toolbar-layout:enabled',
    'tm-t4-next:feature:double-click-reply:enabled',
    'tm-t4-next:feature:message-editing:enabled',
    'tm-t4-next:feature:saved-phrases:enabled',
    'tm-t4-next:feature:emoji-favorites:enabled',
    'tm-t4-next:feature:channel-unread-badges:enabled',
    'tm_t4_hidden_channel_unread_badges_channels',
    'tm-t4-next:feature:multi-channel-view:enabled',
    'tm_t4_multi_channel_view_open_ids',
    'tm-t4-next:feature:chat-image-zoom:enabled'
];

const STORAGE_KEYS = Object.freeze([...new Set([...V3_STORAGE_KEYS, ...NEXT_STORAGE_KEYS])]);

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function createConfigurationBackup({ storage }) {
    function buildPayload() {
        const savedStorage = {};
        for (const key of STORAGE_KEYS) {
            const value = storage.get(key);
            if (value !== null) savedStorage[key] = value;
        }
        return {
            version: EXPORT_VERSION,
            exportedAt: new Date().toISOString(),
            source: 'PimpMyShoutbox Next',
            storage: savedStorage
        };
    }

    function download() {
        try {
            const blob = new Blob([JSON.stringify(buildPayload(), null, 2)], {
                type: 'application/json;charset=utf-8'
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `tr4ker-chat-config-${new Date().toISOString().slice(0, 10)}.json`;
            link.style.display = 'none';
            document.body?.append(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 0);
            return { ok: true, message: 'Sauvegarde de configuration téléchargée.' };
        } catch {
            return { ok: false, message: 'Impossible de générer la sauvegarde de configuration.' };
        }
    }

    function importPayload(payload) {
        if (!isPlainObject(payload?.storage)) {
            return { ok: false, message: 'Format JSON invalide pour la configuration du script.' };
        }
        if (Number.isFinite(payload.version) && payload.version > EXPORT_VERSION) {
            return { ok: false, message: 'Cette sauvegarde provient d’une version plus récente du script.' };
        }

        for (const key of STORAGE_KEYS) {
            const value = payload.storage[key];
            if (typeof value === 'string') storage.set(key, value);
            else storage.remove(key);
        }
        window.dispatchEvent(new CustomEvent(CONFIGURATION_IMPORTED_EVENT));
        return { ok: true, message: 'Configuration du script importée.' };
    }

    return Object.freeze({ buildPayload, download, importPayload, storageKeys: STORAGE_KEYS });
}
