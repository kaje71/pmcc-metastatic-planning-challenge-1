import clinicalCaseData from '../../text/3_clinical_case.json' with { type: 'json' };
import type { PageContent } from '../types/content';

let cachedClinicalCase: PageContent | null = null;

export async function loadClinicalCaseContent(): Promise<PageContent> {
  if (cachedClinicalCase) return cachedClinicalCase;

  try {
    const response = await fetch('/text/3_clinical_case.json', { cache: 'no-store' });
    if (response.ok) {
      const data = (await response.json()) as PageContent;
      cachedClinicalCase = data;
      return cachedClinicalCase;
    }
  } catch (err) {
    console.warn('Falling back to bundled 3_clinical_case.json:', err);
  }

  cachedClinicalCase = clinicalCaseData as unknown as PageContent;
  return cachedClinicalCase;
}
