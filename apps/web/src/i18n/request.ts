import {getRequestConfig} from 'next-intl/server';
import {cookies} from 'next/headers';

export default getRequestConfig(async () => {
    // Provide a static locale, fetch it from the user's cookie
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'vi';

    return {
        locale,
        messages: (await import(`../../messages/${locale}.json`)).default
    };
});
