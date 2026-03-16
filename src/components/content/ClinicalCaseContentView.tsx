import { FileText, Scan, Pill, Lightbulb } from 'lucide-react';
import type { PageContent, PageSection } from '../../types/content';
import { MarkdownBlocks } from '../content/MarkdownBlocks';
import { Callout } from '../ui/Callout';
import { PageShell } from '../ui/PageShell';
import { PageHero } from '../ui/PageHero';
import { SectionCard } from '../ui/SectionCard';
import { NavigateButton } from '../ui/NavigateButton';
import type { LucideIcon } from 'lucide-react';


// Section configuration for consistent styling
const SECTION_CONFIG: Record<string, {
    icon: LucideIcon;
    tintColor: 'purple' | 'blue' | 'amber' | 'emerald' | 'slate';
    variant: 'default' | 'tinted' | 'highlighted';
}> = {
    case_summary: { icon: FileText, tintColor: 'blue', variant: 'tinted' },
    simulation_imaging: { icon: Scan, tintColor: 'slate', variant: 'tinted' },
    prescription: { icon: Pill, tintColor: 'emerald', variant: 'highlighted' },
    clinical_takeaways: { icon: Lightbulb, tintColor: 'amber', variant: 'tinted' },
};

function ClinicalTakeawaysSection({ section }: { section: PageSection }) {
    const config = SECTION_CONFIG[section.id] || { icon: FileText, tintColor: 'slate', variant: 'default' };
    const Icon = config.icon;

    // Parse the markdown lines to extract subsections (split by H3 headings)
    const lines = section.body_markdown_lines;
    const subsections: { title: string; content: string[] }[] = [];
    let currentSubsection: { title: string; content: string[] } | null = null;

    for (const line of lines) {
        const h3Match = line.match(/^###\s+(.+)$/);
        if (h3Match) {
            if (currentSubsection) {
                subsections.push(currentSubsection);
            }
            currentSubsection = { title: h3Match[1], content: [] };
        } else if (currentSubsection) {
            currentSubsection.content.push(line);
        }
    }

    if (currentSubsection) {
        subsections.push(currentSubsection);
    }

    // If no subsections found, render as a single block
    if (subsections.length === 0) {
        return (
            <SectionCard
                title={section.title}
                icon={Icon}
                variant={config.variant}
                tintColor={config.tintColor}
            >
                <MarkdownBlocks lines={section.body_markdown_lines} />
            </SectionCard>
        );
    }

    // Render subsections as grid of cards
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 px-2">
                <div className="p-2 bg-amber-100 rounded-lg">
                    <Icon className="w-5 h-5 text-amber-500" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">
                    {section.title}
                </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {subsections.map((subsection, idx) => (
                    <div
                        key={idx}
                        className="bg-white rounded-[--radius-card] border border-amber-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                    >
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-b border-amber-100 px-5 py-3">
                            <h3 className="text-sm font-bold text-slate-900">
                                {subsection.title}
                            </h3>
                        </div>
                        <div className="px-5 py-4">
                            <MarkdownBlocks lines={subsection.content} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function renderSection(section: PageSection) {
    const config = SECTION_CONFIG[section.id];

    // Special handling for clinical takeaways (grid layout)
    if (section.id === 'clinical_takeaways') {
        return <ClinicalTakeawaysSection key={section.id} section={section} />;
    }

    // Education disclaimer rendered as amber callout
    if (section.id === 'education_disclaimer') {
        return (
            <Callout key={section.id} variant="warning" title={section.title}>
                <MarkdownBlocks lines={section.body_markdown_lines} />
            </Callout>
        );
    }

    // Special handling for next_step (subtle callout)
    if (section.id === 'next_step') {
        return (
            <div key={section.id} className="bg-slate-50 rounded-[--radius-card] border border-slate-200 px-6 py-4">
                <div className="text-sm text-slate-600">
                    <MarkdownBlocks lines={section.body_markdown_lines} />
                </div>
            </div>
        );
    }

    // Default section card
    if (config) {
        return (
            <SectionCard
                key={section.id}
                title={section.title}
                icon={config.icon}
                variant={config.variant}
                tintColor={config.tintColor}
            >
                <MarkdownBlocks lines={section.body_markdown_lines} />
            </SectionCard>
        );
    }

    // Fallback for unknown sections
    return (
        <SectionCard key={section.id} title={section.title}>
            <MarkdownBlocks lines={section.body_markdown_lines} />
        </SectionCard>
    );
}

export function ClinicalCaseContentView({ content }: { content: PageContent }) {
    const { page, sections, crosslinks } = content;

    return (
        <PageShell maxWidth="wide">
            <div className="stack">
                {/* Page Hero */}
                <PageHero
                    eyebrow={page.nav_label}
                    title={page.title}
                    subtitle={page.subtitle}
                    variant="tinted"
                />

                {/* Section-specific blocks */}
                {sections.map((section) => renderSection(section))}

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
