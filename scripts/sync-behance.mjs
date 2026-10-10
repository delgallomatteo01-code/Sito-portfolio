/**
 * Sincronizza i progetti pubblicati su Behance.
 * Fonte: feed RSS pubblico https://www.behance.net/feeds/user?username=<username>
 * Per ogni progetto nuovo prova a leggere anche la pagina del progetto per descrizione e immagini.
 * Non richiede chiavi API. In caso di errore di rete esce senza bloccare la pubblicazione.
 */
import { XMLParser } from 'fast-xml-parser';
import { loadConfig, fetchWithRetry, stripHtml, decodeEntities, log } from './lib/util.mjs';
import { loadProjects, saveProject } from './lib/store.mjs';
import { downloadImage } from './lib/media.mjs';
import { guessCategory } from './lib/categorize.mjs';

const config = await loadConfig();
const opts = config.behance;

if (!opts?.enabled) {
  log.info('Behance disattivato in site.config.json');
  process.exit(0);
}

const FEED = `https://www.behance.net/feeds/user?username=${encodeURIComponent(opts.username)}`;

export function parseFeed(xml) {
  const parser = new XMLParser({ ignoreAttributes: false, cdataPropName: false });
  const data = parser.parse(xml);
  const items = [].concat(data?.rss?.channel?.item ?? []);
  return items.map((it) => {
    const link = String(it.link ?? it.guid?.['#text'] ?? it.guid ?? '');
    const id = link.match(/gallery\/(\d+)/)?.[1];
    const descHtml = String(it.description ?? '');
    const cover = descHtml.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
    return {
      id,
      link,
      title: decodeEntities(String(it.title ?? '')).trim(),
      description: stripHtml(descHtml),
      cover: cover ? decodeEntities(cover) : null,
      publishedAt: it.pubDate ? new Date(it.pubDate).toISOString() : new Date().toISOString(),
    };
  }).filter((i) => i.id);
}

/** Prova a ricavare descrizione, tag e immagini dalla pagina pubblica del progetto. */
export function parseProjectPage(html) {
  const meta = (prop) =>
    html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*)["']`, 'i'))?.[1] ??
    html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${prop}["']`, 'i'))?.[1];

  const description = decodeEntities(meta('og:description') || meta('description') || '').trim();
  const keywords = decodeEntities(meta('keywords') || '').split(',').map((s) => s.trim()).filter(Boolean);

  // Moduli immagine del progetto (CDN Behance). Teniamo una sola versione per file, alla risoluzione più alta.
  const re = /https:\\?\/\\?\/mir-s3-cdn-cf\.behance\.net\\?\/project_modules\\?\/([a-z0-9_]+)\\?\/([a-z0-9_.-]+\.(?:jpe?g|png|gif|webp))/gi;
  const rank = (size) => (size === 'source' ? 0 : size === 'fs' ? 5000 : parseInt(size.replace(/\D/g, ''), 10) || 1);
  const byFile = new Map();
  for (const m of html.matchAll(re)) {
    const [, size, file] = m;
    const url = `https://mir-s3-cdn-cf.behance.net/project_modules/${size}/${file}`;
    const prev = byFile.get(file);
    if (!prev || rank(size) > rank(prev.size)) byFile.set(file, { size, url, order: prev?.order ?? byFile.size });
  }
  const images = [...byFile.values()].filter((i) => i.size !== 'disp' && rank(i.size) >= 600).sort((a, b) => a.order - b.order).map((i) => i.url);
  return { description, keywords, images };
}

async function main() {
  let xml;
  try {
    xml = await fetchWithRetry(FEED);
  } catch (err) {
    log.warn(`Feed Behance non raggiungibile (${err.message}). Salto la sincronizzazione.`);
    return;
  }

  const items = parseFeed(xml);
  log.info(`Behance: ${items.length} progetti nel feed`);
  const existing = new Map((await loadProjects()).map((p) => [p.id, p]));
  let added = 0, updated = 0;

  for (const item of items) {
    const id = `behance-${item.id}`;
    const current = existing.get(id);

    if (current) {
      // Aggiorna solo i testi originali: la SEO verrà rigenerata se cambiano.
      if (current.original.title !== item.title || (item.description && current.original.description !== item.description && !current.original.fromPage)) {
        current.original.title = item.title;
        if (item.description) current.original.description = item.description;
        await saveProject(current);
        updated++;
      }
      continue;
    }

    let page = { description: '', keywords: [], images: [] };
    try {
      page = parseProjectPage(await fetchWithRetry(item.link, { retries: 1 }));
    } catch (err) {
      log.warn(`Pagina progetto non leggibile (${item.title}): ${err.message}`);
    }

    const urls = page.images.length ? page.images : [item.cover?.replace(/\/projects\/\d+\//, '/projects/max_808/')].filter(Boolean);
    const images = [];
    for (const [i, url] of urls.slice(0, opts.maxImagesPerProject).entries()) {
      try {
        images.push(await downloadImage(url, id, String(i + 1).padStart(2, '0')));
      } catch (err) {
        log.warn(`Immagine saltata (${url}): ${err.message}`);
      }
    }
    if (!images.length) {
      log.warn(`Nessuna immagine per "${item.title}", progetto saltato (riproverò al prossimo giro).`);
      continue;
    }

    const description = [item.description, page.description].filter(Boolean).sort((a, b) => b.length - a.length)[0] || '';
    const project = {
      id,
      source: 'behance',
      sourceUrl: item.link,
      publishedAt: item.publishedAt,
      original: { title: item.title, description, tags: page.keywords.slice(0, 15), fromPage: Boolean(page.description) },
      category: guessCategory(`${item.title} ${description} ${page.keywords.join(' ')}`),
      featured: false,
      hidden: false,
      images,
    };
    await saveProject(project);
    added++;
    log.ok(`Nuovo progetto Behance: ${item.title} (${images.length} immagini)`);
  }

  log.ok(`Behance: ${added} nuovi, ${updated} aggiornati`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
