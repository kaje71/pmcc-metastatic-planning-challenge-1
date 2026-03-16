import { clsx } from "clsx";
import type { ScoringModel, Breakpoint } from "../../types";

interface PerformanceSpectrumProps {
    value: number | null;
    model: ScoringModel;
    units: string;
}

// units is unused but kept in props for interface consistency or future use
export function PerformanceSpectrum({ value, model }: PerformanceSpectrumProps) {
    const { breakpoints, direction } = model;

    // Sort breakpoints by value
    const sortedPoints = [...breakpoints].sort((a, b) => a.value - b.value);

    // Determine segments based on direction
    // For 'lower_is_better':
    // Unacceptable is > max_acceptable
    // Ideal is < min_ideal

    // We want to render a sequence of blocks:
    // [UNACCEPTABLE] [MARGINAL] [ACCEPTABLE] [GOOD] [IDEAL]
    // But mapped to the metric's values.

    // Simplification for the visual:
    // The screenshot shows equal-width blocks for categories, or at least blocks that span the range.
    // It's a table cell, so we can use a flex row of colored blocks.
    // We need to map the numeric ranges to these blocks.

    // Challenge: The ranges can be vastly different sizes (e.g. 0-5 vs 5-100).
    // Linear mapping might squash important regions.
    // The screenshot seems to use a "categorical" axis or a non-linear one where each bin has significant width.
    // Let's try rendering the *defined bins* as distinct visual segments, and standardizing their width
    // relative to their "importance" or just equal width to ensure readability of the text.

    // Let's identify the bins from the breakpoints.
    // Breakpoints usually define the transitions.
    // E.g. Fail @ 30, Marginal @ 25, Ideal @ 5.
    // Ranges:
    // > 30: Unacceptable
    // 25-30: Marginal
    // 5-25: Good? (Gap filling required)

    // Let's parse the breakpoints into "Zones".
    // We'll define standard zones based on the points assigned.
    // 0 pts = Unacceptable
    // >0 & <0.8 = Marginal / Acceptable
    // 1.0 = Ideal

    // We will render a flex container with the zones in order (Left -> Right = Bad -> Good or Val -> Val?)
    // Screenshot:
    // Left side: "< 95 Unacceptable" (Red)
    // Middle: "95 Marginal" (Orange)
    // ...
    // Right: "100 Ideal" (Green)

    // It seems the X-axis is value, but warped.
    // Actually, looking closely at the screenshot (Step 7):
    // It looks like discrete blocks.
    // [ < 95 Unacceptable ] [ 95 Marginal ] [ 98 Acceptable ] [ 99 Good ] [ 100 Ideal ]
    // These are just labeled blocks.

    // If we want to show the *current value*, we need to know where it falls.

    const zones = getZones(sortedPoints, direction);

    return (
        <div className="w-full h-full min-h-[48px] flex rounded-sm overflow-hidden text-xs font-bold leading-tight relative group">
            {zones.map((zone, idx) => (
                <div
                    key={idx}
                    className={clsx(
                        "flex-1 flex flex-col justify-center px-1.5 py-1 border-r border-black/10 last:border-0 transition-colors",
                        getZoneColor(zone.label)
                    )}
                >
                    <div className="opacity-90 whitespace-nowrap">{zone.valueLabel}</div>
                    <div className="uppercase opacity-75 text-[10px] tracking-wider">{zone.label}</div>
                </div>
            ))}

            {/* Value Marker Overlay */}
            {value !== null && !isNaN(value) && (
                <ValueMarker value={value} zones={zones} />
            )}
        </div>
    );
}

// --- Helpers ---

interface Zone {
    valueLabel: string; // e.g., "< 95" or "95"
    label: string;      // e.g., "UNACCEPTABLE"
    min: number;
    max: number;
    isUnbounded?: boolean;
}

function getZoneColor(label: string) {
    switch (label.toUpperCase()) {
        case 'UNACCEPTABLE': return 'bg-grading-unacceptable text-white';
        case 'FAIL': return 'bg-grading-unacceptable text-white';
        case 'MARGINAL': return 'bg-grading-marginal text-black';
        case 'ACCEPTABLE': return 'bg-grading-acceptable text-black';
        case 'GOOD': return 'bg-grading-good text-black';
        case 'IDEAL': return 'bg-grading-ideal text-white';
        case 'PASS': return 'bg-grading-good text-black';
        default: return 'bg-gray-100 text-gray-500';
    }
}

function getZones(breakpoints: Breakpoint[], direction: string): Zone[] {
    // This logic needs to reconstruct the bins from the scoring points.
    // Usually:
    // 0 pts -> Fail
    // 0.01 - 0.5 -> Marginal?
    // 0.85 -> Acceptable / Good
    // 1.0 -> Ideal

    // We'll iterate and build zones.
    // Note: The screenshot implies specific labeled bins.
    // Our 'breakpoints' have labels! We should use them.

    // Example Breakpoints (from config):
    // 90.0 (0pts, Fail)
    // 90.001 (Threshold) -> ??
    // 95.0 (0.5pts, Minimum) -> Marginal
    // 98.0 (0.85pts, Goal) -> Acceptable
    // 99.0 (1.0pts, Ideal) -> Good/Ideal

    // We simplify to 3-5 standard zones for display if possible, or just Dump all breakpoints.
    // Let's map the breakpoints directly but clean up duplicates/close values.

    const zones: Zone[] = [];

    // Filter interesting breakpoints (skip "Threshold" if it's super close to Fail)
    const significant = breakpoints.filter(bp => bp.label !== 'Threshold');

    if (significant.length === 0) {
        return [];
    }
    const mapLabel = (bp: Breakpoint) => {
        const p = bp.points;
        const l = bp.label.toUpperCase();
        if (p === 0) return 'UNACCEPTABLE';
        if (p === 1) return 'IDEAL';
        if (l.includes('GOAL') || l.includes('TARGET')) return 'GOOD';
        if (l.includes('MIN') || l.includes('CONSTRAINT')) return 'MARGINAL';
        if (l.includes('ACCEPTABLE')) return 'ACCEPTABLE';

        // Fallback by points
        if (p >= 0.8) return 'GOOD';
        if (p >= 0.5) return 'ACCEPTABLE';
        return 'MARGINAL';
    };

    // If high-is-better (PTV):
    // < 90: Fail
    // 90-95: Marginal
    // 95-98: Acceptable
    // > 98: Ideal

    // Direction handling
    if (direction === 'higher_is_better') {
        // Sort Ascending
        // FAIL is usually the lowest value
        // We construct ranges between them.

        // First Zone: < Min(Fail)
        const failBp = significant.find(b => b.points === 0);
        if (failBp) {
            zones.push({
                valueLabel: `< ${failBp.value}`,
                label: 'UNACCEPTABLE',
                min: -Infinity,
                max: failBp.value,
                isUnbounded: true
            });
        }

        // Middle Zones
        for (let i = 0; i < significant.length - 1; i++) {
            const curr = significant[i];
            const next = significant[i + 1];
            if (curr.points === 0) continue; // Handled by first zone usually, or specialized

            zones.push({
                valueLabel: `${curr.value} - ${next.value}`,
                label: mapLabel(curr),
                min: curr.value,
                max: next.value
            });
        }

        // Last Zone: Ideal
        const idealBp = significant[significant.length - 1];
        if (idealBp) {
            zones.push({
                valueLabel: `>= ${idealBp.value}`,
                label: 'IDEAL',
                min: idealBp.value,
                max: Infinity,
                isUnbounded: true
            });
        }
    } else {
        // lower_is_better (Dose)
        // Sort Descending (Highest dose is Fail) or Ascending?
        // Usually stored Ascending in config.
        // e.g. Ideal 20, Goal 30, Fail 40.

        // Let's just process in order of Value (Ascending).
        // For lower is better:
        // Ideal is Low Value. Fail is High Value.

        // Zone 1: Ideal (< Lowest Breakpoint)
        // Wait, often Ideal is the START of the curve.

        // Let's use the points logic.
        // We iterate standard segments: Ideal -> Goal -> Constraint -> Fail

        // Find distinct point levels
        const levels = significant.sort((a, b) => a.value - b.value);

        // If lower is better:
        // Value < IdealVal (if IdealVal is smallest) -> Ideal

        // We'll iterate the sorted levels.
        // Loop through levels to create segments.
        // e.g. Ideal(20), Goal(30), Fail(40)

        // Segment 1: < 20
        if (levels[0].points > 0) { // If start is good
            zones.push({
                valueLabel: `< ${levels[0].value}`,
                label: mapLabel(levels[0]),
                min: -Infinity,
                max: levels[0].value
            });
        }

        for (let i = 0; i < levels.length - 1; i++) {
            const curr = levels[i];
            const next = levels[i + 1];

            // What is the range between curr and next?
            // e.g. 20 to 30.
            // Score interpolates from curr.points to next.points.
            // We label it based on the WORSE of the two? Or the range?
            // "20 - 30: Good"

            zones.push({
                valueLabel: `${curr.value} - ${next.value}`,
                label: mapLabel(curr.points < next.points ? curr : next), // imperfect heuristic
                min: curr.value,
                max: next.value
            });
        }

        // Final Zone: > Last (Fail)
        const last = levels[levels.length - 1];
        zones.push({
            valueLabel: `> ${last.value}`,
            label: 'UNACCEPTABLE',
            min: last.value,
            max: Infinity
        });
    }

    return zones;
}

function ValueMarker({ value, zones }: { value: number, zones: Zone[] }) {
    // We need to place the marker visually.
    // Unlike a linear scale, these are flex blocks.
    // We identify which block contains the value, and position it relative to that block.
    // Or simpler: Just highlight the active block and show an indicator.

    // Find active zone
    let activeIdx = -1;
    for (let i = 0; i < zones.length; i++) {
        const z = zones[i];
        if (value >= z.min && value < z.max) { // simplistic check
            activeIdx = i;
            break;
        }
    }

    // Edge cases
    if (activeIdx === -1) {
        if (value < zones[0].min) activeIdx = 0;
        else if (value > zones[zones.length - 1].max) activeIdx = zones.length - 1;
    }

    if (activeIdx === -1) return null;

    // We can't easily absolute position pixel-perfectly without ref measurements.
    // CSS-only trick: We render the marker *inside* the zone div, but we need to inject it.
    // Since we are mapping zones in the parent, we can't easily inject.

    // Alternative: We interpret the zones as equal width 1/N.
    // Position = (ActiveIdx + (Interpolation in Zone?)) / N * 100 %.

    // Let's do a simple "Center of the Zone" marker for now, or interpolated.
    const zone = zones[activeIdx];
    let offset = 0.5; // Center

    if (!zone.isUnbounded && zone.max !== Infinity && zone.min !== -Infinity) {
        const range = zone.max - zone.min;
        if (range > 0) {
            offset = (value - zone.min) / range;
            offset = Math.max(0.1, Math.min(0.9, offset)); // Clamp padding
        }
    }

    const totalZones = zones.length;
    const pct = ((activeIdx + offset) / totalZones) * 100;

    return (
        <div
            className="absolute top-0 bottom-0 w-1 bg-black shadow-lg ring-1 ring-white z-20 transition-all duration-300"
            style={{ left: `${pct}%` }}
        >
            {/* Popover value */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-0.5 px-1.5 rounded shadow font-bold whitespace-nowrap">
                {value}
            </div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-black rotate-45" />
        </div>
    );
}
