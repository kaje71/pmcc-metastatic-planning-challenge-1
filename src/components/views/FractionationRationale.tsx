import { useEffect, useState } from 'react';
import { loadFractionationRationaleContent } from '../../data/fractionationRationale';
import type { PageContent } from '../../types/content';
import { PageContentView } from '../content/PageContentView';
import { PageSkeleton } from '../ui/LoadingSkeleton';

export function FractionationRationale() {
  const [content, setContent] = useState<PageContent | null>(null);

  useEffect(() => {
    loadFractionationRationaleContent().then(setContent);
  }, []);

  if (!content) {
    return <PageSkeleton />;
  }

  return <PageContentView content={content} />;
}
