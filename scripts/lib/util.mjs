import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CONTENT_DIR = path.join(ROOT, 'content');
export const PROJECTS_DIR = path.join(CONTENT_DIR, 'projects');
export const MEDIA_DIR = path.join(CONTENT_DIR, 'media');

export async function loadConfig() {
  return JSON.parse(await readFile(path.join(ROOT, 'site.config.json'), 'utf8'));
}

export const log = {
  info: (...a) => console.log('•', ...a),
  ok: (...a) => console.log('✔', ...a),
  warn: (...a) => console.warn('⚠', ...a),
};

export function slugify(input = '') {
  return String(input)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
    .replace(/-+$/g, '') || 'progetto';
}

export function hash(value) {
  return createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex').slice(0, 16);
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };
export function decodeEntities(s = '') {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z0-9#]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

export function stripHtml(html = '') {
  return decodeEntities(String(html).replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, ' '))
    .replace(/[ \t]+/g, ' ')
    .replace(/ +([.,;:!?])/g, '$1')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim();
}

/** Tronca su confine di parola, senza spezzare a metà. */
export function truncate(text = '', max = 160) {
  const s = String(text).replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), max * 0.6)).replace(/[\s,.;:–-]+$/, '') + '…';
}

const UA = 'Mozilla/5.0 (compatible; MDG-Portfolio-Sync/1.0; +https://github.com/delgallomatteo01-code/Sito-portfolio)';

export async function fetchWithRetry(url, { retries = 3, type = 'text', headers = {} } = {}) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'it-IT,it;q=0.9,en;q=0.8', ...headers } });
      if (!res.ok) throw new Error(`HTTP ${res.status} su ${url.replace(/access_token=[^&]+/, 'access_token=***')}`);
      if (type === 'json') return await res.json();
      if (type === 'buffer') return Buffer.from(await res.arrayBuffer());
      return await res.text();
    } catch (err) {
      lastErr = err;
      if (i < retries) await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
    }
  }
  throw lastErr;
}

export function escapeHtml(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
