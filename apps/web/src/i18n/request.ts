import {getRequestConfig} from 'next-intl/server';
import {cookies} from 'next/headers';
import {normalizeUiLocale, type SupportedUiLocale} from './locales';

const messageLoaders: Record<
  SupportedUiLocale,
  () => Promise<{default: Record<string, unknown>}>
> = {
  vi: () => import('../../messages/vi.json'),
  de: () => import('../../messages/de.json'),
};

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = normalizeUiLocale(cookieStore.get('NEXT_LOCALE')?.value);
  const messages = (await messageLoaders[locale]()).default;

  return {
    locale,
    messages,
  };
});
