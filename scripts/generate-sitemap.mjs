import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const API_URL = process.env.VITE_API_URL || 'https://endearing-fulfillment-production.up.railway.app';
const SITE_URL = 'https://studmo.com';

const STATIC_PAGES = [
  { loc: `${SITE_URL}/`, priority: '1.0' },
  { loc: `${SITE_URL}/about`, priority: '0.9' },
  { loc: `${SITE_URL}/accessibility`, priority: '0.7' },
  { loc: `${SITE_URL}/terms`, priority: '0.8' },
  { loc: `${SITE_URL}/privacy`, priority: '0.8' },
];

const escapeXml = (str) =>
  String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function fetchPosts() {
  try {
    const res = await fetch(`${API_URL}/api/sitemap-posts`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    // ✅ En cas d'échec (API down pendant le build, etc.), on ne casse pas le build :
    // on génère un sitemap avec juste les pages statiques.
    console.warn('[sitemap] Impossible de récupérer les posts, sitemap statique généré. Raison :', err.message);
    return [];
  }
}

function buildXml(posts) {
  const staticEntries = STATIC_PAGES.map(
    (p) => `  <url>\n    <loc>${escapeXml(p.loc)}</loc>\n    <priority>${p.priority}</priority>\n  </url>`
  );

  const postEntries = posts.map((p) => {
    const lastmod = (p.updated_at || '').slice(0, 10);
    return `  <url>\n    <loc>${SITE_URL}/post/${p.id}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <priority>0.6</priority>\n  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n${[...staticEntries, ...postEntries].join('\n\n')}\n\n</urlset>\n`;
}

async function main() {
  const posts = await fetchPosts();
  const xml = buildXml(posts);
  const outPath = resolve(__dirname, '../public/sitemap.xml');
  writeFileSync(outPath, xml, 'utf-8');
  console.log(`[sitemap] sitemap.xml généré : ${posts.length} post(s) + ${STATIC_PAGES.length} page(s) statique(s)`);
}

main();
