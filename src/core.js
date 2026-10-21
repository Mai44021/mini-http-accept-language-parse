/**
 * Parses an HTTP Accept-Language header value into a sorted array of locale tags.
 *
 * DECISION: Tags are returned as-is (RFC 4647 'language-range' form, lowercase).
 * We do NOT resolve tags against a known locale catalogue. The caller is
 * responsible for matching "en-gb" against "en" if that is their policy.
 * This keeps the library dependency-free and predictable.
 *
 * DECISION: q-values are compared numerically with a small epsilon
 * (1e-9) to avoid float dust. Within the same q-value, the original
 * header order is preserved (stable sort).
 */

/**
 * Normalises a q-value: empty string => 1.0, otherwise parse as float.
 * Out-of-range or unparseable values are clamped to 0.
 */
function normaliseQ(raw) {
  if (raw === '' || raw === undefined || raw === null) {
    return 1.0;
  }
  const num = Number(raw);
  if (!Number.isFinite(num)) {
    return 0.0;
  }
  if (num < 0) return 0.0;
  if (num > 1) return 1.0;
  return num;
}

/**
 * Extracts the tag and q-value from a single comma-delimited segment.
 * Returns null for a segment that contains no usable tag.
 */
function parsePart(part) {
  const trimmed = part.trim();
  if (trimmed === '') return null;

  // Split on ';' once: left side is the tag, right side (if any) is params.
  const semi = trimmed.indexOf(';');
  let tagPart, paramPart;
  if (semi === -1) {
    tagPart = trimmed;
    paramPart = '';
  } else {
    tagPart = trimmed.slice(0, semi).trim();
    paramPart = trimmed.slice(semi + 1).trim();
  }

  if (tagPart === '' || tagPart === '*') {
    return null;
  }

  let q = 1.0;
  if (paramPart !== '') {
    // Accept-Language technically allows other params, but real-world
    // traffic only ever sends q=. We look specifically for q=.
    const qMatch = paramPart.match(/\bq\s*=\s*([^;\s]+)/i);
    if (qMatch) {
      q = normaliseQ(qMatch[1]);
    }
  }

  return { tag: tagPart.toLowerCase(), q };
}

/**
 * @param {string} header
 * @returns {string[]} Locale tags sorted by descending q-value; ties
 *   preserve header order. Tags with q=0 are excluded entirely.
 */
export function parseAcceptLanguage(header) {
  if (typeof header !== 'string' || header === '') {
  return [];
  }

  const parts = header.split(',');
  const parsed = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parsePart(parts[i]);
    if (p !== null && p.q > 0) {
      parsed.push({ ...p, order: i });
    }
  }

  // Stable sort by q descending; ties broken by original order.
  parsed.sort((a, b) => {
    if (Math.abs(a.q - b.q) < 1e-9) return a.order - b.order;
    return b.q - a.q;
  });

  return parsed.map(p => p.tag);
}
