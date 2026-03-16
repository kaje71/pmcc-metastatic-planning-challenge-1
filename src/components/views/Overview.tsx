import { useEffect, useState } from 'react';
import { loadOverviewContent } from '../../data/overview';
import type { PageContent } from '../../types/content';
import { PageContentView } from '../content/PageContentView';
import { PageSkeleton } from '../ui/LoadingSkeleton';

export function Overview() {
  const [content, setContent] = useState<PageContent | null>(null);

  useEffect(() => {
    loadOverviewContent().then(setContent);
  }, []);

  if (!content) {
    return <PageSkeleton />;
  }

  return <PageContentView content={content} />;
}
