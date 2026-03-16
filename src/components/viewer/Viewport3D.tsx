/**
 * 3D Viewport Component
 * 
 * WebGL-based 3D volume viewer using VTK.js.
 * Features:
 * - Volume rendering
 * - Structure mesh visualization (via Marching Cubes)
 * - Camera controls (rotate, zoom)
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { RotateCcw, Eye, EyeOff, Loader2 } from 'lucide-react';

// VTK.js imports (with type declarations in src/types/vtk.d.ts)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';
import vtkRenderWindow from '@kitware/vtk.js/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from '@kitware/vtk.js/Rendering/Core/RenderWindowInteractor';
import vtkOpenGLRenderWindow from '@kitware/vtk.js/Rendering/OpenGL/RenderWindow';
import vtkInteractorStyleTrackballCamera from '@kitware/vtk.js/Interaction/Style/InteractorStyleTrackballCamera';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkImageMarchingCubes from '@kitware/vtk.js/Filters/General/ImageMarchingCubes';
import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';

// Structure configuration
import { getStructureColor } from './structureConfig';

interface StructureInfo {
    id: number;
    name: string;
    color: [number, number, number];
    visible: boolean;
}

interface Viewport3DProps {
    /** URL to segmentation labels file */
    labelsUrl?: string;
    /** Structure definitions from manifest */
    structureNames?: Record<number, string>;
    /** Class name for container */
    className?: string;
}

// VTK context type
interface VTKContext {
    renderWindow: ReturnType<typeof vtkRenderWindow.newInstance>;
    renderer: ReturnType<typeof vtkRenderer.newInstance>;
    openGLRenderWindow: ReturnType<typeof vtkOpenGLRenderWindow.newInstance>;
    interactor: ReturnType<typeof vtkRenderWindowInteractor.newInstance>;
    actors: Map<number, ReturnType<typeof vtkActor.newInstance>>;
}

/**
 * Parse custom binary volume format
 */
async function parseVolumeData(arrayBuffer: ArrayBuffer): Promise<{
    dimensions: [number, number, number];
    spacing: [number, number, number];
    origin: [number, number, number];
    direction: number[];
    data: Uint8Array;
}> {
    const view = new DataView(arrayBuffer);
    let offset = 0;

    // Read header (72 bytes)
    const dimensions: [number, number, number] = [
        view.getUint32(offset, true),
        view.getUint32(offset + 4, true),
        view.getUint32(offset + 8, true),
    ];
    offset += 12;

    const spacing: [number, number, number] = [
        view.getFloat32(offset, true),
        view.getFloat32(offset + 4, true),
        view.getFloat32(offset + 8, true),
    ];
    offset += 12;

    const origin: [number, number, number] = [
        view.getFloat32(offset, true),
        view.getFloat32(offset + 4, true),
        view.getFloat32(offset + 8, true),
    ];
    offset += 12;

    const direction: number[] = [];
    for (let i = 0; i < 9; i++) {
        direction.push(view.getFloat32(offset, true));
        offset += 4;
    }

    // Rest is GZIP compressed data
    const compressedData = arrayBuffer.slice(offset);

    // Decompress using native DecompressionStream
    const decompressedData = await decompressGzip(compressedData);

    return { dimensions, spacing, origin, direction, data: decompressedData };
}

/**
 * Decompress GZIP data using browser's native DecompressionStream
 */
async function decompressGzip(compressedData: ArrayBuffer): Promise<Uint8Array> {
    const stream = new Response(compressedData).body;
    if (!stream) throw new Error('Failed to create stream');

    const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
    const reader = decompressedStream.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
    }

    // Combine chunks
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let position = 0;
    for (const chunk of chunks) {
        result.set(chunk, position);
        position += chunk.length;
    }

    return result;
}

export function Viewport3D({
    labelsUrl,
    structureNames = {},
    className,
}: Viewport3DProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const vtkContextRef = useRef<VTKContext | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadedStructures, setLoadedStructures] = useState<StructureInfo[]>([]);
    const [visibleStructures, setVisibleStructures] = useState<Set<number>>(new Set());

    // Initialize VTK.js
    useEffect(() => {
        if (!containerRef.current) return;

        // Create VTK.js rendering pipeline
        const renderWindow = vtkRenderWindow.newInstance();
        const renderer = vtkRenderer.newInstance({ background: [0.1, 0.1, 0.15] });
        renderWindow.addRenderer(renderer);

        const openGLRenderWindow = vtkOpenGLRenderWindow.newInstance();
        renderWindow.addView(openGLRenderWindow);
        openGLRenderWindow.setContainer(containerRef.current);

        // Set size
        const { width, height } = containerRef.current.getBoundingClientRect();
        openGLRenderWindow.setSize(width, height);

        // Setup interactor
        const interactor = vtkRenderWindowInteractor.newInstance();
        interactor.setView(openGLRenderWindow);
        interactor.initialize();
        interactor.bindEvents(containerRef.current);

        // Set trackball camera style
        const style = vtkInteractorStyleTrackballCamera.newInstance();
        interactor.setInteractorStyle(style);

        vtkContextRef.current = {
            renderWindow,
            renderer,
            openGLRenderWindow,
            interactor,
            actors: new Map(),
        };

        // Handle resize
        const resizeObserver = new ResizeObserver(() => {
            if (containerRef.current && vtkContextRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                vtkContextRef.current.openGLRenderWindow.setSize(width, height);
                vtkContextRef.current.renderWindow.render();
            }
        });
        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
            if (vtkContextRef.current) {
                vtkContextRef.current.interactor.unbindEvents();
                vtkContextRef.current.openGLRenderWindow.delete();
            }
        };
    }, []);

    // Load and process volume data
    const loadVolumeData = useCallback(async () => {
        if (!labelsUrl || !vtkContextRef.current) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(labelsUrl);
            if (!response.ok) throw new Error(`Failed to load: ${response.status}`);

            const arrayBuffer = await response.arrayBuffer();
            const volumeData = await parseVolumeData(arrayBuffer);

            // Create VTK ImageData
            const imageData = vtkImageData.newInstance();
            imageData.setDimensions(volumeData.dimensions[0], volumeData.dimensions[1], volumeData.dimensions[2]);
            imageData.setSpacing(volumeData.spacing[0], volumeData.spacing[1], volumeData.spacing[2]);
            imageData.setOrigin(volumeData.origin[0], volumeData.origin[1], volumeData.origin[2]);

            const scalars = vtkDataArray.newInstance({
                name: 'Labels',
                numberOfComponents: 1,
                values: volumeData.data,
            });
            imageData.getPointData().setScalars(scalars);

            // Find unique labels
            const uniqueLabels = new Set<number>();
            for (let i = 0; i < volumeData.data.length; i++) {
                if (volumeData.data[i] > 0) {
                    uniqueLabels.add(volumeData.data[i]);
                }
            }

            // Generate meshes for each label using Marching Cubes
            const { renderer, renderWindow, actors } = vtkContextRef.current;
            const structureInfos: StructureInfo[] = [];
            const binaryMask = new Uint8Array(volumeData.data.length);

            uniqueLabels.forEach((labelId) => {
                // Create binary mask for this label
                for (let i = 0; i < volumeData.data.length; i++) {
                    binaryMask[i] = volumeData.data[i] === labelId ? 255 : 0;
                }

                // Create ImageData with binary mask
                const maskImageData = vtkImageData.newInstance();
                maskImageData.setDimensions(volumeData.dimensions[0], volumeData.dimensions[1], volumeData.dimensions[2]);
                maskImageData.setSpacing(volumeData.spacing[0], volumeData.spacing[1], volumeData.spacing[2]);
                maskImageData.setOrigin(volumeData.origin[0], volumeData.origin[1], volumeData.origin[2]);

                const maskScalars = vtkDataArray.newInstance({
                    name: 'Mask',
                    numberOfComponents: 1,
                    values: new Uint8Array(binaryMask),
                });
                maskImageData.getPointData().setScalars(maskScalars);

                // Run Marching Cubes
                const marchingCubes = vtkImageMarchingCubes.newInstance();
                marchingCubes.setInputData(maskImageData);
                marchingCubes.setContourValue(127);

                // Create actor
                const mapper = vtkMapper.newInstance();
                mapper.setInputConnection(marchingCubes.getOutputPort());

                const actor = vtkActor.newInstance();
                actor.setMapper(mapper);

                // Set color using structure config
                const structureName = structureNames[labelId] || `Structure ${labelId}`;
                const color = getStructureColor(structureName);
                actor.getProperty().setColor(color[0], color[1], color[2]);
                actor.getProperty().setOpacity(0.8);

                renderer.addActor(actor);
                actors.set(labelId, actor);

                structureInfos.push({
                    id: labelId,
                    name: structureName,
                    color,
                    visible: true,
                });
            });

            // Reset camera and render
            renderer.resetCamera();
            renderWindow.render();

            setLoadedStructures(structureInfos);
            setVisibleStructures(new Set(structureInfos.map(s => s.id)));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load volume');
        } finally {
            setIsLoading(false);
        }
    }, [labelsUrl, structureNames]);

    // Load data when URL changes
    useEffect(() => {
        if (labelsUrl) {
            loadVolumeData();
        }
    }, [labelsUrl, loadVolumeData]);

    // Toggle structure visibility
    const toggleStructure = (id: number) => {
        if (!vtkContextRef.current) return;

        const { actors, renderWindow } = vtkContextRef.current;
        const actor = actors.get(id);
        if (!actor) return;

        const newVisible = !visibleStructures.has(id);
        actor.setVisibility(newVisible);
        renderWindow.render();

        setVisibleStructures(prev => {
            const next = new Set(prev);
            if (newVisible) {
                next.add(id);
            } else {
                next.delete(id);
            }
            return next;
        });
    };

    // Reset camera
    const resetCamera = () => {
        if (!vtkContextRef.current) return;
        const { renderer, renderWindow } = vtkContextRef.current;
        renderer.resetCamera();
        renderWindow.render();
    };

    // No data state
    if (!labelsUrl) {
        return (
            <div className={clsx("bg-slate-900 rounded-lg flex items-center justify-center aspect-square", className)}>
                <div className="text-center text-slate-400 p-8">
                    <p className="text-sm font-medium">3D Viewer</p>
                    <p className="text-xs mt-1 opacity-70">Load structure data to visualize</p>
                </div>
            </div>
        );
    }

    return (
        <div className={clsx("flex flex-col gap-3", className)}>
            {/* 3D Canvas Container */}
            <div className="relative bg-slate-900 rounded-lg overflow-hidden aspect-square">
                <div ref={containerRef} className="absolute inset-0" />

                {/* Loading overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-10">
                        <div className="flex items-center gap-2 text-white">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-sm">Loading structures...</span>
                        </div>
                    </div>
                )}

                {/* Error overlay */}
                {error && (
                    <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-10">
                        <p className="text-rose-400 text-sm">{error}</p>
                    </div>
                )}

                {/* Controls overlay */}
                <div className="absolute top-2 right-2 flex gap-2">
                    <button
                        onClick={resetCamera}
                        className="p-2 bg-black/60 hover:bg-black/80 rounded text-white transition-colors"
                        title="Reset camera"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Structure List */}
            {loadedStructures.length > 0 && (
                <div className="bg-slate-50 rounded-lg p-3">
                    <h4 className="text-xs font-bold text-slate-700 mb-2">Structures</h4>
                    <div className="flex flex-wrap gap-2">
                        {loadedStructures.map((structure) => (
                            <button
                                key={structure.id}
                                onClick={() => toggleStructure(structure.id)}
                                className={clsx(
                                    "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all",
                                    visibleStructures.has(structure.id)
                                        ? "bg-white shadow-sm border border-slate-200"
                                        : "bg-slate-200 text-slate-500"
                                )}
                            >
                                <span
                                    className="w-3 h-3 rounded-sm"
                                    style={{
                                        backgroundColor: `rgb(${structure.color.map(c => Math.round(c * 255)).join(',')})`,
                                        opacity: visibleStructures.has(structure.id) ? 1 : 0.3,
                                    }}
                                />
                                {structure.name}
                                {visibleStructures.has(structure.id) ? (
                                    <Eye className="w-3 h-3 text-slate-400" />
                                ) : (
                                    <EyeOff className="w-3 h-3 text-slate-400" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
