import type { PaperMetadata } from '../../types/content';

interface PaperHeaderProps {
    metadata: PaperMetadata;
}

export function PaperHeader({ metadata }: PaperHeaderProps) {
    return (
        <div className="bg-white border border-slate-200 rounded-[--radius-card] shadow-sm p-8 mb-8">
            <div className="flex flex-col gap-4">
                {/* Meta Info Line */}
                <div className="flex flex-col md:flex-row md:items-center justify-between text-xs text-slate-500 uppercase tracking-wide gap-2">
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-700">{metadata.type}</span>
                        <span>{metadata.issn}</span>
                    </div>
                    <div className="font-mono">
                        <a href={metadata.doi_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary underline decoration-dotted">
                            {metadata.doi}
                        </a>
                    </div>
                </div>

                {/* Citation Line */}
                <div className="text-sm text-slate-600 font-medium italic border-b border-slate-100 pb-4">
                    {metadata.citation}
                </div>

                {/* Title */}
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mt-2">
                    {metadata.title}
                </h1>

                {/* Authors */}
                <div className="text-sm text-slate-800 leading-relaxed">
                    {metadata.authors.map((author, index) => (
                        <span key={index}>
                            {author}
                            {index < metadata.authors.length - 1 && ", "}
                        </span>
                    ))}
                </div>

                {/* Affiliations */}
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-1">
                    {metadata.affiliations.map((affil, index) => (
                        <div key={index} className="text-xs text-slate-500">
                            {affil}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
