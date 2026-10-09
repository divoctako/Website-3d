// Bundles dist/ into one self-contained HTML file (CSS, JS and images inlined)
// so the prototype can be opened without a server, e.g. on a phone.
// Usage: npm run build && node scripts/build-single.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
let html = readFileSync(join(dist, 'index.html'), 'utf8');

const inlineImages = (code) =>
  code.replace(/assets\/([\w-]+\.webp)/g, (_, file) => {
    const data = readFileSync(join(dist, 'assets', file)).toString('base64');
    return `data:image/webp;base64,${data}`;
  });

html = html.replace(/<link rel="stylesheet"[^>]*href="\.\/assets\/([^"]+\.css)"[^>]*>/, (_, file) => {
  const css = readFileSync(join(dist, 'assets', file), 'utf8');
  return `<style>\n${inlineImages(css)}\n</style>`;
});
html = html.replace(/<script type="module"[^>]*src="\.\/assets\/([^"]+\.js)"[^>]*><\/script>/, (_, file) => {
  const js = inlineImages(readFileSync(join(dist, 'assets', file), 'utf8')).replace(/<\/script/gi, '<\\/script');
  return `<script type="module">\n${js}\n</script>`;
});
html = html.replace(/\s*<meta property="og:image"[^>]*>/, '');

mkdirSync('dist-single', { recursive: true });
writeFileSync('dist-single/sealion7.html', html);
console.log(`dist-single/sealion7.html ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB`);
