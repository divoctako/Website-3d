import { defineConfig, type Plugin } from 'vite';
import { buildJsonLd } from './src/content/jsonld';

// Shared PI-R site bar + SEO (../shared). Optional, so this repo still builds on its own in CI.
const sharedPlugin = new URL('../shared/vite-plugin.ts', import.meta.url).href;
const shared: typeof import('../shared/vite-plugin') | null = await import(/* @vite-ignore */ sharedPlugin).catch(() => null);

/** Puts the schema.org JSON-LD into the static HTML, so crawlers see it without running JS. */
function jsonLd(): Plugin {
  return {
    name: 'json-ld',
    transformIndexHtml: () => [
      {
        tag: 'script',
        attrs: { type: 'application/ld+json' },
        // "<" escaped so the JSON can never close the script tag
        children: JSON.stringify(buildJsonLd()).replace(/</g, '\\u003c'),
        injectTo: 'head',
      },
    ],
  };
}

export default defineConfig({
  base: './',
  // PORT lets a launcher assign the dev port; 5173 otherwise
  server: { host: true, port: Number(process.env.PORT) || 5173 },
  plugins: [shared?.pirSite('sealion-7'),jsonLd()],
});
