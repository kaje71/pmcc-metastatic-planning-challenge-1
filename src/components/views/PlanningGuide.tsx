import { useEffect, useState } from 'react';
import { loadPlanningGuideContent } from '../../data/planningGuide';
import type { PageContent } from '../../types/content';
import { PageContentView } from '../content/PageContentView';

export function PlanningGuide() {
  const [content, setContent] = useState<PageContent | null>(null);

  useEffect(() => {
    loadPlanningGuideContent().then(setContent);
  }, []);

  if (!content) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">
        <div className="animate-pulse">Loading planning guide...</div>
      </div>
    );
  }

  return <PageContentView content={content} />;
}
