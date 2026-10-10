/** Categoria di ripiego quando l'AI non è disponibile. */
const RULES = [
  ['web', /\b(web|sito|website|ui|ux|landing|app|interfaccia|dashboard)\b/i],
  ['social', /\b(banner|ads?|adv|display|social|post|stories|storia|campagna|demand gen|promo)\b/i],
  ['illustration', /\b(poster|illustra\w*|cover|copertina|lettering|tipografi\w*|typography|artwork|manifesto)\b/i],
  ['logo', /\b(logo|logotipo|marchio|monogramma|logofolio|pittogramma)\b/i],
  ['branding', /\b(brand\w*|identit\w*|packaging|etichett\w*|label|immagine coordinata)\b/i],
];

export function guessCategory(text = '', fallback = 'branding') {
  for (const [id, re] of RULES) if (re.test(text)) return id;
  return fallback;
}
