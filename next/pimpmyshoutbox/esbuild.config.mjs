import { build } from 'esbuild';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const rootUrl = new URL('.', import.meta.url);
const root = fileURLToPath(rootUrl);
const metadata = await readFile(new URL('./metadata.user.js', import.meta.url), 'utf8');

await mkdir(new URL('./dist/', import.meta.url), { recursive: true });

await build({
    entryPoints: [fileURLToPath(new URL('./src/entry.js', import.meta.url))],
    outfile: fileURLToPath(new URL('./dist/pimpmyshoutbox-next.user.js', import.meta.url)),
    bundle: true,
    format: 'iife',
    target: ['es2022'],
    banner: { js: metadata.trim() },
    legalComments: 'none',
    sourcemap: true,
    logLevel: 'info'
});

console.log(`Built ${root}dist/pimpmyshoutbox-next.user.js`);
