import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

/**
 * Page-level metadata:
 * - Returns ONLY page title/description.
 * - DO NOT append site name here; the layout's title.template handles that.
 * - Falls back to DefaultMeta.description if page description is missing.
 * - If page title missing -> omit it, so layout default (site name) is used.
 */
export async function createPageMetadata(locale: string, namespace: string): Promise<Metadata> {
  const td = await getTranslations({ locale, namespace: 'defaultMeta' });
  const defaultDescription = td('description');

  const t = await getTranslations({ locale, namespace });
  let title: string | undefined;
  let description: string;

  try { title = t('meta.title'); } catch { title = undefined; }
  try { description = t('meta.description'); } catch { description = defaultDescription; }

  // לא מצמידים כאן את שם האתר—ה-layout עושה זאת אוטומטית עם title.template
  return { title, description };
}
