/**
 * Sincronizza i post dell'account Instagram di design.
 * Richiede un token dell'"Instagram API with Instagram Login" (account Professional: Creator o Business)
 * nella variabile d'ambiente INSTAGRAM_ACCESS_TOKEN. Senza token lo script esce senza errori.
 *
 * Le immagini vengono scaricate in locale perché gli URL della CDN di Instagram scadono.
 */
import { loadConfig, fetchWithRetry, log, truncate } from './lib/util.mjs';
import { loadProjects, saveProject } from './lib/store.mjs';
import { downloadImage } from './lib/media.mjs';
import { guessCategory } from './lib/categorize.mjs';

const API = 'https://graph.instagram.com/v23.0';
const FIELDS = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_type,media_url,thumbnail_url}';

const config = await loadConfig();
const opts = config.instagram;
const token = process.env.INSTAGRAM_ACCESS_TOKEN;

/** Prima riga "pulita" della caption → titolo. */
export function titleFromCaption(caption = '') {
  const firstLine = caption.split('\n').map((l) => l.trim()).find((l) => l.replace(/[#@][\p{L}\p{N}_.]+/gu, '').trim().length > 2) || '';
  const clean = firstLine
    .replace(/[#@][\p{L}\p{N}_.]+/gu, '')
    .replace(/\p{Extended_Pictographic}|️|‍/gu, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-–—:|•.]+|[\s\-–—:|•]+$/g, '')
    .trim();
  return truncate(clean || 'Progetto grafico', 70);
}

export function hashtagsOf(caption = '') {
  return [...caption.matchAll(/#([\p{L}\p{N}_]+)/gu)].map((m) => m[1].toLowerCase());
}

/**
 * 'hidden'  → non compare da nessuna parte (hashtag di esclusione)
 * 'feed'    → solo nella striscia "Dal feed", con link al post
 * 'project' → pagina progetto completa con testi SEO
 */
export function publishMode(post, o) {
  const caption = post.caption || '';
  const tags = hashtagsOf(caption);
  const norm = (t) => t.replace('#', '').toLowerCase();
  if (o.skipHashtag && tags.includes(norm(o.skipHashtag))) return 'hidden';
  if (!o.publishAsProjects) return 'feed';
  if (o.requireHashtag && !tags.includes(norm(o.requireHashtag))) return 'feed';
  // Post che annunciano un progetto già su Behance: il progetto arriva già dal feed Behance.
  if (o.skipBehanceAnnouncements && /behance\.net|be\.net\//i.test(caption)) return 'feed';
  return 'project';
}

function mediaUrls(post) {
  const pick = (m) => (m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url);
  if (post.media_type === 'CAROUSEL_ALBUM' && post.children?.data?.length) {
    return post.children.data.map(pick).filter(Boolean);
  }
  return [pick(post)].filter(Boolean);
}

async function fetchPosts(max) {
  const posts = [];
  let url = `${API}/me/media?fields=${encodeURIComponent(FIELDS)}&limit=50&access_token=${token}`;
  while (url && posts.length < max) {
    const page = await fetchWithRetry(url, { type: 'json' });
    posts.push(...(page.data || []));
    url = page.paging?.next;
  }
  return posts.slice(0, max);
}

async function main() {
  if (!opts?.enabled) return log.info('Instagram disattivato in site.config.json');
  if (!token) return log.warn('INSTAGRAM_ACCESS_TOKEN non impostato: salto Instagram (vedi README).');

  let posts;
  try {
    posts = await fetchPosts(opts.maxPosts);
  } catch (err) {
    return log.warn(`API Instagram non raggiungibile (${err.message}). Salto la sincronizzazione.`);
  }
  log.info(`Instagram: ${posts.length} post letti`);

  const existing = new Map((await loadProjects()).map((p) => [p.id, p]));
  let added = 0, updated = 0;

  for (const post of posts) {
    const id = `instagram-${post.id}`;
    const caption = post.caption || '';
    const current = existing.get(id);
    const mode = publishMode(post, opts);

    if (current) {
      // Caption modificata su IG → aggiorno l'originale (la SEO si rigenera da sola).
      if (current.original.description !== caption) {
        current.original = { ...current.original, title: titleFromCaption(caption), description: caption, tags: hashtagsOf(caption) };
        updated++;
      }
      if (mode === 'hidden') current.hidden = true;
      current.feedOnly = mode === 'feed';
      await saveProject(current);
      continue;
    }

    const images = [];
    for (const [i, url] of mediaUrls(post).slice(0, opts.maxImagesPerPost).entries()) {
      try {
        images.push(await downloadImage(url, id, String(i + 1).padStart(2, '0')));
      } catch (err) {
        log.warn(`Immagine IG saltata: ${err.message}`);
      }
    }
    if (!images.length) continue;

    await saveProject({
      id,
      source: 'instagram',
      sourceUrl: post.permalink,
      publishedAt: post.timestamp,
      original: { title: titleFromCaption(caption), description: caption, tags: hashtagsOf(caption) },
      category: guessCategory(caption),
      featured: false,
      hidden: mode === 'hidden',
      feedOnly: mode === 'feed',
      images,
    });
    added++;
    log.ok(`Nuovo post Instagram: ${titleFromCaption(caption)}`);
  }
  log.ok(`Instagram: ${added} nuovi, ${updated} aggiornati`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
