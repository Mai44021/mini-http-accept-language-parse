import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseAcceptLanguage } from '../src/index.js';

describe('parseAcceptLanguage', () => {
  it('returns empty array for empty input', () => {
    assert.deepEqual(parseAcceptLanguage(''), []);
    assert.deepEqual(parseAcceptLanguage('   '), []);
  });

  it('returns empty array for non-string input', () => {
    assert.deepEqual(parseAcceptLanguage(null), []);
    assert.deepEqual(parseAcceptLanguage(undefined), []);
    assert.deepEqual(parseAcceptLanguage(123), []);
  });

  it('returns tag as-is when no q-value given', () => {
    assert.deepEqual(parseAcceptLanguage('en'), ['en']);
  });

  it('returns multiple tags in header order when no q-values', () => {
    assert.deepEqual(parseAcceptLanguage('en, fr, de'), ['en', 'fr', 'de']);
  });

  it('sorts by descending q-value', () => {
    assert.deepEqual(
      parseAcceptLanguage('en;q=0.8, fr;q=0.9, de;q=1.0'),
      ['de', 'fr', 'en']
    );
  });

  it('treats missing q as 1.0', () => {
    assert.deepEqual(
      parseAcceptLanguage('en, fr;q=0.9'),
      ['en', 'fr']
    );
  });

  it('excludes tags with q=0', () => {
    assert.deepEqual(
      parseAcceptLanguage('en;q=0, fr;q=1, de;q=0.5'),
      ['fr', 'de']
    );
  });

  it('lowercases tags', () => {
    assert.deepEqual(parseAcceptLanguage('EN, Fr'), ['en', 'fr']);
  });

  it('handles whitespace around parts', () => {
    assert.deepEqual(
      parseAcceptLanguage('en ; q=0.5 , fr ; q=1.0'),
      ['fr', 'en']
    );
  });

  it('handles extra whitespace in q parameter', () => {
    assert.deepEqual(
      parseAcceptLanguage('en;q = 0.1, fr;q = 1.0'),
      ['fr', 'en']
    );
  });

  it('preserves header order within same q-value', () => {
    assert.deepEqual(
      parseAcceptLanguage('en, fr, de'),
      ['en', 'fr', 'de']
    );
    assert.deepEqual(
      parseAcceptLanguage('en;q=0.5, fr;q=0.5, de;q=0.5'),
      ['en', 'fr', 'de']
    );
  });

  it('skips the wildcard "*" tag', () => {
    assert.deepEqual(
      parseAcceptLanguage('*;q=0.5, en;q=1.0'),
      ['en']
    );
  });

  it('clamps q > 1 to 1.0', () => {
    assert.deepEqual(
      parseAcceptLanguage('en;q=5, fr;q=1'),
      ['en', 'fr']
    );
  });

  it('treats unparseable q as 0, excluding the tag', () => {
    assert.deepEqual(
      parseAcceptLanguage('en;q=abc, fr;q=1'),
      ['fr']
    );
  });

  it('skips empty segments', () => {
    assert.deepEqual(
      parseAcceptLanguage('en, , fr, , de'),
      ['en', 'fr', 'de']
    );
  });

  it('handles subtags with hyphens', () => {
    assert.deepEqual(
      parseAcceptLanguage('zh-Hans;q=0.9, en-US;q=1.0'),
      ['en-us', 'zh-hans']
    );
  });

  it('handles many decimal q-values', () => {
    assert.deepEqual(
      parseAcceptLanguage('a;q=0.1, b;q=0.2, c;q=0.3, d;q=0.4, e;q=0.5'),
      ['e', 'd', 'c', 'b', 'a']
    );
  });

  it('handles extra params after q', () => {
    assert.deepEqual(
      parseAcceptLanguage('en;q=0.5;foo=bar, fr;q=1.0'),
      ['fr', 'en']
    );
  });
});
