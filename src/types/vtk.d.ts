/**
 * VTK.js Type Declarations
 * 
 * Basic type declarations for VTK.js modules used in this project.
 * VTK.js is a JavaScript library and doesn't ship with complete TypeScript types.
 */

declare module '@kitware/vtk.js/Rendering/Profiles/Geometry' {
    const value: unknown;
    export default value;
}

declare module '@kitware/vtk.js/Rendering/Core/Renderer' {
    interface vtkRenderer {
        addActor(actor: unknown): void;
        removeActor(actor: unknown): void;
        resetCamera(): void;
        setBackground(r: number, g: number, b: number): void;
    }
    interface RendererInitialValues {
        background?: [number, number, number];
    }
    const vtkRenderer: {
        newInstance(values?: RendererInitialValues): vtkRenderer;
    };
    export default vtkRenderer;
}

declare module '@kitware/vtk.js/Rendering/Core/RenderWindow' {
    interface vtkRenderWindow {
        addRenderer(renderer: unknown): void;
        addView(view: unknown): void;
        render(): void;
    }
    const vtkRenderWindow: {
        newInstance(): vtkRenderWindow;
    };
    export default vtkRenderWindow;
}

declare module '@kitware/vtk.js/Rendering/Core/RenderWindowInteractor' {
    interface vtkRenderWindowInteractor {
        setView(view: unknown): void;
        initialize(): void;
        bindEvents(container: HTMLElement): void;
        unbindEvents(): void;
        setInteractorStyle(style: unknown): void;
    }
    const vtkRenderWindowInteractor: {
        newInstance(): vtkRenderWindowInteractor;
    };
    export default vtkRenderWindowInteractor;
}

declare module '@kitware/vtk.js/Rendering/OpenGL/RenderWindow' {
    interface vtkOpenGLRenderWindow {
        setContainer(container: HTMLElement): void;
        setSize(width: number, height: number): void;
        delete(): void;
    }
    const vtkOpenGLRenderWindow: {
        newInstance(): vtkOpenGLRenderWindow;
    };
    export default vtkOpenGLRenderWindow;
}

declare module '@kitware/vtk.js/Interaction/Style/InteractorStyleTrackballCamera' {
    interface vtkInteractorStyleTrackballCamera {
        readonly __brand: 'vtkInteractorStyleTrackballCamera';
    }
    const vtkInteractorStyleTrackballCamera: {
        newInstance(): vtkInteractorStyleTrackballCamera;
    };
    export default vtkInteractorStyleTrackballCamera;
}

declare module '@kitware/vtk.js/Rendering/Core/Actor' {
    interface vtkActor {
        setMapper(mapper: unknown): void;
        getProperty(): {
            setColor(r: number, g: number, b: number): void;
            setOpacity(opacity: number): void;
        };
        setVisibility(visible: boolean): void;
    }
    const vtkActor: {
        newInstance(): vtkActor;
    };
    export default vtkActor;
}

declare module '@kitware/vtk.js/Rendering/Core/Mapper' {
    interface vtkMapper {
        setInputConnection(connection: unknown): void;
    }
    const vtkMapper: {
        newInstance(): vtkMapper;
    };
    export default vtkMapper;
}

declare module '@kitware/vtk.js/Filters/General/ImageMarchingCubes' {
    interface vtkImageMarchingCubes {
        setInputData(data: unknown): void;
        setContourValue(value: number): void;
        getOutputPort(): unknown;
    }
    const vtkImageMarchingCubes: {
        newInstance(): vtkImageMarchingCubes;
    };
    export default vtkImageMarchingCubes;
}

declare module '@kitware/vtk.js/Common/DataModel/ImageData' {
    interface vtkImageData {
        setDimensions(x: number, y: number, z: number): void;
        setSpacing(x: number, y: number, z: number): void;
        setOrigin(x: number, y: number, z: number): void;
        getPointData(): {
            setScalars(scalars: unknown): void;
        };
    }
    const vtkImageData: {
        newInstance(): vtkImageData;
    };
    export default vtkImageData;
}

declare module '@kitware/vtk.js/Common/Core/DataArray' {
    interface DataArrayInitialValues {
        name?: string;
        numberOfComponents?: number;
        values?: ArrayLike<number>;
    }
    interface vtkDataArray {
        readonly __brand: 'vtkDataArray';
    }
    const vtkDataArray: {
        newInstance(values?: DataArrayInitialValues): vtkDataArray;
    };
    export default vtkDataArray;
}
