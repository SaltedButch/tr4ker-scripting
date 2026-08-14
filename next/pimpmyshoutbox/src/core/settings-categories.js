/**
 * Définit et valide les zones et catégories de réglages.
 *
 * @module src/core/settings-categories
 */
export const SETTINGS_AREAS = Object.freeze([
    { id: 'shoutbox', label: 'Shoutbox', order: 10 },
    { id: 'site', label: 'Site Tr4ker', order: 20 },
    { id: 'profile', label: 'Profil', order: 30 },
    { id: 'tools', label: 'Outils', order: 40 },
    { id: 'appearance', label: 'Apparence', order: 50 }
]);

export const SETTINGS_CATEGORIES = Object.freeze([
    { id: 'general', label: 'Général', area: 'tools', order: 10 },
    { id: 'filtering', label: 'Filtrage', area: 'shoutbox', order: 20 },
    { id: 'chat', label: 'Chat', area: 'shoutbox', order: 30 },
    { id: 'shoutbox-appearance', label: 'Affichage', area: 'shoutbox', order: 35 },
    { id: 'mentions', label: 'Mentions', area: 'shoutbox', order: 40 },
    { id: 'media', label: 'Médias', area: 'shoutbox', order: 50 },
    { id: 'shortcuts', label: 'Raccourcis', area: 'shoutbox', order: 60 },
    { id: 'appearance', label: 'Apparence', area: 'site', order: 60 },
    { id: 'statistics', label: 'Statistiques', area: 'site', order: 70 },
    { id: 'site', label: 'Réglages du site', area: 'site', order: 80 },
    { id: 'profile', label: 'Profil', area: 'profile', order: 90 },
    { id: 'tools', label: 'Outils', area: 'tools', order: 100 }
]);

const categoryIds = new Set(SETTINGS_CATEGORIES.map((category) => category.id));
const areaIds = new Set(SETTINGS_AREAS.map((area) => area.id));

/**
 * Indique si la condition vérifiée par « isSettingsCategory » est satisfaite.
 *
 * @function isSettingsCategory
 */
export function isSettingsCategory(categoryId) {
    return categoryIds.has(categoryId);
}

/**
 * Indique si la condition vérifiée par « isSettingsArea » est satisfaite.
 *
 * @function isSettingsArea
 */
export function isSettingsArea(areaId) {
    return areaIds.has(areaId);
}

/**
 * Retourne la valeur calculée par « getSettingsCategory ».
 *
 * @function getSettingsCategory
 */
export function getSettingsCategory(categoryId) {
    return SETTINGS_CATEGORIES.find((category) => category.id === categoryId) || null;
}

/**
 * Retourne la valeur calculée par « getSettingsArea ».
 *
 * @function getSettingsArea
 */
export function getSettingsArea(areaId) {
    return SETTINGS_AREAS.find((area) => area.id === areaId) || null;
}
