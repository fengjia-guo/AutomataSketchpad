import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, MoveRight, Save, Upload, Grid3X3, Code, Wrench, Box } from 'lucide-react';
import { GridLayer } from './GridLayer';
import { Position, StateProps } from './State';
import StateLayer from './StateLayer';
import { gridRegularizer } from './regularizer';
import { getUniqueID } from './uuidRecord';
import { TransitionProps } from './Transition';
import { TransitionLayer } from './TransitionLayer';
import { TikzExporter } from './TikzExporter';
import { applyTool, TransitionEdge, TransitionTool } from './transitionTool';
import { TransitionToolManager } from './TransitionToolManager';
import { StateEditor } from './StateEditor';
import { TransitionEditor } from './TransitionEditor';

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
  transitions: Record<string, TransitionProps>;
  boardConfig: BoardConfig;
}

const InfiniteBoard: React.FC<{cfg: BoardConfig}> = ({cfg = defaultBoardConfig}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [lastTransform, setLastTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [showGrid, setShowGrid] = useState(true);
  const [showTikzExporter, setShowTikzExporter] = useState(false);
  const [tools, setTools] = useState<TransitionTool[]>([]);
  const [showToolManager, setShowToolManager] = useState(false);
  const [currentToolID, setCurrentToolID] = useState<number>(-1);
  const [usingTool, setUsingTool] = useState(false);
  const [toolParams, setToolParams] = useState<string[]>([]);

  const [states, setStates] = useState<Record<string, StateProps>>({});
  const [transitions, setTransitions] = useState<Record<string, TransitionProps>>({});
  const [selected, setSelected] = useState<null | string>(null);

  const [history, setHistory] = useState<AutomataGraph[]>([{states: {}, transitions: {}, boardConfig: cfg}]);
  const [head, setHead] = useState<number>(0);
  const [config, setConfig] = useState<BoardConfig>(cfg);
  const [needUpdate, setNeedUpdate] = useState(false);

  const headRef = useRef(head);
  const historyRef = useRef(history);

  const [createTransition, setCreateTransition] = useState(false);

  const createTransitionRef = useRef(createTransition);
  const selectedRef = useRef(selected);
  const usingToolRef = useRef(usingTool);

  const getState = (id: string) => {
    if (Object.prototype.hasOwnProperty.call(states, id)) {
      return states[id];
    } else return null;
  };

  const getDisplayPosition = (pos: Position) => {
    const scaledGridSize = config.gridSize * transform.scale;
    return {
      x: transform.x + pos.x * scaledGridSize,
      y: transform.y + pos.y * scaledGridSize
    }
  }

  useEffect(() => {
    headRef.current = head;
  }, [head]);
  
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    createTransitionRef.current = createTransition;
  }, [createTransition]);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    usingToolRef.current = usingTool;
  }, [usingTool]);

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
      let newTransitions: Record<string, TransitionProps> = structuredClone(transitions);
      for (const key in states) {
        if (states[key].merged) {
          // TODO: update transitions later
          for (const transitionID in transitions) {
            let newTransition = structuredClone(transitions[transitionID]);
            if (transitions[transitionID].fromID === key) {
              newTransition.fromID = states[key].merged;
            }
            if (transitions[transitionID].toID === key) {
              newTransition.toID = states[key].merged;
            }
            newTransitions[transitionID] = newTransition;
          }
          if (selected === key) {
            setSelected(states[key].merged);
          }
        } else {
          newStates[key] = {...states[key], mergedBy: false};
        }
      }
      setHistory(prevHistory => [
        ...prevHistory.slice(0, head + 1),
        { states: newStates, transitions: newTransitions, boardConfig: config }
      ]);
      // setStates(newStates);
      // setTransitions(newTransitions);
      setHead(head + 1);
      setNeedUpdate(false);
    }
  }, [states, transitions, config, history, head, needUpdate]);

  const syncHead = useCallback(() => {
    setStates(history[head].states);
    setTransitions(history[head].transitions);
    setConfig(history[head].boardConfig);
  }, [head, history]);

  useEffect(() => {
    syncHead();
  }, [head, history]);

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
      setShowTikzExporter(false);
      setShowToolManager(false);
      setCreateTransition(false);
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

  useEffect(() => {
    if (usingTool) setCreateTransition(false);
  }, [usingTool]);

  useEffect(() => {
    if (createTransition) setUsingTool(false);
  }, [createTransition]);

  useEffect(() => {
    if (showTikzExporter) setShowToolManager(false);
  }, [showTikzExporter]);

  useEffect(() => {
    if (showToolManager) setShowTikzExporter(false);
  }, [showToolManager])

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

  const handleTransitionDelete = (t: TransitionProps) => {
    let newTransitions: Record<string, TransitionProps> = {};
    for (const transitionID in transitions) {
      if (transitionID !== t.id) {
        newTransitions[transitionID] = transitions[transitionID];
      }
    }
    setTransitions(newTransitions);
    setNeedUpdate(true);
  };
  
  const handleStateDelete = (s: StateProps) => {
    let newTransitions: Record<string, TransitionProps> = {};
    for (const transitionID in transitions) {
      const transition = transitions[transitionID];
      if (transition.fromID !== s.id && transition.toID !== s.id) {
        newTransitions[transitionID] = transitions[transitionID];
      }
    }
    setTransitions(newTransitions);
    setNeedUpdate(true);
  };
  
  const insertTransitions = (edges: TransitionEdge[]) => {
    var newTransitions: Record<string, TransitionProps> = {};
    for (var i = 0; i < edges.length; i++) {
      const edge = edges[i];
      if (!Object.keys(states).includes(edge.fromID) || !Object.keys(states).includes(edge.toID)) {
        console.log(`skip invalid edge ${edge}`);
      } else {
        const newTransitionID = getUniqueID({...transitions, ...newTransitions});
        const newTransition: TransitionProps = {
          fromID: edge.fromID, 
          toID: edge.toID, 
          id: newTransitionID, 
          label: ""
        };
        newTransitions = {...newTransitions, ...{[newTransitionID]: newTransition}};
      }
    }
    if (Object.keys(newTransitions).length > 0) {
      setTransitions({...transitions, ...newTransitions});
      setNeedUpdate(true);
    }
  }

  const handleCreateTransition = (s: StateProps) => {
    if (selectedRef.current && createTransitionRef.current) {
      if (!Object.keys(states).includes(selectedRef.current)) return setSelected(s.id); 
      const newTransitionID = getUniqueID(transitions);
      const newTransition: TransitionProps = {
        fromID: selectedRef.current, 
        toID: s.id, 
        id: newTransitionID, 
        label: ""
      };
      setTransitions({...transitions, ...{[newTransitionID]: newTransition}});
      setSelected(s.id);
      setNeedUpdate(true);
    } else {
      console.error('selected is null');
    }
  };

  const handleStateClicked = (s: StateProps) => {
    if (!createTransitionRef.current) return handleSetSelectedInStates(s.id);
    if (selectedRef.current) {
      handleCreateTransition(s);
    } else {
      handleSetSelectedInStates(s.id);
    }
  };

  const handleStorage = () => {
    const data = { states, transitions };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'automata.json';
    a.click();

    URL.revokeObjectURL(url);
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const parsed = JSON.parse(text);
        if (!parsed.states || !parsed.transitions) {
          alert('Invalid automata file.');
          return;
        }
        setStates(parsed.states);
        setTransitions(parsed.transitions);
        setSelected(null);
        setNeedUpdate(true);
      } catch (err) {
        alert('Invalid automata file.');
      }
    };
    input.click();
  };

  const handleSetSelectedInStates = useCallback((s: null | string) => {
    setSelected(s);
    if (!usingToolRef.current) return;
    if (s !== null) {
      setToolParams(prev => [...prev, s]);
    } else {
      setToolParams([]);
    }
  }, [usingTool]);

  const handleApplyTool = () => {
    if (usingTool && currentToolID >= 0) {
      const tool = tools[currentToolID];
      if (tool.stateCount === toolParams.length) {
        const edges = applyTool(tool, toolParams);
        if (edges == "invalid" || edges == "mismatch") {
          console.error("Apply tool error: " + edges);
        } else {
          insertTransitions(edges);
          setToolParams([]);
        }
      }
    }
  }

  const handleStateEditorChange = (id: string, newProp: StateProps) => {
    if (selected && Object.keys(states).includes(selected) && id === selected) {
      setStates({...states, ...{[id]: newProp}});
      setNeedUpdate(true);
    }
  }

  const handleTransitionEditorChange = (id: string, newProp: TransitionProps) => {
    if (selected && Object.keys(transitions).includes(selected) && id === selected) {
      setTransitions({...transitions, ...{[id]: newProp}});
      setNeedUpdate(true);
    }
  }


  useEffect(() => {
    if (toolParams.length > 0) {
      handleApplyTool();
    }
  }, [toolParams])

  const tikz = <TikzExporter states={states} transitions={transitions} boardConfig={config}/>

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
        <button
          onClick={() => setShowGrid((prev) => !prev)}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title={`${showGrid ? "Hide" : `Show`} Grid`}
        >
          <Grid3X3 size={20} color={`${showGrid ? "black" : "gray"}`}/>
        </button>
        <div className="v-divider border-b-2" />
        <button
          onClick={() => setCreateTransition(prev => !prev)}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title="Create Transition"
        >
          <MoveRight size={20} color={createTransition ? "#2563eb" : "black"}/>
        </button>
        <button
          onClick={() => setUsingTool(prev => !prev)}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title={`${currentToolID >= 0 ? ("Use Tool " + tools[currentToolID].name) : "Select a Tool for Use"}`}
        >
          <Wrench size={20} color={(currentToolID >= 0) ? (usingTool ? "#2563eb" : "black") : "gray"}/>
        </button>
        <button
          onClick={() => setShowToolManager(prev => !prev)}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title="Manage Tools"
        >
          <Box size={20} color={showToolManager ? "#2563eb" : "black"}/>
        </button>
        <div className="v-divider border-b-2" />
        <button
          onClick={() => handleStorage()}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title="Save"
        >
          <Save size={20} />
        </button>
        <button
          onClick={() => setShowTikzExporter(prev => !prev)}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title="Export as Tikz"
        >
          <Code size={20} color={showTikzExporter ? "#2563eb" : "black"}/>
        </button>
        <button
          onClick={() => handleUpload()}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          title="Upload"
        >
          <Upload size={20} />
        </button>
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
          {showGrid && <GridLayer transform={transform} boardRef={boardRef} boardConfig={cfg}/>}
        </svg>
      </div>
      <TransitionLayer 
        transitions={transitions}
        selected={selected}
        boardProps={boardProps}
        getState={getState}
        onClick={(t) => setSelected(t.id)}
        onDelete={handleTransitionDelete}
      />
      <StateLayer 
        states={states} 
        boardProps={boardProps} 
        onStatesChange={onStatesChange} 
        selected={selected} 
        setSelected={setSelected}
        setStates={setStates}
        callForUpdate={() => setNeedUpdate(true)}
        onStateClicked={handleStateClicked}
        onStateDeleted={handleStateDelete}
      />
      {showTikzExporter && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {tikz}
        </div>
      )}
      {showToolManager && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <TransitionToolManager 
            tools={tools} 
            currentToolID={currentToolID} 
            setCurrentToolID={setCurrentToolID} 
            importTool={(t) => setTools([...tools, t])}
            importTools={(t) => setTools([...tools, ...t])}
          />
        </div>
      )}
      { selected && Object.keys(states).includes(selected) && 
        <div className="absolute transform -translate-y-1/2"
          style={{
            left: getDisplayPosition(states[selected].position).x + config.gridSize * transform.scale / 2, 
            top: getDisplayPosition(states[selected].position).y
          }}
        >
          <StateEditor 
            state={states[selected]}
            onClose={() => {}}
            onChange={handleStateEditorChange}
          />
        </div>
      }
      { selected && Object.keys(transitions).includes(selected) && 
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <TransitionEditor 
            transition={transitions[selected]}
            onClose={() => {}}
            onChange={handleTransitionEditorChange}
          />
        </div>
      }
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