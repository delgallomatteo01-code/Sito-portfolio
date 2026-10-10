/**
 * Genera il sito statico in dist/:
 *  - home, una pagina per progetto, privacy, 404
 *  - immagini responsive WebP + immagine social (Open Graph) per ogni progetto
 *  - sitemap.xml, robots.txt, dati strutturati JSON-LD
 *
 * SITE_URL (env) sovrascrive site.url, utile per un dominio personalizzato o per il dev locale.
 */
import { mkdir, rm, writeFile, readFile, cp, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ROOT, MEDIA_DIR, loadConfig, log, hash } from './lib/util.mjs';
import { loadProjects } from './lib/store.mjs';
import { layout } from './templates/layout.mjs';
import { homePage } from './templates/home.mjs';
import { projectPage, privacyPage, notFoundPage } from './templates/project.mjs';

const DIST = path.join(ROOT, 'dist');
const WIDTHS = [480, 960, 1600];

const config = await loadConfig();
const siteUrl = (process.env.SITE_URL || config.site.url).replace(/\/$/, '');
const base = new URL(siteUrl + '/').pathname;
const year = new Date().getFullYear();

// ---------- dati ----------
const all = await loadProjects();
const visible = all.filter((p) => !p.hidden && p.images?.length);
const sortProjects = (a, b) =>
  (a.order ?? 999) - (b.order ?? 999) ||
  Number(b.featured) - Number(a.featured) ||
  new Date(b.publishedAt) - new Date(a.publishedAt);
const projects = visible.filter((p) => !p.feedOnly && p.slug && p.seo).sort(sortProjects);
const feed = visible
  .filter((p) => p.source === 'instagram')
  .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
  .slice(0, config.instagram.feedSize);

// ---------- pulizia (le immagini già generate restano in cache) ----------
await mkdir(DIST, { recursive: true });
for (const entry of await readdir(DIST)) if (entry !== 'media') await rm(path.join(DIST, entry), { recursive: true, force: true });

// ---------- asset statici con hash per la cache ----------
async function hashedAsset(src, name, ext) {
  const content = await readFile(path.join(ROOT, src));
  const file = `${name}.${hash(content.toString())}.${ext}`;
  await mkdir(path.join(DIST, 'assets'), { recursive: true });
  await writeFile(path.join(DIST, 'assets', file), content);
  return file;
}
await cp(path.join(ROOT, 'src/assets'), path.join(DIST, 'assets'), { recursive: true, filter: (f) => !f.endsWith('logo-paths.json') });
const assets = { css: await hashedAsset('src/css/main.css', 'main', 'css'), js: await hashedAsset('src/js/main.js', 'main', 'js') };

// ---------- immagini responsive ----------
const variants = new Map();
const jobs = [];
const needed = new Set([...projects, ...feed].flatMap((p) => p.images.map((i) => i.src)));
for (const src of needed) {
  const input = path.join(MEDIA_DIR, src);
  if (!existsSync(input)) { log.warn(`Immagine mancante: ${src}`); continue; }
  const meta = await sharp(input).metadata();
  const list = [];
  const widths = WIDTHS.filter((w) => w < meta.width).concat(Math.min(meta.width, 2000));
  for (const w of [...new Set(widths)]) {
    const rel = `media/${src.replace(/\.webp$/, '')}-${w}.webp`;
    list.push({ width: w, path: rel });
    const out = path.join(DIST, rel);
    if (!existsSync(out) || (await stat(out)).mtimeMs < (await stat(input)).mtimeMs) {
      jobs.push(async () => {
        await mkdir(path.dirname(out), { recursive: true });
        await sharp(input).resize({ width: w }).webp({ quality: 80, effort: 4 }).toFile(out);
      });
    }
  }
  variants.set(src, list);
}
// Immagine Open Graph 1200×630 (JPEG: massima compatibilità con social e chat)
for (const p of projects) {
  const out = path.join(DIST, 'media/og', `${p.id}.jpg`);
  const input = path.join(MEDIA_DIR, p.images[0].src);
  if (!existsSync(out) || (await stat(out)).mtimeMs < (await stat(input)).mtimeMs) {
    jobs.push(async () => {
      await mkdir(path.dirname(out), { recursive: true });
      await sharp(input).resize(1200, 630, { fit: 'cover', position: 'attention' }).jpeg({ quality: 82, mozjpeg: true }).toFile(out);
    });
  }
}
const CONCURRENCY = 4;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => { while (jobs.length) await jobs.shift()(); }));

// ---------- dati strutturati ----------
const person = {
  '@type': 'Person',
  '@id': `${siteUrl}/#person`,
  name: config.site.name,
  jobTitle: config.site.role,
  url: `${siteUrl}/`,
  image: `${siteUrl}/assets/portrait.webp`,
  email: `mailto:${config.contact.email}`,
  address: { '@type': 'PostalAddress', addressRegion: config.site.region, addressCountry: config.site.country },
  sameAs: Object.values(config.social).filter(Boolean),
  knowsAbout: ['Graphic design', 'Brand identity', 'Logo design', 'Web design', 'Social media design', 'Poster design'],
  hasCredential: ['Web Design', 'Photoshop', 'Dreamweaver'].map((n) => ({ '@type': 'EducationalOccupationalCredential', name: `Adobe Certified Professional – ${n}`, credentialCategory: 'certification' })),
};

const ctx = { config, base, siteUrl, assets, variants, projects, feed, categories: config.categories, year };

async function writePage(rel, html) {
  const file = path.join(DIST, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, html);
}

// ---------- home ----------
await writePage('index.html', layout(ctx, {
  title: `${config.site.name} – ${config.site.role} in ${config.site.region}`,
  ogTitle: `${config.site.name} – ${config.site.role}`,
  description: config.site.description,
  path: '/',
  bodyClass: 'is-home',
  jsonLd: [
    { '@context': 'https://schema.org', ...person },
    { '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${siteUrl}/#website`, url: `${siteUrl}/`, name: config.site.name, inLanguage: config.site.lang, author: { '@id': `${siteUrl}/#person` } },
    {
      '@context': 'https://schema.org', '@type': 'ItemList', name: 'Lavori selezionati',
      itemListElement: projects.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${siteUrl}/progetti/${p.slug}/`, name: p.seo.title })),
    },
  ],
  body: homePage(ctx),
}));

// ---------- progetti ----------
for (const [i, p] of projects.entries()) {
  const next = projects[(i + 1) % projects.length];
  const url = `${siteUrl}/progetti/${p.slug}/`;
  await writePage(`progetti/${p.slug}/index.html`, layout(ctx, {
    title: p.seo.seoTitle.includes(config.site.name) ? p.seo.seoTitle : `${p.seo.seoTitle} – ${config.site.name}`,
    ogTitle: p.seo.title,
    description: p.seo.metaDescription,
    path: `/progetti/${p.slug}/`,
    image: `media/og/${p.id}.jpg`,
    imageAlt: p.images[0].alt,
    type: 'article',
    bodyClass: 'is-project',
    jsonLd: [
      {
        '@context': 'https://schema.org', '@type': 'CreativeWork', '@id': `${url}#work`,
        name: p.seo.title, headline: p.seo.title, description: p.seo.metaDescription, url,
        image: p.images.map((img) => `${siteUrl}/${variants.get(img.src)?.at(-1)?.path ?? 'media/' + img.src}`),
        dateCreated: p.publishedAt, inLanguage: config.site.lang,
        keywords: (p.seo.keywords || []).join(', '),
        genre: config.categories.find((c) => c.id === p.category)?.label,
        creator: person, author: { '@id': `${siteUrl}/#person` },
        ...(p.sourceUrl ? { sameAs: p.sourceUrl } : {}),
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'Lavori', item: `${siteUrl}/#lavori` },
          { '@type': 'ListItem', position: 3, name: p.seo.title, item: url },
        ],
      },
    ],
    body: projectPage(ctx, p, next),
  }));
}

// ---------- pagine di servizio ----------
await writePage('privacy/index.html', layout(ctx, { title: `Privacy – ${config.site.name}`, description: `Informativa privacy del sito di ${config.site.name}.`, path: '/privacy/', bodyClass: 'is-page', body: privacyPage(ctx) }));
await writePage('404.html', layout(ctx, { title: `Pagina non trovata – ${config.site.name}`, description: 'Pagina non trovata.', path: '/404.html', bodyClass: 'is-page', noindex: true, body: notFoundPage(ctx) }));

const lastmod = (d) => new Date(d || Date.now()).toISOString().slice(0, 10);
const newest = projects.reduce((m, p) => (p.seo.generatedAt > m ? p.seo.generatedAt : m), '');
await writePage('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
<url><loc>${siteUrl}/</loc><lastmod>${lastmod(newest)}</lastmod><priority>1.0</priority></url>
${projects.map((p) => `<url><loc>${siteUrl}/progetti/${p.slug}/</loc><lastmod>${lastmod(p.seo.generatedAt)}</lastmod><priority>0.8</priority>${p.images.map((img) => `<image:image><image:loc>${siteUrl}/${variants.get(img.src)?.at(-1)?.path ?? ''}</image:loc></image:image>`).join('')}</url>`).join('\n')}
<url><loc>${siteUrl}/privacy/</loc><priority>0.2</priority></url>
</urlset>
`);
await writePage('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
await writePage('.nojekyll', '');

log.ok(`Sito generato in dist/ → ${projects.length} progetti, ${feed.length} post nel feed (base: ${base})`);
