import { describe, expect, it } from 'vitest';
import {
  DEFAULT_UI_LOCALE,
  SUPPORTED_UI_LOCALES,
  UI_LANGUAGE_OPTIONS,
  isSupportedUiLocale,
  normalizeUiLocale,
} from './locales';

describe('trial UI locale policy', () => {
  it('supported set is exactly vi/de', () => {
    expect([...SUPPORTED_UI_LOCALES]).toEqual(['vi', 'de']);
    expect(DEFAULT_UI_LOCALE).toBe('vi');
  });

  it('normalizes vi → vi', () => {
    expect(normalizeUiLocale('vi')).toBe('vi');
    expect(isSupportedUiLocale('vi')).toBe(true);
  });

  it('normalizes de → de', () => {
    expect(normalizeUiLocale('de')).toBe('de');
    expect(isSupportedUiLocale('de')).toBe(true);
  });

  it('normalizes en → vi', () => {
    expect(normalizeUiLocale('en')).toBe('vi');
    expect(isSupportedUiLocale('en')).toBe(false);
  });

  it('normalizes undefined, null, empty and unknown → vi', () => {
    expect(normalizeUiLocale(undefined)).toBe('vi');
    expect(normalizeUiLocale(null)).toBe('vi');
    expect(normalizeUiLocale('')).toBe('vi');
    expect(normalizeUiLocale('   ')).toBe('vi');
    expect(normalizeUiLocale('fr')).toBe('vi');
    expect(normalizeUiLocale('zh')).toBe('vi');
    expect(normalizeUiLocale(123)).toBe('vi');
    expect(normalizeUiLocale({})).toBe('vi');
  });

  it('normalizes path-like values such as ../../messages/en → vi', () => {
    expect(normalizeUiLocale('../../messages/en')).toBe('vi');
    expect(normalizeUiLocale('../../messages/vi')).toBe('vi');
    expect(normalizeUiLocale('messages/de.json')).toBe('vi');
  });

  it('language options expose exactly VI and DE', () => {
    expect(UI_LANGUAGE_OPTIONS.map((o) => o.code)).toEqual(['vi', 'de']);
    expect(UI_LANGUAGE_OPTIONS.map((o) => o.short)).toEqual(['VI', 'DE']);
    expect(UI_LANGUAGE_OPTIONS).toHaveLength(2);
  });
});
