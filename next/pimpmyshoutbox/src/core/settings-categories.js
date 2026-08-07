export const SETTINGS_CATEGORIES = Object.freeze([
    { id: 'general', label: 'Général', order: 10 },
    { id: 'chat', label: 'Chat', order: 20 },
    { id: 'mentions', label: 'Mentions & AFK', order: 30 },
    { id: 'media', label: 'Médias', order: 40 },
    { id: 'shortcuts', label: 'Raccourcis', order: 50 },
    { id: 'appearance', label: 'Apparence', order: 60 },
    { id: 'statistics', label: 'Statistiques', order: 70 }
]);

const categoryIds = new Set(SETTINGS_CATEGORIES.map((category) => category.id));

export function isSettingsCategory(categoryId) {
    return categoryIds.has(categoryId);
}
