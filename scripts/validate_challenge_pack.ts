
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

function logPass(msg: string) {
    console.log(`${GREEN}PASS:${RESET} ${msg}`);
}

function logFail(msg: string) {
    console.log(`${RED}FAIL:${RESET} ${msg}`);
    process.exitCode = 1;
}

const ROOT_DIR = process.cwd();
const ARCH_MAP_PATH = join(ROOT_DIR, 'docs/architectural_map.json');
const TEXT_DIR = join(ROOT_DIR, 'text');
const GOLDEN_PATH = join(TEXT_DIR, 'golden_case.json');

console.log('Validating Challenge Pack...');

// Load Architectural Map
let archMap: any;
try {
    archMap = JSON.parse(readFileSync(ARCH_MAP_PATH, 'utf-8'));
    logPass('architectural_map.json parsed');
} catch (e) {
    logFail(`Could not parse architectural_map.json: ${e}`);
    process.exit(1);
}

// 1. Scoring Integrity
const expectedTotal = archMap.scoring_and_history.score_total_weight_expected;
if (expectedTotal !== 150) {
    logFail(`Expected total weight to be 150, found ${expectedTotal} in arch map`);
} else {
    logPass('Arch map specifies 150 total points');
}

// Load Calculator
const calcPath = join(TEXT_DIR, '5_calculator.json');
let calcJson: any;
try {
    calcJson = JSON.parse(readFileSync(calcPath, 'utf-8'));
} catch (e) {
    logFail(`Could not parse calculator.json: ${e}`);
    process.exit(1);
}

let sum = 0;
const canonicalStructures = new Set<string>();

calcJson.metrics.forEach((m: any) => {
    sum += m.weight;
    canonicalStructures.add(m.structure);
});

if (sum === expectedTotal) {
    logPass(`Calculator metrics sum to exactly ${sum}`);
} else {
    logFail(`Calculator metrics sum to ${sum}, expected ${expectedTotal}`);
}

// 2. Naming Consistency
const INVALID_PATTERNS = [
    /_COMPOSITE/, // PTV_COMPOSITE disallowed -> PTV_4000
    /-/           // Hyphens disallowed in structures (e.g. LUNGS-GTV -> LUNGS_GTV)
];

let namingErrors = 0;
canonicalStructures.forEach(s => {
    if (s.includes('PTV_COMPOSITE')) {
        logFail(`Structure '${s}' uses disallowed PTV_COMPOSITE (use PTV_4000)`);
        namingErrors++;
    }
    if (s.includes('-')) {
        logFail(`Structure '${s}' uses hyphen (use underscore)`);
        namingErrors++;
    }
});

if (namingErrors === 0) {
    logPass('Structure naming conventions (no hyphens, no PTV_COMPOSITE) passed');
}

// 3. Planning Guide Scorecard Sync
const guidePath = join(TEXT_DIR, '4_planning_guide_scorecard.json');
let guideJson: any;
try {
    guideJson = JSON.parse(readFileSync(guidePath, 'utf-8'));
    logPass('4_planning_guide_scorecard.json parsed');
} catch {
    logFail('Could not parse 4_planning_guide_scorecard.json (did you rename it?)');
    process.exit(1);
}

// Simple check: does the scorecard table contain PTV_4000?
const scorecardTable = guideJson.sections.find((s: any) => s.id === 'fixed_scorecard')?.body_markdown_lines.join('\n');
if (scorecardTable.includes('PTV_4000') && scorecardTable.includes('LUNGS_GTV')) {
    logPass('Scorecard table appears to contain updated structure names');
} else {
    logFail('Scorecard table missing PTV_4000 or LUNGS_GTV');
}

// 4. Validate Table Content (Weights & Thresholds)
console.log('\nValidating Scorecard Table Rows...');
const lines = scorecardTable.split('\n');
const tableRows = lines.filter((l: string) => l.startsWith('|') && !l.includes('---|---') && !l.includes('Struct'));

tableRows.forEach((row: string) => {
    // | Category | Structure | Metric | Weight | ...
    const cols = row.split('|').map(c => c.trim()).filter(c => c);
    // index 0=Category, 1=Structure, 2=Metric, 3=Weight
    const structure = cols[1];
    const weight = parseInt(cols[3], 10);

    // Find metric
    // Table metric often is "Statistic (Unit)" e.g. "V40Gy (%)"
    // JSON has statistic "V40Gy" and unit "%"
    const tableMetricStr = cols[2]; // e.g. "V40Gy (%)"

    const metric = calcJson.metrics.find((m: any) => {
        if (m.structure !== structure) return false;
        // Check if table metric string starts with the json statistic
        return tableMetricStr.startsWith(m.statistic);
    });

    if (!metric) {
        logFail(`Table row uses structure '${structure}' and metric '${tableMetricStr}' which is not in calculator.json`);
    } else {
        if (metric.weight !== weight) {
            logFail(`Metric ${structure} ${metric.statistic} weight: Table=${weight}, JSON=${metric.weight}`);
        } else {
            // Optional: Validation of unit?
            // Not strictly necessary for this "polish" step, ensuring weights match is key.
        }
    }
});
logPass(`Verified ${tableRows.length} table rows match JSON weights.`);

// 5. Golden Case Fixture Check
console.log('\nValidating Golden Case Fixture...');
try {
    const golden = JSON.parse(readFileSync(GOLDEN_PATH, 'utf-8'));
    if (!golden.inputs || !golden.expected) {
        logFail('golden_case.json missing inputs or expected fields');
    } else {
        logPass('golden_case.json parsed with inputs and expected');
    }
} catch (e) {
    logFail(`Could not parse golden_case.json: ${e}`);
}

console.log('Validation complete.');
