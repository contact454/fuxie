'use client';

import { useTranslations, useLocale } from 'next-intl';

export function LanguageSwitcher() {
  const t = useTranslations('Navigation');
  const locale = useLocale();

  const handleLanguageChange = (newLocale: string) => {
    // Set the cookie that our Next-Intl request.ts reads
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.reload();
  };

  return (
    <div className="flex gap-2">
      <span className="text-sm self-center">UI:</span>
      <select 
        value={locale} 
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="bg-zinc-800 text-white rounded p-1 text-sm border border-zinc-700"
      >
        <option value="vi">Tiếng Việt</option>
        <option value="en">English</option>
        <option value="de">Deutsch</option>
      </select>
    </div>
  );
}
