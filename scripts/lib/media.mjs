import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { MEDIA_DIR, fetchWithRetry } from './util.mjs';

const MAX_WIDTH = 2000;

/** Scarica un'immagine remota e la salva come WebP ottimizzato in content/media/<folder>/<name>.webp */
export async function downloadImage(url, folder, name) {
  const buf = await fetchWithRetry(url, { type: 'buffer' });
  return saveImageBuffer(buf, folder, name);
}

export async function saveImageBuffer(buf, folder, name) {
  const dir = path.join(MEDIA_DIR, folder);
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${name}.webp`);
  const info = await sharp(buf, { failOn: 'none' })
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: 84, effort: 5 })
    .toFile(file);
  return { src: `${folder}/${name}.webp`, width: info.width, height: info.height, alt: '' };
}
