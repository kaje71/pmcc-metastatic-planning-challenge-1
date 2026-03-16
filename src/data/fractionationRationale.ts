import rationaleData from '../../text/2_fractionation_rationale.json' with { type: 'json' };
import type { PageContent } from '../types/content';

let cachedRationale: PageContent | null = null;

export async function loadFractionationRationaleContent(): Promise<PageContent> {
  if (cachedRationale) return cachedRationale;

  try {
    const response = await fetch('/text/2_fractionation_rationale.json', { cache: 'no-store' });
    if (response.ok) {
      const data = (await response.json()) as PageContent;
      cachedRationale = data;
      return cachedRationale;
    }
  } catch (err) {
    console.warn('Falling back to bundled 2_fractionation_rationale.json:', err);
  }

  cachedRationale = rationaleData as unknown as PageContent;
  return cachedRationale;
}
