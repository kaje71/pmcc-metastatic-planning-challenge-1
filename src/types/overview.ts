export interface OverviewCitation {
  id: number;
  title: string;
  year: string;
}

export interface OverviewReference {
  id: number;
  text: string;
}

export interface EvidenceTile {
  id: string;
  label: string;
  value: string;
  unit?: string;
  definition: string;
  citationIds: number[];
}

export interface DisclosureBlock {
  title: string;
  summary: string;
  items: string[];
}

export interface SpectrumRow {
  regimen: string;
  fractions: number;
  totalDose: string;
  bed10: string;
  eqd2: string;
}

export interface OARConstraintRow {
  organ: string;
  metric: string;
  constraint: string;
}

export interface OverviewContent {
  schemaVersion: string;
  hero: {
    title: string;
    lede: string;
    details: string;
    subtext: string;
  };
  quickStart: {
    title: string;
    summary: string;
    steps: string[];
    primaryCta: { label: string; targetTab: string };
    secondaryCta: { label: string; targetTab: string };
    tertiaryCta: { label: string; targetTab: string };
  };
  criticalSafety: {
    title: string;
    items: string[];
    citationIds: number[];
  };
  evidenceSnapshot: {
    title: string;
    subtitle: string;
    keyTileIds: string[];
    tiles: EvidenceTile[];
  };
  disclosure: {
    studyAtGlance: DisclosureBlock;
    endpointDefinitions: DisclosureBlock;
    subgroupSensitivity: DisclosureBlock;
  };
  spectrumTable: {
    title: string;
    columns: string[];
    highlightRegimen: string;
    rows: SpectrumRow[];
    footnote: string;
    citationIds: number[];
  };
  whyNow: {
    title: string;
    items: string[];
  };
  techniqueMatters: {
    title: string;
    evidenceLabel: string;
    planningRationaleLabel: string;
    evidence: string[];
    planningRationale: string[];
  };
  trainingGoals: {
    title: string;
    items: string[];
  };
  oarConstraints: {
    title: string;
    critical: OARConstraintRow[];
    scored: OARConstraintRow[];
    notes: string[];
    citationIds: number[];
  };
  limitations: {
    title: string;
    items: string[];
  };
  nextSteps: {
    title: string;
    summary: string;
    items: string[];
  };
  sourceDocumentsLabel: string;
  sourceDocuments: { label: string; path: string }[];
  references: OverviewReference[];
  citations: OverviewCitation[];
  rubricChangelog: {
    versionLabel: string;
    entries: string[];
  };
}
