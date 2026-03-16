import type { PageContent } from '../../types/content';
import { MarkdownBlocks } from './MarkdownBlocks';
import { Callout } from '../ui/Callout';
import { PageShell } from '../ui/PageShell';
import { PageHero } from '../ui/PageHero';
import { SectionCard } from '../ui/SectionCard';
import { WorkflowStepper } from '../ui/WorkflowStepper';

import { PaperHeader } from '../ui/PaperHeader';
import { NavigateButton } from '../ui/NavigateButton';

export function PageContentView({ content }: { content: PageContent }) {
  const { page, sections, crosslinks, paper_metadata } = content;



  return (
    <PageShell maxWidth="content">
      <div className="stack">
        {/* Page Hero */}
        {paper_metadata ? (
          <PaperHeader metadata={paper_metadata} />
        ) : (
          <PageHero
            eyebrow={page.nav_label}
            title={page.title}
            subtitle={page.subtitle}
            variant="tinted"
          >
            {/* Merge first section into hero if titles match (e.g. Welcome page) */}
            {sections.length > 0 && sections[0].title === page.title && (
              <MarkdownBlocks lines={sections[0].body_markdown_lines} />
            )}
          </PageHero>
        )}

        {/* Education disclaimer callout (amber warning) */}
        {sections
          .filter((s) => s.id === 'education_disclaimer')
          .map((section) => (
            <Callout key={section.id} variant="warning" title={section.title}>
              <MarkdownBlocks lines={section.body_markdown_lines} />
            </Callout>
          ))}

        {/* Workflow advance organiser (introduction page only) */}
        {page.id === 'introduction' && <WorkflowStepper />}

        {/* Content Sections - Each as a distinct card */}
        {sections
          .filter((section) =>
            // Exclude fixed scorecards, education disclaimers (rendered above), and the "merged" first section
            section.id !== 'fixed_scorecard' &&
            section.id !== 'education_disclaimer' &&
            !(section.title === page.title)
          )
          .map((section) => (
            <SectionCard
              key={section.id}
              title={section.title && section.title !== page.title ? section.title : undefined}
              variant="tinted"
              tintColor="purple"
              collapsible={section.collapsible}
            >
              <MarkdownBlocks lines={section.body_markdown_lines} />
            </SectionCard>
          ))}

        {/* Navigation Footer */}
        {crosslinks && (
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="flex justify-start">
              {crosslinks.prev && (
                <NavigateButton
                  label={crosslinks.prev.label}
                  targetTab={crosslinks.prev.page_id}
                  direction="prev"
                />
              )}
            </div>
            <div className="flex justify-end">
              {crosslinks.next && (
                <NavigateButton
                  label={crosslinks.next.label}
                  targetTab={crosslinks.next.page_id}
                  direction="next"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
