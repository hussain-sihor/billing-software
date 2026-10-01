// Product smart-search scoring, ported verbatim from public/index.html so
// matching/ranking behaves identically. These are pure functions; the React
// ProductSearchCell handles the dropdown UI and keyboard nav.

// Normalise a string: lowercase + collapse spaces + remove common separators.
export function normStr(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[\s\-_./]+/g, ' ')
    .trim();
}

// Score a product against a query. Returns { exact, score } or null (no match).
export function scoreProduct(p, rawQuery) {
  const q = normStr(rawQuery);
  if (!q) return null;
  const tokens = q.split(' ').filter(Boolean);
  const name = normStr(p.name);
  const desc = normStr(p.description || '');
  const combined = name + ' ' + desc;

  const allInName = tokens.every((t) => name.includes(t));
  const allInCombined = tokens.every((t) => combined.includes(t));

  if (!allInCombined) return null;

  let score = 0;
  if (allInName) score += 100;
  if (name.startsWith(q)) score += 50;
  tokens.forEach((t) => {
    if (name.includes(t)) score += 10;
  });
  score -= name.length * 0.1;

  return { exact: allInName, score };
}

// Returns { exactMatches, suggestions } arrays of products for a query.
export function searchProducts(products, rawQuery) {
  const q = (rawQuery || '').trim();
  if (!q) return { exactMatches: [], suggestions: [] };
  const scored = products
    .map((p) => ({ p, res: scoreProduct(p, q) }))
    .filter((x) => x.res)
    .sort((a, b) => b.res.score - a.res.score);
  return {
    exactMatches: scored.filter((x) => x.res.exact).map((x) => x.p),
    suggestions: scored.filter((x) => !x.res.exact).map((x) => x.p)
  };
}

// Split a string into [{text, hit}] segments for highlighting matched tokens.
// Returns data the component renders as <mark> spans (no innerHTML needed).
export function highlightSegments(text, rawQuery) {
  const tokens = normStr(rawQuery).split(' ').filter(Boolean);
  if (tokens.length === 0) return [{ text, hit: false }];
  const escaped = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const splitRe = new RegExp('(' + escaped.join('|') + ')', 'gi');
  const matchRe = new RegExp('^(' + escaped.join('|') + ')$', 'i');
  return String(text)
    .split(splitRe)
    .filter((s) => s !== '')
    .map((s) => ({ text: s, hit: matchRe.test(s) }));
}
