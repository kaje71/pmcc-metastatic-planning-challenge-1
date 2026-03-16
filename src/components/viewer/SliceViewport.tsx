/**
 * Slice Viewport Component
 * 
 * 2D CT slice viewer with:
 * - CPU-based rendering using Canvas
 * - Window/Level (W/L) controls
 * - Slice navigation
 * - Pan/Zoom via CSS transforms
 * - ROI measurement tool
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { Move, Target, Crosshair } from 'lucide-react';
import { calculateCircleROIStats, type ROICircle, type ROIStats } from './roiUtils';

interface SliceViewportProps {
    /** Array of slice URLs or data paths */
    slices: string[];
    /** Initial slice index */
    initialSlice?: number;
    /** Image dimensions (assuming square for now) */
    width?: number;
    height?: number;
    /** Pixel spacing for anisotropy handling */
    pixelSpacing?: [number, number];
    /** Class name for container */
    className?: string;
}

interface ViewTransform {
    scale: number;
    translateX: number;
    translateY: number;
}

type ToolMode = 'pan' | 'roi';

// Default CT window presets
const WINDOW_PRESETS = {
    lung: { center: -600, width: 1500 },
    mediastinum: { center: 40, width: 400 },
    bone: { center: 400, width: 1800 },
    soft_tissue: { center: 50, width: 350 },
} as const;

type WindowPreset = keyof typeof WINDOW_PRESETS;

export function SliceViewport({
    slices,
    initialSlice = 0,
    width = 512,
    height = 512,
    pixelSpacing = [1, 1],
    className,
}: SliceViewportProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

    // State
    const [currentSlice, setCurrentSlice] = useState(initialSlice);
    const [windowCenter, setWindowCenter] = useState(-600); // Lung window default
    const [windowWidth, setWindowWidth] = useState(1500);
    const [rawPixelData, setRawPixelData] = useState<Int16Array | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activePreset, setActivePreset] = useState<WindowPreset>('lung');

    // View transform state
    const [transform, setTransform] = useState<ViewTransform>({
        scale: 1,
        translateX: 0,
        translateY: 0,
    });

    // Tool state
    const [toolMode, setToolMode] = useState<ToolMode>('pan');
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

    // ROI state
    const [roiCircle, setRoiCircle] = useState<ROICircle | null>(null);
    const [roiStats, setRoiStats] = useState<ROIStats | null>(null);

    // Calculate scale factors for anisotropy
    const scaleY = pixelSpacing[1] / pixelSpacing[0];

    // Load slice data
    const loadSlice = useCallback(async (sliceIndex: number) => {
        if (slices.length === 0) return;

        const sliceUrl = slices[sliceIndex];
        if (!sliceUrl) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(sliceUrl);
            if (!response.ok) {
                throw new Error(`Failed to load slice: ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const rawData = new Int16Array(arrayBuffer);
            setRawPixelData(rawData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load slice');
            setRawPixelData(null);
        } finally {
            setIsLoading(false);
        }
    }, [slices]);

    // Load initial slice
    useEffect(() => {
        if (slices.length > 0) {
            loadSlice(currentSlice);
        }
    }, [currentSlice, loadSlice, slices.length]);

    // Render loop - applies window/level transform
    useEffect(() => {
        if (!rawPixelData || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        const winMin = windowCenter - windowWidth / 2;
        const winMax = windowCenter + windowWidth / 2;
        const factor = 255 / windowWidth;

        for (let i = 0; i < rawPixelData.length; i++) {
            const hu = rawPixelData[i];
            let val: number;
            if (hu <= winMin) {
                val = 0;
            } else if (hu >= winMax) {
                val = 255;
            } else {
                val = (hu - winMin) * factor;
            }

            const idx = i * 4;
            data[idx] = val;
            data[idx + 1] = val;
            data[idx + 2] = val;
            data[idx + 3] = 255;
        }

        ctx.putImageData(imageData, 0, 0);
    }, [rawPixelData, windowCenter, windowWidth, width, height]);

    // Draw ROI overlay
    useEffect(() => {
        if (!overlayCanvasRef.current) return;
        const ctx = overlayCanvasRef.current.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, width, height);

        if (roiCircle) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(roiCircle.centerX, roiCircle.centerY, roiCircle.radius, 0, Math.PI * 2);
            ctx.stroke();

            // Draw crosshair at center
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 1;
            const crossSize = 8;
            ctx.beginPath();
            ctx.moveTo(roiCircle.centerX - crossSize, roiCircle.centerY);
            ctx.lineTo(roiCircle.centerX + crossSize, roiCircle.centerY);
            ctx.moveTo(roiCircle.centerX, roiCircle.centerY - crossSize);
            ctx.lineTo(roiCircle.centerX, roiCircle.centerY + crossSize);
            ctx.stroke();
        }
    }, [roiCircle, width, height]);

    // Calculate ROI stats when circle changes
    useEffect(() => {
        if (roiCircle && rawPixelData) {
            const stats = calculateCircleROIStats(rawPixelData, width, roiCircle);
            setRoiStats(stats);
        } else {
            setRoiStats(null);
        }
    }, [roiCircle, rawPixelData, width]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!containerRef.current?.contains(document.activeElement)) return;

            switch (e.key) {
                case 'ArrowUp':
                case 'PageUp':
                    e.preventDefault();
                    setCurrentSlice(prev => Math.min(prev + 1, slices.length - 1));
                    break;
                case 'ArrowDown':
                case 'PageDown':
                    e.preventDefault();
                    setCurrentSlice(prev => Math.max(prev - 1, 0));
                    break;
                case 'Home':
                    e.preventDefault();
                    setCurrentSlice(0);
                    break;
                case 'End':
                    e.preventDefault();
                    setCurrentSlice(slices.length - 1);
                    break;
                case 'r':
                case 'R':
                    setTransform({ scale: 1, translateX: 0, translateY: 0 });
                    break;
                case 'Escape':
                    setRoiCircle(null);
                    setRoiStats(null);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [slices.length]);

    // Mouse wheel for slice navigation and zoom
    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setTransform(prev => ({
                ...prev,
                scale: Math.max(0.5, Math.min(5, prev.scale * delta)),
            }));
        } else {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -1 : 1;
            setCurrentSlice(prev => Math.max(0, Math.min(slices.length - 1, prev + delta)));
        }
    }, [slices.length]);

    // Get image coordinates from mouse event
    const getImageCoords = useCallback((e: React.MouseEvent): { x: number; y: number } | null => {
        if (!containerRef.current) return null;
        const rect = containerRef.current.getBoundingClientRect();
        const containerSize = Math.min(rect.width, rect.height);

        // Calculate canvas position within container (centered)
        const canvasDisplayWidth = containerSize;
        const canvasDisplayHeight = containerSize;
        const offsetX = (rect.width - canvasDisplayWidth) / 2;
        const offsetY = (rect.height - canvasDisplayHeight) / 2;

        // Mouse position relative to container
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Account for transform
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Reverse the CSS transform
        const untransformedX = (mouseX - centerX - transform.translateX) / transform.scale + centerX;
        const untransformedY = (mouseY - centerY - transform.translateY) / transform.scale + centerY;

        // Map to image coordinates
        const imageX = ((untransformedX - offsetX) / canvasDisplayWidth) * width;
        const imageY = ((untransformedY - offsetY) / canvasDisplayHeight) * height;

        return { x: imageX, y: imageY };
    }, [transform, width, height]);

    // Mouse handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return; // Left click only

        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });

        if (toolMode === 'roi') {
            const coords = getImageCoords(e);
            if (coords) {
                setRoiCircle({ centerX: coords.x, centerY: coords.y, radius: 0 });
            }
        }
    }, [toolMode, getImageCoords]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging || !dragStart) return;

        if (toolMode === 'pan') {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            setTransform(prev => ({
                ...prev,
                translateX: prev.translateX + dx,
                translateY: prev.translateY + dy,
            }));
            setDragStart({ x: e.clientX, y: e.clientY });
        } else if (toolMode === 'roi' && roiCircle) {
            const coords = getImageCoords(e);
            if (coords) {
                const dx = coords.x - roiCircle.centerX;
                const dy = coords.y - roiCircle.centerY;
                const radius = Math.sqrt(dx * dx + dy * dy);
                setRoiCircle(prev => prev ? { ...prev, radius } : null);
            }
        }
    }, [isDragging, dragStart, toolMode, roiCircle, getImageCoords]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setDragStart(null);
    }, []);

    // Apply window preset
    const applyPreset = (preset: WindowPreset) => {
        setWindowCenter(WINDOW_PRESETS[preset].center);
        setWindowWidth(WINDOW_PRESETS[preset].width);
        setActivePreset(preset);
    };

    // No slices available
    if (slices.length === 0) {
        return (
            <div className={clsx("bg-slate-900 rounded-lg flex items-center justify-center", className)}>
                <div className="text-center text-slate-400 p-8">
                    <p className="text-sm font-medium">No slices available</p>
                    <p className="text-xs mt-1 opacity-70">Load DICOM data to view</p>
                </div>
            </div>
        );
    }

    return (
        <div className={clsx("flex flex-col gap-3", className)}>
            {/* Canvas Container */}
            <div
                ref={containerRef}
                className={clsx(
                    "relative bg-slate-900 rounded-lg overflow-hidden aspect-square",
                    toolMode === 'pan' ? "cursor-grab" : "cursor-crosshair",
                    isDragging && toolMode === 'pan' && "cursor-grabbing"
                )}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                tabIndex={0}
            >
                {/* Loading overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-10">
                        <div className="w-8 h-8 border-2 border-pmac-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {/* Error overlay */}
                {error && (
                    <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-10">
                        <p className="text-rose-400 text-sm">{error}</p>
                    </div>
                )}

                {/* Canvas with CSS transforms for pan/zoom */}
                <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                        transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
                        transformOrigin: 'center',
                    }}
                >
                    {/* Main image canvas */}
                    <canvas
                        ref={canvasRef}
                        width={width}
                        height={height}
                        className="max-w-full max-h-full absolute"
                        style={{
                            imageRendering: 'pixelated',
                            transform: `scaleY(${scaleY})`,
                        }}
                    />
                    {/* ROI overlay canvas */}
                    <canvas
                        ref={overlayCanvasRef}
                        width={width}
                        height={height}
                        className="max-w-full max-h-full absolute pointer-events-none"
                        style={{
                            transform: `scaleY(${scaleY})`,
                        }}
                    />
                </div>

                {/* Slice indicator */}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-mono px-2 py-1 rounded">
                    {currentSlice + 1} / {slices.length}
                </div>

                {/* Window/Level indicator */}
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-mono px-2 py-1 rounded">
                    WL: {windowCenter} / WW: {windowWidth}
                </div>

                {/* ROI Stats overlay */}
                {roiStats && roiStats.count > 0 && (
                    <div className="absolute top-2 right-2 bg-black/80 text-white text-xs font-mono px-3 py-2 rounded space-y-1">
                        <div className="text-green-400 font-bold flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            ROI Statistics
                        </div>
                        <div>Mean: <span className="text-green-300">{roiStats.mean.toFixed(1)} HU</span></div>
                        <div>StdDev: <span className="text-green-300">{roiStats.stdDev.toFixed(1)}</span></div>
                        <div>Min/Max: <span className="text-green-300">{roiStats.min} / {roiStats.max}</span></div>
                        <div>Pixels: <span className="text-green-300">{roiStats.count}</span></div>
                    </div>
                )}
            </div>

            {/* Tool Selection */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Tool:</span>
                <div className="flex gap-1">
                    <button
                        onClick={() => setToolMode('pan')}
                        className={clsx(
                            "flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors",
                            toolMode === 'pan'
                                ? "bg-pmac-600 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                    >
                        <Move className="w-3 h-3" />
                        Pan
                    </button>
                    <button
                        onClick={() => setToolMode('roi')}
                        className={clsx(
                            "flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors",
                            toolMode === 'roi'
                                ? "bg-green-600 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                    >
                        <Crosshair className="w-3 h-3" />
                        ROI
                    </button>
                </div>
                {roiCircle && (
                    <button
                        onClick={() => { setRoiCircle(null); setRoiStats(null); }}
                        className="text-xs text-rose-500 hover:text-rose-600 ml-2"
                    >
                        Clear ROI
                    </button>
                )}
            </div>

            {/* Window Presets */}
            <div className="flex flex-wrap gap-2">
                <div className="flex gap-1">
                    {(Object.keys(WINDOW_PRESETS) as WindowPreset[]).map((preset) => (
                        <button
                            key={preset}
                            onClick={() => applyPreset(preset)}
                            className={clsx(
                                "px-2 py-1 text-xs font-medium rounded transition-colors capitalize",
                                activePreset === preset
                                    ? "bg-pmac-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                        >
                            {preset.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Slice Slider */}
            <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-medium w-12">Slice</span>
                <input
                    type="range"
                    min={0}
                    max={slices.length - 1}
                    value={currentSlice}
                    onChange={(e) => setCurrentSlice(Number(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pmac-600"
                />
                <span className="text-xs font-mono text-slate-600 w-16 text-right">
                    {currentSlice + 1} / {slices.length}
                </span>
            </div>

            {/* W/L Sliders */}
            <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium w-16">Center</span>
                    <input
                        type="range"
                        min={-1000}
                        max={1000}
                        value={windowCenter}
                        onChange={(e) => setWindowCenter(Number(e.target.value))}
                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pmac-600"
                    />
                    <span className="text-xs font-mono text-slate-600 w-12 text-right">{windowCenter}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium w-16">Width</span>
                    <input
                        type="range"
                        min={1}
                        max={4000}
                        value={windowWidth}
                        onChange={(e) => setWindowWidth(Number(e.target.value))}
                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pmac-600"
                    />
                    <span className="text-xs font-mono text-slate-600 w-12 text-right">{windowWidth}</span>
                </div>
            </div>
        </div>
    );
}
