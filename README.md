# mini-http-accept-language-parse

Parses an HTTP `Accept-Language` header into a sorted, weight-normalized list of locale tags.

```js
import { parseAcceptLanguage } from 'mini-http-accept-language-parse';

const langs = parseAcceptLanguage('en-US;q=0.8, fr;q=0.9, de');
// => ['de', 'fr', 'en-us']
```

## Why this exists

Every HTTP server eventually needs to know what languages the client prefers. The `Accept-Language` header is simple in theory but messy in practice: quality values can be missing, out of range, or unparseable, and the wildcard `*` needs a decision. This library makes one clear set of choices so you don't have to think about them.

**Trade-off:** Tags are returned verbatim (lowercased) and are NOT matched against any known locale catalogue. If you need to map `en-gb` to `en`, that is a separate concern. This keeps the library zero-dependency and its behaviour deterministic.

## Edge cases you will hit

- **`q=0` excludes a tag entirely.** A tag with `q=0` is treated as "not acceptable" and dropped.
- **`q` values above 1 are clamped to 1.0.** Some clients send `q=1.5`.
- **Unparseable `q` values (e.g. `q=abc`) are treated as 0**, so the tag is excluded.
- **The wildcard `*` is skipped.** It does not map to any concrete locale in this library.
- **Tags are lowercased.** `EN` becomes `en`. This matches the convention that HTTP language tags are case-insensitive.

## Exports

- `parseAcceptLanguage(header: string): string[]` — Returns locale tags sorted by descending quality value. Ties preserve the original header order. Returns an empty array for empty, non-string, or whitespace-only input.
