/**
 * Structure Configuration
 * 
 * Default structure definitions and color palette for radiotherapy structures.
 * Colors follow ICRU report conventions where applicable.
 */

export interface StructureDefinition {
    id: number;
    name: string;
    abbreviation?: string;
    color: [number, number, number]; // RGB 0-1
    opacity?: number;
    priority?: number; // Higher priority = rendered on top
    category: 'target' | 'oar' | 'support' | 'other';
}

/**
 * Default color palette for radiotherapy structures.
 * Based on clinical conventions and ICRU recommendations.
 */
export const STRUCTURE_COLORS: Record<string, [number, number, number]> = {
    // Targets (warm colors)
    'GTV': [0.85, 0.1, 0.1],       // Dark Red
    'CTV': [0.95, 0.3, 0.1],       // Orange-Red
    'PTV': [1.0, 0.0, 0.0],        // Pure Red
    'ITV': [0.95, 0.4, 0.2],       // Orange

    // Lung structures
    'Lung_L': [0.2, 0.6, 1.0],     // Light Blue
    'Lung_R': [0.3, 0.7, 0.95],    // Slightly different blue
    'Lung': [0.25, 0.65, 0.97],    // Combined lungs
    'Lungs-GTV': [0.2, 0.5, 0.9],  // Lung minus GTV

    // Heart & vessels
    'Heart': [1.0, 0.2, 0.4],      // Pink-Red
    'Aorta': [0.8, 0.2, 0.2],      // Dark Red
    'GreatVessels': [0.7, 0.3, 0.4], // Maroon

    // Spinal canal (preferred terminology)
    'Spinal_Canal': [1.0, 1.0, 0.0],     // Yellow
    'SpinalCanal': [1.0, 1.0, 0.0],      // Yellow (alternate name)
    'Canal': [1.0, 1.0, 0.0],            // Yellow (short name)
    'SpinalCanal_PRV': [1.0, 0.85, 0.0], // Amber

    // Legacy / dataset aliases (for colour matching)
    'Spinal_Cord': [1.0, 1.0, 0.0],      // Yellow
    'SpinalCord': [1.0, 1.0, 0.0],       // Yellow (alternate name)
    'Cord': [1.0, 1.0, 0.0],             // Yellow (short name)
    'SpinalCord_PRV': [1.0, 0.85, 0.0],  // Amber
    'BrachialPlexus': [0.9, 0.7, 0.1], // Gold

    // GI tract
    'Esophagus': [0.6, 0.4, 0.2],  // Brown
    'Oesophagus': [0.6, 0.4, 0.2], // Brown (alt spelling)
    'Stomach': [0.5, 0.35, 0.15],  // Dark Brown

    // Bone
    'Ribs': [0.95, 0.95, 0.9],     // Off-white
    'Bone': [0.9, 0.85, 0.75],     // Bone color
    'Sternum': [0.92, 0.88, 0.8],  // Cream

    // Trachea & airways
    'Trachea': [0.4, 0.8, 0.6],    // Teal
    'Bronchi': [0.35, 0.75, 0.55], // Darker teal

    // External & support
    'Body': [0.9, 0.8, 0.7],       // Skin tone
    'External': [0.9, 0.8, 0.7],   // Skin tone
    'Skin': [0.85, 0.7, 0.6],      // Skin

    // PRVs (lighter versions)
    'PRV': [0.8, 0.8, 0.6],        // Generic PRV
};

/**
 * Default structure definitions for thoracic planning.
 * These can be overridden by manifest.json.
 */
export const DEFAULT_STRUCTURES: StructureDefinition[] = [
    { id: 1, name: 'GTV', abbreviation: 'GTV', color: STRUCTURE_COLORS['GTV'], category: 'target', priority: 100 },
    { id: 2, name: 'PTV', abbreviation: 'PTV', color: STRUCTURE_COLORS['PTV'], category: 'target', priority: 90 },
    { id: 3, name: 'Lung_L', abbreviation: 'L.Lung', color: STRUCTURE_COLORS['Lung_L'], category: 'oar', priority: 50 },
    { id: 4, name: 'Lung_R', abbreviation: 'R.Lung', color: STRUCTURE_COLORS['Lung_R'], category: 'oar', priority: 50 },
    { id: 5, name: 'Heart', abbreviation: 'Heart', color: STRUCTURE_COLORS['Heart'], category: 'oar', priority: 60 },
    { id: 6, name: 'Spinal_Canal', abbreviation: 'Canal', color: STRUCTURE_COLORS['Spinal_Canal'], category: 'oar', priority: 70 },
    { id: 7, name: 'Esophagus', abbreviation: 'Eso', color: STRUCTURE_COLORS['Esophagus'], category: 'oar', priority: 55 },
    { id: 8, name: 'Body', abbreviation: 'Body', color: STRUCTURE_COLORS['Body'], category: 'support', priority: 10, opacity: 0.2 },
];

/**
 * Get color for a structure by name (case-insensitive fuzzy match).
 */
export function getStructureColor(name: string): [number, number, number] {
    // Exact match
    if (STRUCTURE_COLORS[name]) {
        return STRUCTURE_COLORS[name];
    }

    // Case-insensitive match
    const normalizedName = name.toLowerCase().replace(/[_\-\s]/g, '');
    for (const [key, color] of Object.entries(STRUCTURE_COLORS)) {
        if (key.toLowerCase().replace(/[_\-\s]/g, '') === normalizedName) {
            return color;
        }
    }

    // Partial match (contains)
    for (const [key, color] of Object.entries(STRUCTURE_COLORS)) {
        if (normalizedName.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedName)) {
            return color;
        }
    }

    // Default: generate a random but consistent color based on name hash
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return [
        ((hash >> 16) & 0xFF) / 255 * 0.5 + 0.5,
        ((hash >> 8) & 0xFF) / 255 * 0.5 + 0.5,
        (hash & 0xFF) / 255 * 0.5 + 0.5,
    ];
}

/**
 * Get default opacity for a structure category.
 */
export function getStructureOpacity(category: StructureDefinition['category']): number {
    switch (category) {
        case 'target': return 0.9;
        case 'oar': return 0.7;
        case 'support': return 0.3;
        case 'other': return 0.5;
    }
}
