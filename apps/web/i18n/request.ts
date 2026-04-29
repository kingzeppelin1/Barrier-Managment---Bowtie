import { getRequestConfig } from 'next-intl/server';

/**
 * next-intl request config.
 *
 * The demo is single-locale (English) for now. Norwegian (nb-NO) will land
 * in a separate PR; the message keys are deliberately scoped by feature
 * area (nav, dashboard, library, etc.) so the translation diff stays
 * focused.
 */
export default getRequestConfig(async () => {
  const locale = 'en';
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
