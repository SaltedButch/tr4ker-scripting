/**
 * Point d'entrée du userscript et bootstrap de l'application.
 *
 * @module src/entry
 */
import { createApplication } from './core/application.js';
import registerFeatures from 'features:glob';

function bootstrap() {
    const app = createApplication({
        appId: 'tm-t4-next',
        logger: console
    });

    registerFeatures(app);
    app.start();

    window.addEventListener('pagehide', () => app.stop(), { once: true });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
    bootstrap();
}
