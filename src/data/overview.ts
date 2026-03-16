import overviewData from '../../text/1_introduction.json' with { type: 'json' };
import type { PageContent } from '../types/content';

let cachedOverview: PageContent | null = null;

export async function loadOverviewContent(): Promise<PageContent> {
  if (cachedOverview) return cachedOverview;

  try {
    const response = await fetch('/text/1_introduction.json', { cache: 'no-store' });
    if (response.ok) {
      const data = (await response.json()) as PageContent;
      cachedOverview = data;
      return cachedOverview;
    }
  } catch (err) {
    console.warn('Falling back to bundled 1_introduction.json:', err);
  }

  cachedOverview = overviewData as unknown as PageContent;
  return cachedOverview;
}
