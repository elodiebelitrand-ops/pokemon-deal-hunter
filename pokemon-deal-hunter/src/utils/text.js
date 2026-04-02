export function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(pokemon|carte|cards?|card|lot|rare|ultra|holo|holographique|vintage|etat|édition|edition)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(value) {
  return normalizeText(value).split(' ').filter(Boolean);
}

export function overlapScore(a, b) {
  const as = new Set(tokenize(a));
  const bs = new Set(tokenize(b));
  if (as.size === 0 || bs.size === 0) return 0;
  let common = 0;
  for (const t of as) {
    if (bs.has(t)) common += 1;
  }
  return common / Math.max(as.size, bs.size);
}

export function extractPotentialCardName(title) {
  const cleaned = normalizeText(title);
  if (!cleaned) return '';
  return cleaned
    .replace(/\b(1st|ed1|shadowless|base|set|wizard|wotc|jungle|fossil|neo|genesis|rocket|fr|en|jp|japon|holo|reverse|psa\d*)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
