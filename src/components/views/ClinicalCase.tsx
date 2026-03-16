import { useEffect, useState } from 'react';
import { loadClinicalCaseContent } from '../../data/clinicalCase';
import type { PageContent } from '../../types/content';
import { ClinicalCaseContentView } from '../content/ClinicalCaseContentView';
import { PageSkeleton } from '../ui/LoadingSkeleton';

export function ClinicalCase() {
  const [content, setContent] = useState<PageContent | null>(null);

  useEffect(() => {
    loadClinicalCaseContent().then(setContent);
  }, []);

  if (!content) {
    return <PageSkeleton />;
  }

  return <ClinicalCaseContentView content={content} />;
}
