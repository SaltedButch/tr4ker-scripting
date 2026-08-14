/**
 * Configure l'assemblage du userscript et la découverte automatique des features.
 *
 * Le bundle distribué est volontairement minifié et les sourcemaps sont désactivées
 * afin de ne pas exposer ni embarquer la documentation des sources.
 *
 * @module esbuild.config
 */
import { build } from 'esbuild';
import { mkdir, readFile, unlink } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootUrl = new URL('.', import.meta.url);
const root = fileURLToPath(rootUrl);
const metadata = await readFile(new URL('./metadata.user.js', import.meta.url), 'utf8');
const outfile = fileURLToPath(new URL('./dist/pimpmyshoutbox-next.user.js', import.meta.url));

await mkdir(new URL('./dist/', import.meta.url), { recursive: true });
await unlink(`${outfile}.map`).catch(() => {});

const featureGlobPlugin = {
    name: 'feature-glob',
    setup(build) {
        build.onResolve({ filter: /^features:glob$/ }, args => ({
            path: args.path,
            namespace: 'feature-glob',
        }));

        build.onLoad({ filter: /.*/, namespace: 'feature-glob' }, async () => {
            const files = [];
            for await (const f of glob('src/features/*/feature.js', { cwd: root })) {
                files.push(f);
            }
            files.sort((left, right) => left.localeCompare(right, 'en'));

            const imports = files
                .map((f, i) => `import feature${i} from '${path.resolve(root, f).replace(/\\/g, '/')}';`)
                .join('\n');

            const registers = files
                .map((_, i) => `app.features.register(feature${i});`)
                .join('\n');

            console.log(`[features] ${files.length} feature(s) détectée(s) :`);
            files.forEach(f => console.log(`  - ${f}`));

            return {
                contents: `${imports}\nexport default function registerFeatures(app) {\n${registers}\n}`,
                loader: 'js',
                resolveDir: root
            };
        });
    },
};

await build({
    entryPoints: [fileURLToPath(new URL('./src/entry.js', import.meta.url))],
    outfile,
    bundle: true,
    format: 'iife',
    target: ['es2022'],
    minify: true,
    banner: { js: metadata.trim() },
    legalComments: 'none',
    sourcemap: false,
    logLevel: 'info',
    plugins: [featureGlobPlugin]
});

console.log(`Built ${outfile}`);
