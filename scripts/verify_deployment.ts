import { readFileSync } from 'fs';
import { join } from 'path';
import dicomParser from 'dicom-parser';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function logPass(msg: string) { console.log(`${GREEN}PASS:${RESET} ${msg}`); }
function logFail(msg: string) { console.log(`${RED}FAIL:${RESET} ${msg}`); }
function logInfo(msg: string) { console.log(`${YELLOW}INFO:${RESET} ${msg}`); }

const ROOT_DIR = process.cwd();
const CALC_PATH = join(ROOT_DIR, 'text/5_calculator.json');
const GOLDEN_PATH = join(ROOT_DIR, 'text/golden_case.json');
const RTSTRUCT_PATH = join(ROOT_DIR, 'public/dicom/structures/structure_set.dcm');

// --- 1. Load Rubric ---
console.log('--- 1. Loading Rubric ---');
let calcJson: any;
try {
    calcJson = JSON.parse(readFileSync(CALC_PATH, 'utf-8'));
    logPass('5_calculator.json parsed');
} catch (e) {
    logFail(`Could not parse 5_calculator.json: ${e}`);
    process.exit(1);
}

const metrics = calcJson.metrics;
const totalWeight = metrics.reduce((sum: number, m: any) => sum + m.weight, 0);

if (totalWeight === 150) {
    logPass('Total weight is 150');
} else {
    logFail(`Total weight is ${totalWeight}, expected 150`);
}

// --- 2. Rubric Dump (CSV) ---
console.log('\n--- 2. Rubric Dump (CSV Format) ---');
console.log('id,structure,statistic,unit,weight,category,hard_gate,bins');
metrics.forEach((m: any) => {
    const bins = m.bins.map((b: any) => {
        let s = b.label;
        if (b.lt !== undefined) s += `(<${b.lt})`;
        if (b.lte !== undefined) s += `(<=${b.lte})`;
        if (b.gt !== undefined) s += `(>${b.gt})`;
        if (b.gte !== undefined) s += `(>=${b.gte})`;
        return s;
    }).join('|');
    console.log(`${m.id},${m.structure},${m.statistic},${m.unit},${m.weight},"${m.category}",${m.hard_gate},"${bins}"`);
});

// --- 3. Dataset Structure Verification (RTSTRUCT) ---
console.log('\n--- 3. Dataset Structure Verification (RTSTRUCT) ---');

function normalizeName(name: string): string {
    return name.toLowerCase().replace(/[_\-\s]/g, '');
}

function loadRtStructRoiNames(path: string): string[] {
    const data = readFileSync(path);
    const byteArray = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    const dataSet = dicomParser.parseDicom(byteArray);
    const seq = dataSet.elements.x30060020; // StructureSetROISequence
    if (!seq || !seq.items) {
        return [];
    }
    return seq.items
        .map((item: any) => item?.dataSet?.string('x30060026'))
        .filter(Boolean);
}

let roiNames: string[] = [];
try {
    roiNames = loadRtStructRoiNames(RTSTRUCT_PATH);
    if (roiNames.length === 0) {
        logFail('RTSTRUCT parsed but no ROI names found');
    } else {
        logPass(`Loaded ${roiNames.length} ROI names from RTSTRUCT`);
    }
} catch (e) {
    logFail(`Failed to parse RTSTRUCT: ${e}`);
}

const normalizedRoiNames = new Set(roiNames.map(normalizeName));

const aliasMap: Record<string, string[]> = {
    PTV_4000: ['PTV', 'PTV_COMPOSITE'],
    BRACHIAL_PLEXUS: ['BrachialPlex_R', 'BrachialPlex_L', 'BrachialPlex'],
    ESOPHAGUS: ['Esophagus'],
    Heart: ['Pericardium'],
    LUNGS_GTV: ['Lungs-GTV', 'LUNGS_MINUS_GTV'],
    GLOBAL: ['Patient', 'External', 'Body'],
};

const missingStructures: string[] = [];
metrics.forEach((m: any) => {
    if (m.structure === 'GLOBAL') return; // Virtual structure

    const candidates = [m.structure, ...(aliasMap[m.structure] || [])];
    const found = candidates.some((name) => normalizedRoiNames.has(normalizeName(name)));

    if (!found) {
        missingStructures.push(m.structure);
    }
});

if (missingStructures.length > 0) {
    logFail(`Missing structures in RTSTRUCT (after aliases): ${missingStructures.join(', ')}`);
} else {
    logPass('All metric structures map to RTSTRUCT (via aliases where needed)');
}

// --- 4. Golden Case Test ---
console.log('\n--- 4. Golden Case Test ---');
let golden: any;
try {
    golden = JSON.parse(readFileSync(GOLDEN_PATH, 'utf-8'));
    logPass('golden_case.json parsed');
} catch (e) {
    logFail(`Could not parse golden_case.json: ${e}`);
}

function matches(bin: any, value: number): boolean {
    if (bin.gte !== undefined && value < bin.gte) return false;
    if (bin.lte !== undefined && value > bin.lte) return false;
    if (bin.gt !== undefined && value <= bin.gt) return false;
    if (bin.lt !== undefined && value >= bin.lt) return false;
    return true;
}

function getBinLabel(value: number, bins: any[]): string | null {
    for (const bin of bins) {
        if (matches(bin, value)) return bin.label;
    }
    return null;
}

function calcPoints(binIndex: number, numBins: number, weight: number): number {
    if (binIndex < 0) return 0;
    if (numBins <= 1) return weight;
    return (binIndex / (numBins - 1)) * weight;
}

if (golden && golden.inputs && golden.expected) {
    const inputs = golden.inputs as Record<string, number>;
    const expected = golden.expected as { total_score: number; bins: Record<string, string> };

    let totalScore = 0;
    let binMismatch = 0;

    metrics.forEach((m: any) => {
        const value = inputs[String(m.id)];
        if (typeof value !== 'number') {
            logFail(`Golden case missing input for metric ${m.id} (${m.structure} ${m.statistic})`);
            binMismatch++;
            return;
        }
        const binLabel = getBinLabel(value, m.bins) ?? 'unacceptable';
        const binIndex = Math.max(0, m.bins.findIndex((b: any) => b.label === binLabel));
        totalScore += calcPoints(binIndex, m.bins.length, m.weight);

        const expectedLabel = expected.bins?.[String(m.id)];
        if (expectedLabel && expectedLabel !== binLabel) {
            logFail(`Golden bin mismatch for metric ${m.id}: expected ${expectedLabel}, got ${binLabel}`);
            binMismatch++;
        }
    });

    const expectedTotal = expected.total_score;
    if (Math.abs(totalScore - expectedTotal) < 0.01) {
        logPass(`Golden case total score matches: ${totalScore.toFixed(2)}`);
    } else {
        logFail(`Golden case total score ${totalScore.toFixed(2)} != expected ${expectedTotal.toFixed(2)}`);
    }

    if (binMismatch === 0) {
        logPass('Golden case bin labels match expected');
    }
}

// --- 5. Boundary / Gate Checks ---
console.log('\n--- 5. Boundary / Gate Checks ---');
const cordMetric = metrics.find((m: any) => m.structure === 'SPINALCANAL');
if (cordMetric) {
    const boundaryValue = 30.9;
    const boundaryLabel = getBinLabel(boundaryValue, cordMetric.bins);
    if (boundaryLabel === 'acceptable') {
        logPass(`Boundary check 30.9 Gy -> ${boundaryLabel}`);
    } else {
        logFail(`Boundary check 30.9 Gy -> ${boundaryLabel}, expected acceptable`);
    }

    const failValue = 31.0;
    const failLabel = getBinLabel(failValue, cordMetric.bins);
    if (failLabel === 'unacceptable') {
        logPass(`Gate fail check 31.0 Gy -> ${failLabel}`);
    } else {
        logFail(`Gate fail check 31.0 Gy -> ${failLabel}, expected unacceptable`);
    }
}

console.log('Done.');
