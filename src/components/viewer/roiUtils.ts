/**
 * ROI (Region of Interest) Utilities
 * 
 * Functions for calculating statistics from raw CT pixel data.
 * Reads directly from Int16Array (Hounsfield Units) for precision.
 */

export interface ROICircle {
    centerX: number;
    centerY: number;
    radius: number;
}

export interface ROIStats {
    count: number;
    mean: number;
    stdDev: number;
    min: number;
    max: number;
}

/**
 * Calculate statistics for pixels inside a circular ROI.
 * Uses single-pass algorithm for mean and standard deviation.
 * 
 * @param rawPixelData - Int16Array of Hounsfield Units
 * @param imageWidth - Image width in pixels
 * @param circle - Circle definition with center and radius in pixel coordinates
 * @returns Statistics for pixels inside the circle
 */
export function calculateCircleROIStats(
    rawPixelData: Int16Array,
    imageWidth: number,
    circle: ROICircle
): ROIStats {
    const { centerX, centerY, radius } = circle;
    const radiusSq = radius * radius;

    // Calculate bounding box to minimize iterations
    const minX = Math.max(0, Math.floor(centerX - radius));
    const maxX = Math.min(imageWidth - 1, Math.ceil(centerX + radius));
    const minY = Math.max(0, Math.floor(centerY - radius));
    const maxY = Math.min(Math.ceil(rawPixelData.length / imageWidth) - 1, Math.ceil(centerY + radius));

    let count = 0;
    let sum = 0;
    let sumSq = 0;
    let min = Infinity;
    let max = -Infinity;

    // Iterate through bounding box
    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            // Check if pixel is inside circle
            const dx = x - centerX;
            const dy = y - centerY;
            const distSq = dx * dx + dy * dy;

            if (distSq <= radiusSq) {
                const idx = y * imageWidth + x;
                const value = rawPixelData[idx];

                count++;
                sum += value;
                sumSq += value * value;
                min = Math.min(min, value);
                max = Math.max(max, value);
            }
        }
    }

    if (count === 0) {
        return { count: 0, mean: 0, stdDev: 0, min: 0, max: 0 };
    }

    const mean = sum / count;
    // Variance = E[X²] - E[X]²
    const variance = (sumSq / count) - (mean * mean);
    const stdDev = Math.sqrt(Math.max(0, variance));

    return { count, mean, stdDev, min, max };
}

/**
 * Convert screen coordinates to image coordinates.
 * Accounts for canvas scaling and CSS transforms.
 */
export function screenToImageCoords(
    screenX: number,
    screenY: number,
    canvasRect: DOMRect,
    imageWidth: number,
    imageHeight: number,
    transform: { scale: number; translateX: number; translateY: number }
): { x: number; y: number } {
    // Get position relative to canvas center
    const canvasCenterX = canvasRect.width / 2;
    const canvasCenterY = canvasRect.height / 2;

    // Account for transform (translate then scale from center)
    const relX = screenX - canvasRect.left - canvasCenterX - transform.translateX;
    const relY = screenY - canvasRect.top - canvasCenterY - transform.translateY;

    // Scale back to image coordinates
    const scaledX = relX / transform.scale;
    const scaledY = relY / transform.scale;

    // Convert from centered coordinates to image coordinates
    const x = scaledX + imageWidth / 2;
    const y = scaledY + imageHeight / 2;

    return { x, y };
}
