import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { PROJECTS_DIR } from './util.mjs';

/**
 * Ogni progetto è un file JSON in content/projects/<id>.json.
 * Campi modificabili a mano: hidden, featured, order, category, seoLocked, seo.*
 */
export async function loadProjects() {
  await mkdir(PROJECTS_DIR, { recursive: true });
  const files = (await readdir(PROJECTS_DIR)).filter((f) => f.endsWith('.json'));
  const out = [];
  for (const f of files) {
    try {
      out.push(JSON.parse(await readFile(path.join(PROJECTS_DIR, f), 'utf8')));
    } catch (err) {
      console.warn(`⚠ JSON non valido in ${f}: ${err.message}`);
    }
  }
  return out;
}

export async function saveProject(project) {
  await mkdir(PROJECTS_DIR, { recursive: true });
  await writeFile(path.join(PROJECTS_DIR, `${project.id}.json`), JSON.stringify(project, null, 2) + '\n');
}

export function projectFingerprint(p) {
  return JSON.stringify({ t: p.original?.title, d: p.original?.description, tags: p.original?.tags, imgs: (p.images || []).map((i) => i.src) });
}
