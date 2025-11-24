import React, { useRef, useState, useMemo } from 'react';
import { Layer, CanvasState, ToolMode } from '../types';
import { FloatingMenu } from './FloatingMenu';

interface CanvasProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
  toolMode: ToolMode;
  onLayerAction: (action: string, layerId: string) => void;
  onCutout: (type: 'click' | 'brush', data: any) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  toolMode,
  onLayerAction,
  onCutout
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  const [canvasState, setCanvasState] = useState<CanvasState>({
    scale: 1,
    offsetX: 0,
    offsetY: 0
  });
  
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [isDraggingLayer, setIsDraggingLayer] = useState(false);

  // Brush Selection State
  const [isBrushing, setIsBrushing] = useState(false);
  const [brushPath, setBrushPath] = useState<{x: number, y: number}[]>([]);

  // Handle Zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomSensitivity = 0.001;
      const newScale = Math.min(Math.max(0.1, canvasState.scale - e.deltaY * zoomSensitivity), 5);
      setCanvasState(prev => ({ ...prev, scale: newScale }));
    } else {
      setCanvasState(prev => ({
        ...prev,
        offsetX: prev.offsetX - e.deltaX,
        offsetY: prev.offsetY - e.deltaY
      }));
    }
  };

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - canvasState.offsetX) / canvasState.scale,
      y: (clientY - rect.top - canvasState.offsetY) / canvasState.scale
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // 1. Handle Cutout Brush Start
    if (toolMode === ToolMode.CUTOUT_BRUSH) {
       setIsBrushing(true);
       const coords = getCanvasCoordinates(e.clientX, e.clientY);
       setBrushPath([coords]);
       lastMousePosRef.current = { x: e.clientX, y: e.clientY };
       return;
    }

    // 2. Handle Cutout Click
    if (toolMode === ToolMode.CUTOUT_CLICK) {
        return; 
    }

    // 3. Handle Pan
    if (e.button === 1 || toolMode === ToolMode.HAND || e.shiftKey) {
      setIsDraggingCanvas(true);
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // 4. Deselect
    if (e.target === containerRef.current) {
      onSelectLayer(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Update Custom Cursor
    if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
        cursorRef.current.style.display = (toolMode === ToolMode.CUTOUT_BRUSH && !isDraggingCanvas) ? 'block' : 'none';
    }

    // Brush Logic
    if (isBrushing && toolMode === ToolMode.CUTOUT_BRUSH) {
        const coords = getCanvasCoordinates(e.clientX, e.clientY);
        
        setBrushPath(prev => {
            const lastPoint = prev[prev.length - 1];
            if (lastPoint) {
                const dist = Math.hypot(coords.x - lastPoint.x, coords.y - lastPoint.y);
                if (dist < 5) return prev;
            }
            return [...prev, coords];
        });
        return;
    }

    // Canvas Pan Logic
    if (isDraggingCanvas) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      setCanvasState(prev => ({
        ...prev,
        offsetX: prev.offsetX + dx,
        offsetY: prev.offsetY + dy
      }));
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    } 
    // Layer Drag Logic
    else if (isDraggingLayer && selectedLayerId) {
      const dx = (e.clientX - lastMousePosRef.current.x) / canvasState.scale;
      const dy = (e.clientY - lastMousePosRef.current.y) / canvasState.scale;
      
      const layer = layers.find(l => l.id === selectedLayerId);
      if (layer) {
        onUpdateLayer(selectedLayerId, {
          x: layer.x + dx,
          y: layer.y + dy
        });
      }
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isBrushing) {
        setIsBrushing(false);
        if (brushPath.length > 2) {
             const activeLayer = layers.find(l => l.id === selectedLayerId);
             if (activeLayer) {
                 const relativePoints = brushPath.map(p => ({
                     x: p.x - activeLayer.x,
                     y: p.y - activeLayer.y
                 }));
                 
                 // Increase stroke width for better coverage
                 onCutout('brush', { 
                     points: relativePoints, 
                     strokeWidth: 50 / canvasState.scale 
                 });
             } else {
                 onCutout('brush', { points: brushPath, strokeWidth: 50 });
             }
        }
        setBrushPath([]);
    }

    if (toolMode === ToolMode.CUTOUT_CLICK && !isDraggingCanvas && !isDraggingLayer) {
        const coords = getCanvasCoordinates(e.clientX, e.clientY);
        onCutout('click', coords);
    }

    setIsDraggingCanvas(false);
    setIsDraggingLayer(false);
  };

  // Layer Specific Handlers
  const handleLayerMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    if (toolMode === ToolMode.CUTOUT_CLICK || toolMode === ToolMode.CUTOUT_BRUSH) {
        if (selectedLayerId !== id) {
            onSelectLayer(id);
        }
        
        if (toolMode === ToolMode.CUTOUT_BRUSH) {
             setIsBrushing(true);
             const coords = getCanvasCoordinates(e.clientX, e.clientY);
             setBrushPath([coords]);
             lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        } else if (toolMode === ToolMode.CUTOUT_CLICK) {
             const coords = getCanvasCoordinates(e.clientX, e.clientY);
             onCutout('click', coords);
        }
        return;
    }

    if (toolMode === ToolMode.HAND) return;

    onSelectLayer(id);
    setIsDraggingLayer(true);
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  // Dot Grid Pattern
  const backgroundStyle = {
    backgroundImage: 'radial-gradient(#333 1px, transparent 1px)',
    backgroundSize: `${20 * canvasState.scale}px ${20 * canvasState.scale}px`,
    backgroundPosition: `${canvasState.offsetX}px ${canvasState.offsetY}px`
  };

  const layerElements = useMemo(() => {
      return layers.map(layer => {
            if (layer.visible === false) return null;
            const isSelected = layer.id === selectedLayerId;
            const hasEraseImage = !!layer.eraseMaskImage;
            const shouldRenderSvg = hasEraseImage;

            return (
              <div
                key={layer.id}
                className="absolute group select-none"
                style={{
                  left: layer.x,
                  top: layer.y,
                  width: layer.width,
                  height: layer.height,
                  zIndex: layer.zIndex,
                }}
                onMouseDown={(e) => handleLayerMouseDown(e, layer.id)}
              >
                {shouldRenderSvg ? (
                    <svg 
                        width="100%" 
                        height="100%" 
                        viewBox={`0 0 ${layer.width} ${layer.height}`} 
                        className={`w-full h-full pointer-events-none transition-shadow duration-200
                             ${isSelected && toolMode === ToolMode.SELECT ? 'drop-shadow-[0_0_0_4px_rgba(109,40,217,0.3)]' : ''}
                        `}
                        style={{ overflow: 'visible' }}
                    >
                        <defs>
                            <mask id={`mask-${layer.id}`}>
                                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                                {layer.eraseMaskImage && (
                                    <image 
                                        href={layer.eraseMaskImage} 
                                        x="0" y="0" 
                                        width="100%" height="100%" 
                                        preserveAspectRatio="none"
                                        // The mask image is White=Show, Black=Hide.
                                        // Standard SVG masks use Luminance: White=Visible, Black=Hidden.
                                        // So we can just use the image directly.
                                    />
                                )}
                            </mask>
                        </defs>
                        <image 
                            href={layer.src} 
                            width={layer.width} 
                            height={layer.height} 
                            mask={`url(#mask-${layer.id})`}
                            preserveAspectRatio="none"
                            style={{ pointerEvents: 'auto' }}
                        />
                         {isSelected && toolMode === ToolMode.SELECT && (
                             <rect width="100%" height="100%" fill="none" stroke="#6d28d9" strokeWidth="2" />
                         )}
                    </svg>
                ) : (
                    <img 
                      src={layer.src} 
                      alt={layer.name}
                      className={`w-full h-full pointer-events-none transition-shadow duration-200 
                        ${isSelected && toolMode === ToolMode.SELECT ? 'ring-2 ring-[#6d28d9] shadow-[0_0_0_4px_rgba(109,40,217,0.3)]' : ''}
                        ${toolMode === ToolMode.SELECT ? 'hover:ring-1 hover:ring-white/30' : ''}
                      `}
                      style={{ objectFit: 'fill' }} // Changed to fill for precise pixel mapping
                    />
                )}
                
                {isSelected && toolMode === ToolMode.SELECT && (
                  <>
                    <div className="absolute -top-1 -left-1 w-2 h-2 bg-white rounded-full border border-purple-600" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full border border-purple-600" />
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white rounded-full border border-purple-600" />
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white rounded-full border border-purple-600" />
                    <div className="absolute top-0 right-0 w-0 h-0">
                        <FloatingMenu 
                            layer={layer} 
                            zoom={canvasState.scale} 
                            onAction={(action) => onLayerAction(action, layer.id)}
                        />
                    </div>
                  </>
                )}
              </div>
            );
        });
  }, [layers, selectedLayerId, toolMode, canvasState.scale]);

  const points = brushPath.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div 
      ref={containerRef}
      className={`flex-1 relative h-full overflow-hidden bg-[#050505] 
        ${toolMode === ToolMode.HAND || isDraggingCanvas ? 'cursor-grab' : ''}
        ${toolMode === ToolMode.CUTOUT_CLICK ? 'cursor-crosshair' : ''}
        ${toolMode === ToolMode.CUTOUT_BRUSH ? 'cursor-none' : ''}
      `}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={backgroundStyle}
    >
      <div 
        className="absolute transform-gpu origin-top-left will-change-transform"
        style={{
          transform: `translate(${canvasState.offsetX}px, ${canvasState.offsetY}px) scale(${canvasState.scale})`
        }}
      >
        {layerElements}

        {brushPath.length > 0 && (
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-[9999]" style={{ overflow: 'visible' }}>
                <defs>
                    <filter id="brush-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
                <polyline 
                    points={points} 
                    fill="none" 
                    stroke="rgba(255,255,255,0.5)" 
                    strokeWidth={50 / canvasState.scale} 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="opacity-90"
                    filter="url(#brush-glow)"
                />
                 <polyline 
                    points={points} 
                    fill="none" 
                    stroke="#a855f7" 
                    strokeWidth={2 / canvasState.scale} 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                />
            </svg>
        )}
      </div>

      <div 
          ref={cursorRef}
          className="fixed pointer-events-none z-[100] hidden"
          style={{ 
             left: 0, 
             top: 0
          }}
      >
          <div className="w-12 h-12 rounded-full border border-white/50 bg-purple-500/20 backdrop-blur-sm shadow-[0_0_10px_rgba(168,85,247,0.5)] flex items-center justify-center">
              <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
      </div>
      
      <div className="absolute bottom-4 right-4 bg-[#1e1e1e] border border-white/10 px-3 py-1.5 rounded-md text-xs text-gray-400 font-mono select-none">
        {Math.round(canvasState.scale * 100)} %
      </div>
    </div>
  );
};
