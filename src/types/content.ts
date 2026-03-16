export interface PageSection {
    id: string;
    title: string;
    body_markdown_lines: string[];
    collapsible?: boolean;
}

export interface PageMetadata {
    id: string;
    order: number;
    nav_label: string;
    title: string;
    subtitle: string;
    audience?: string;
}

export interface CrossLink {
    page_id: string;
    label: string;
}

export interface PaperMetadata {
    type: string;
    issn: string;
    citation: string;
    doi: string;
    doi_url: string;
    title: string;
    authors: string[];
    affiliations: string[];
}

export interface PageContent {
    schema_version: string;
    page: PageMetadata;
    paper_metadata?: PaperMetadata;
    sections: PageSection[];

    crosslinks?: {
        next?: CrossLink | null;
        prev?: CrossLink | null;
    };
}
