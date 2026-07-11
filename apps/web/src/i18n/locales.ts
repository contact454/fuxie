/**
 * Trial production UI locale policy.
 * Supported: vi, de. Default/fallback: vi.
 * en.json may remain in source but English is not a selectable UI locale.
 */

export const DEFAULT_UI_LOCALE = 'vi' as const;

export const SUPPORTED_UI_LOCALES = ['vi', 'de'] as const;

export type SupportedUiLocale = (typeof SUPPORTED_UI_LOCALES)[number];

export type UiLanguageOption = {
  code: SupportedUiLocale;
  label: string;
  short: string;
};

export const UI_LANGUAGE_OPTIONS: readonly UiLanguageOption[] = [
  { code: 'vi', label: 'Tiếng Việt', short: 'VI' },
  { code: 'de', label: 'Deutsch', short: 'DE' },
] as const;

export function isSupportedUiLocale(value: unknown): value is SupportedUiLocale {
  return (
    typeof value === 'string' &&
    (SUPPORTED_UI_LOCALES as readonly string[]).includes(value)
  );
}

/**
 * Normalize arbitrary locale-like values to a supported UI locale.
 * Unsupported, missing, or malformed values fall back to vi.
 */
export function normalizeUiLocale(value: unknown): SupportedUiLocale {
  if (typeof value !== 'string') {
    return DEFAULT_UI_LOCALE;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return DEFAULT_UI_LOCALE;
  }

  // Accept bare codes only; path-like / nested values never control imports.
  if (isSupportedUiLocale(trimmed)) {
    return trimmed;
  }

  return DEFAULT_UI_LOCALE;
}
