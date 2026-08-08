import { createApplication } from './core/application.js';
import blacklistFeature from './features/blacklist/feature.js';

function bootstrap() {
    const app = createApplication({
        appId: 'tm-t4-next',
        logger: console
    });

    app.features.register(blacklistFeature);
    app.start();

    window.addEventListener('pagehide', () => app.stop(), { once: true });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
    bootstrap();
}
