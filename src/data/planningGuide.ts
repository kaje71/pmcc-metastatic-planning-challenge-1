import planningGuideData from '../../text/4_planning_guide_scorecard.json' with { type: 'json' };
import type { PageContent } from '../types/content';

let cachedPlanningGuide: PageContent | null = null;

export async function loadPlanningGuideContent(): Promise<PageContent> {
  if (cachedPlanningGuide) return cachedPlanningGuide;

  try {
    const response = await fetch('/text/4_planning_guide_scorecard.json', { cache: 'no-store' });
    if (response.ok) {
      const data = (await response.json()) as PageContent;
      cachedPlanningGuide = data;
      return cachedPlanningGuide;
    }
  } catch (err) {
    console.warn('Falling back to bundled 4_planning_guide_scorecard.json:', err);
  }

  cachedPlanningGuide = planningGuideData as unknown as PageContent;
  return cachedPlanningGuide;
}
