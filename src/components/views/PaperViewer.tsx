import { FileText, Download, ExternalLink } from 'lucide-react';
import { Button } from '../ui/Button';
import { PageShell } from '../ui/PageShell';
import { PageHero } from '../ui/PageHero';
import { SectionCard } from '../ui/SectionCard';

export function PaperViewer() {
    const pdfUrl = '/papers/main.pdf';

    const heroActions = (
        <>
            {/* Full Screen Button */}
            <Button
                variant="secondary"
                onClick={() => window.open(pdfUrl, '_blank')}
                className="shadow-sm border-slate-300 hover:border-slate-400 text-slate-700 bg-white"
            >
                <ExternalLink className="w-4 h-4 mr-2 text-slate-500" />
                Full screen
            </Button>

            {/* Download Button */}
            <a
                href={pdfUrl}
                download="chow_et_al_2025.pdf"
                className="inline-block"
                aria-label="Download PDF"
            >
                <Button
                    variant="primary"
                    className="shadow-md hover:shadow-lg transition-all"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                </Button>
            </a>
        </>
    );

    return (
        <PageShell maxWidth="content">
            <div className="stack">
                {/* Page Hero - Canonical reference for the design system */}
                <PageHero
                    eyebrow="Anchor Literature"
                    eyebrowIcon={FileText}
                    title="40 Gy in 10 fractions for NSCLC"
                    subtitle="Chow et al., Radiation Oncology Journal (2025) • The clinical evidence basis for this planning challenge."
                    rightActions={heroActions}
                    variant="tinted"
                />


                {/* PDF Viewer Card */}
                <SectionCard
                    title="Document Viewer"
                    icon={FileText}
                    iconBg="bg-purple-100"
                    iconColor="text-purple-500"
                    noPadding
                >
                    {/* Embedded PDF */}
                    <div className="relative" style={{ height: '80vh' }}>
                        <iframe
                            src={pdfUrl}
                            className="w-full h-full border-0"
                            title="Research Paper PDF"
                        />

                        {/* Fallback for browsers that don't support embedded PDFs */}
                        <noscript>
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 p-8 text-center">
                                <FileText className="w-16 h-16 text-slate-300 mb-4" />
                                <p className="text-slate-600 mb-4">
                                    Your browser doesn't support embedded PDFs.
                                </p>
                                <a href={pdfUrl} download>
                                    <Button variant="primary">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download PDF
                                    </Button>
                                </a>
                            </div>
                        </noscript>
                    </div>
                </SectionCard>

                {/* Key Evidence Map */}
                <SectionCard
                    title="Key Evidence Map"
                    icon={FileText}
                    iconBg="bg-amber-100"
                    iconColor="text-amber-600"
                >
                    <p className="text-sm text-slate-600 mb-3">
                        The following tables and figures are the most relevant to scoring.
                        Use this map to navigate the PDF and supplementary documents efficiently.
                    </p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-2 pr-3 font-semibold text-slate-700">Source</th>
                                    <th className="text-left py-2 pr-3 font-semibold text-slate-700">Content</th>
                                    <th className="text-left py-2 font-semibold text-slate-700">Maps to</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {[
                                    { source: 'Table S1', content: 'OAR constraints protocol', maps: 'Spinal canal, oesophagus, lung, heart safety-gate and acceptable thresholds' },
                                    { source: 'Table S4', content: 'BED / EQD₂ comparison', maps: 'Fractionation rationale (Tab 2); BED₁₀ = 56.0 Gy claim' },
                                    { source: 'Table 1', content: 'Patient demographics', maps: 'SBRT eligibility (85.4% ineligible); tumour size/location' },
                                    { source: 'Table 2', content: 'Treatment outcomes', maps: 'Response rate (69.3%), local control (96.7%), survival' },
                                    { source: 'Table S2', content: 'Multivariable  -  local control', maps: 'Prognostic factors informing case design' },
                                    { source: 'Table S3', content: 'Multivariable  -  survival', maps: 'Overall survival context (22.4 mo median)' },
                                    { source: 'Results §3', content: 'Toxicity (CTCAE v5)', maps: 'Pneumonitis 46.7% (Grade 1–2); oesophagitis 1.6% (Grade 3)' },
                                    { source: 'Figure S1', content: 'Local control curve', maps: 'Visual evidence of 96.7% 1-yr local control' },
                                ].map(row => (
                                    <tr key={row.source}>
                                        <td className="py-2 pr-3 font-semibold text-slate-800 whitespace-nowrap">{row.source}</td>
                                        <td className="py-2 pr-3 text-slate-600">{row.content}</td>
                                        <td className="py-2 text-slate-600">{row.maps}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-3 italic">
                        The scoring matrix on Tab 5 derives its safety-gate thresholds from Supplementary Table S1.
                        Supplementary Table S4 provides the BED/EQD₂ reference for the 40 Gy / 10 fx regimen.
                    </p>
                </SectionCard>

                {/* Supplementary Documents */}
                <SectionCard
                    title="Supplementary Documents"
                    icon={FileText}
                    iconBg="bg-slate-100"
                    iconColor="text-slate-500"
                >
                    <p className="text-sm text-slate-600 mb-4">
                        The following supplementary files accompany the primary paper and inform the scoring matrix used in this challenge.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { file: 'Supplementary-Table-S1.pdf', label: 'Table S1', desc: 'OAR constraints protocol' },
                            { file: 'Supplementary-Table-S2.pdf', label: 'Table S2', desc: 'Multivariable analysis (local control)' },
                            { file: 'Supplementary-Table-S3.pdf', label: 'Table S3', desc: 'Multivariable analysis (survival)' },
                            { file: 'Supplementary-Table-S4.pdf', label: 'Table S4', desc: 'BED / EQD2 comparison table' },
                            { file: 'Supplementary-Fig-S1.pdf', label: 'Figure S1', desc: 'Local control curve (all patients)' },
                            { file: 'Supplementary-Fig-S2.pdf', label: 'Figure S2', desc: 'Local control curve (subgroups)' },
                        ].map(item => (
                            <a
                                key={item.file}
                                href={`/papers/${item.file}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-colors group"
                            >
                                <Download className="w-4 h-4 mt-0.5 text-slate-400 group-hover:text-purple-500 shrink-0" />
                                <div>
                                    <div className="text-sm font-semibold text-slate-700 group-hover:text-purple-700">{item.label}</div>
                                    <div className="text-xs text-slate-500">{item.desc}</div>
                                </div>
                            </a>
                        ))}
                    </div>
                </SectionCard>
            </div>
        </PageShell>
    );
}
