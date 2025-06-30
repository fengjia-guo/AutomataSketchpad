import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Move, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { GridLayer } from './GridLayer';
import { StateProps } from './State';
import StateLayer from './StateLayer';
import { gridRegularizer } from './regularizer';
import { getUniqueID } from './uuidRecord';

export interface Point {
  x: number;
  y: number;
}

export interface Transform {
  x: number;
  y: number;
  scale: number;
}

export interface BoardConfig {
  minScale: number;
  maxScale: number;
  gridSize: number;
  stateRadius: number;
}

export const defaultBoardConfig: BoardConfig = {
  minScale: 0.1, 
  maxScale: 10, 
  gridSize: 100, 
  stateRadius: 0.25, 
};

export interface AutomataGraph {
  states: Record<string, StateProps>;
  boardConfig: BoardConfig;
}

const InfiniteBoard: React.FC<{cfg: BoardConfig}> = ({cfg = defaultBoardConfig}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [lastTransform, setLastTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });

  const [states, setStates] = useState<Record<string, StateProps>>({});
  const [selected, setSelected] = useState<null | string>(null);

  const [history, setHistory] = useState<AutomataGraph[]>([{states: {}, boardConfig: cfg}]);
  const [head, setHead] = useState<number>(0);
  const [config, setConfig] = useState<BoardConfig>(cfg);
  const [needUpdate, setNeedUpdate] = useState(false);

  const headRef = useRef(head);
  const historyRef = useRef(history);

  useEffect(() => {
    headRef.current = head;
  }, [head]);
  
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  const undo = useCallback(() => {
    if (headRef.current > 0) {
      setHead(headRef.current - 1);
      setSelected(null);
    }
  }, []);

  const forward = useCallback(() => {
    if (headRef.current + 1 < historyRef.current.length) {
      setHead(headRef.current + 1);
      setSelected(null);
    }
  }, []);

  const updateHistory = useCallback(() => {
    if (needUpdate) {
      // drop merged states
      let newStates: Record<string, StateProps> = {};
      for (const key in states) {
        if (states[key].merged) {
          // TODO: update transitions later
          if (selected === key) {
            setSelected(states[key].merged);
          }
        } else {
          newStates[key] = {...states[key], mergedBy: false};
        }
      }
      setHistory([...history.slice(0, head + 1), {states: newStates, boardConfig: config}]);
      setStates(newStates);
      setHead(head + 1);
      setNeedUpdate(false);
    }
  }, [states, config, history, head, needUpdate]);

  const syncHead = useCallback(() => {
    setStates(history[head].states);
    setConfig(history[head].boardConfig);
  }, [head, history]);

  useEffect(() => {
    syncHead();
  }, [head]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault();
      undo();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
      e.preventDefault();
      forward();
    }
  }, []);

  useEffect(() => {
    updateHistory();
  }, [needUpdate]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);  

  const minScale = cfg.minScale;
  const maxScale = cfg.maxScale;

  const onStatesChange = useCallback((changes: Record<string, StateProps>) => {
    setStates({...states, ...changes});
  }, [states]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only handle left click
    
    setIsMouseDown(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setLastTransform(transform);
    
    if (boardRef.current) {
      boardRef.current.style.cursor = 'grabbing';
    }
  }, [transform]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isMouseDown) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    if (deltaX !== 0 && deltaY !== 0) {
      setIsDragging(true);
    }

    setTransform({
      ...lastTransform,
      x: lastTransform.x + deltaX,
      y: lastTransform.y + deltaY,
    });
  }, [isMouseDown, dragStart, lastTransform]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) {
      setSelected(null);
      // clear selected
    }
    setIsDragging(false);
    setIsMouseDown(false);
    if (boardRef.current) {
      boardRef.current.style.cursor = 'grab';
    }
  }, [isDragging]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();

    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY * -0.003;
    const newScale = Math.min(Math.max(transform.scale + delta, minScale), maxScale);

    if (newScale === transform.scale) return;

    const scaleRatio = newScale / transform.scale;

    // Calculate new position to zoom towards mouse cursor
    const newX = mouseX - (mouseX - transform.x) * scaleRatio;
    const newY = mouseY - (mouseY - transform.y) * scaleRatio;

    setTransform({
      x: newX,
      y: newY,
      scale: newScale,
    });
  }, [transform]);

  const reset = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  const zoomIn = useCallback(() => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const newScale = Math.min(transform.scale * 1.5, maxScale);
    
    if (newScale === transform.scale) return;

    const scaleRatio = newScale / transform.scale;
    const newX = centerX - (centerX - transform.x) * scaleRatio;
    const newY = centerY - (centerY - transform.y) * scaleRatio;

    setTransform({ x: newX, y: newY, scale: newScale });
  }, [transform]);

  const zoomOut = useCallback(() => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const newScale = Math.max(transform.scale / 1.5, minScale);
    
    if (newScale === transform.scale) return;

    const scaleRatio = newScale / transform.scale;
    const newX = centerX - (centerX - transform.x) * scaleRatio;
    const newY = centerY - (centerY - transform.y) * scaleRatio;

    setTransform({ x: newX, y: newY, scale: newScale });
  }, [transform]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    board.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      board.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  useEffect(() => {
    if (isMouseDown) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseUp);
      };
    }
  }, [isMouseDown, handleMouseMove, handleMouseUp]);

  const boardProps = {transform: transform, boardRef: boardRef, boardConfig: cfg}

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const scaledGridSize = transform.scale * cfg.gridSize;
    const newRelativePostion = {
      x: (e.clientX - transform.x) / scaledGridSize,
      y: (e.clientY - transform.y) / scaledGridSize
    };
    const result = gridRegularizer(null, states, newRelativePostion.x, newRelativePostion.y);
    if (result) {
      const newID = getUniqueID(states);
      const newState: StateProps = {
        id: newID, 
        label: `q_${newID[0]}`, 
        position: result, 
        radius: cfg.stateRadius, 
        isAccepting: false, 
        isDummy: false, 
        merged: null, 
        mergedBy: false, 
      };
      setStates({...states, ...{[newID]: newState}});
      setNeedUpdate(true);
    }
  }, [states, transform, cfg]);

  return (
    <div className="w-full h-screen relative overflow-hidden bg-gray-50">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2">
        <button
          onClick={zoomIn}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={20} />
        </button>
        <button
          onClick={zoomOut}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={20} />
        </button>
        <button
          onClick={reset}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title="Reset View"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {/* Info Panel */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-4 text-sm text-gray-600">
        <div className="flex items-center gap-2 mb-2">
          <Move size={16} />
          <span className="font-medium">Infinite Grid Board</span>
        </div>
        <div className="space-y-1">
          <div>Zoom: {(transform.scale * 100).toFixed(0)}%</div>
          <div>Position: ({Math.round(-transform.x / transform.scale)}, {Math.round(-transform.y / transform.scale)})</div>
        </div>
        <div className="mt-3 pt-3 border-t text-xs space-y-1">
          <div>• Drag to pan around</div>
          <div>• Scroll to zoom in/out</div>
          <div>• Use controls to reset</div>
          <div> {`HEAD: ${head}`}</div>
        </div>
      </div>

      {/* Main Board */}
      <div
        ref={boardRef}
        className="w-full h-full cursor-grab select-none relative"
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        <svg
          className="absolute inset-0 w-full h-full"
          style={{
            overflow: 'visible'
          }}
        >
          {<GridLayer transform={transform} boardRef={boardRef} boardConfig={cfg}/>}
        </svg>
      </div>
      <StateLayer 
        states={states} 
        boardProps={boardProps} 
        onStatesChange={onStatesChange} 
        selected={selected} 
        setSelected={setSelected}
        setStates={setStates}
        callForUpdate={() => setNeedUpdate(true)}
      />
      {/* Loading state when dragging */}
      {isDragging && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-20 text-white px-3 py-1 rounded-md text-sm">
            Dragging...
          </div>
        </div>
      )}
    </div>
  );
};

export default InfiniteBoard;