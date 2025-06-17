import React, { useState, useCallback, useEffect } from "react"
import { BoardObjectProps } from "./GridLayer"
import { defaultBoardConfig, Point } from "./InfiniteBoard"

export interface Position {
    x: number, 
    y: number
};

export interface StateProps {
  id: string, 
  position: Position, 
  radius: number, 
  isAccepting: boolean, 
  isDummy: boolean, 
  label: string
};

interface renderStateProps {
  state: StateProps, 
  selected: null | string, 
  boardProps: BoardObjectProps, 
  onPositionChange?: (state: StateProps, newPos: Position | null) => void, 
  positionRegularizer?: (state: StateProps, x: number, y: number) => Position | null, 
  // x, y are relative position to the grids
  // return null means that it is invalid
  onClick?: (state: StateProps) => void, 
}

const defaultPositionRegularizer = (_: StateProps, x: number, y: number) => {
  return {x: x, y: y};
}

const defaultOnPositionChange = (_: StateProps, __: Position | null) => {};

const defaultOnClick = (_: StateProps) => {};

export const State: React.FC<renderStateProps> = (prop) => {
  const myState = prop.state;
  const boardConfig = prop.boardProps.boardConfig || defaultBoardConfig;
  const gridSize = boardConfig.gridSize;
  const transform = prop.boardProps.transform;
  const scaledGridSize = gridSize * transform.scale;

  const displayPosition = {
    x: transform.x + myState.position.x * scaledGridSize,
    y: transform.y + myState.position.y * scaledGridSize
  }

  const positionRegularizer = prop.positionRegularizer || defaultPositionRegularizer;
  const onPositionChange = prop.onPositionChange || defaultOnPositionChange;
  const onClick = prop.onClick || defaultOnClick;

  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [displayPositionAtDrag, setDisplayPositionAtDrag] = useState(displayPosition);

  const isSelected = prop.selected && prop.selected === myState.id;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only handle left click
    
    setIsMouseDown(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDisplayPositionAtDrag(displayPosition);
  }, [displayPosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isMouseDown) return;
    setHasDragged(true);

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    const newPostion = {
      x: displayPositionAtDrag.x + deltaX,
      y: displayPositionAtDrag.y + deltaY,
    };

    const newRelativePostion = {
      x: (newPostion.x - transform.x) / scaledGridSize, 
      y: (newPostion.y - transform.y) / scaledGridSize
    };

    onPositionChange(myState, positionRegularizer(myState, newRelativePostion.x, newRelativePostion.y));
  }, [isMouseDown, dragStart, displayPosition]);

  const handleClick = useCallback(() => {
    console.log('clicked');
    onClick(myState);
  }, [myState, onClick]);

  const handleMouseUp = useCallback(() => {
    if (!hasDragged) handleClick();
    setHasDragged(false);
    setIsMouseDown(false);
  }, [hasDragged]);

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

  const scaledRadius = myState.radius * scaledGridSize;

  return <div className="absolute border-2 border-black hover:border-blue-600 bg-blue-200" onMouseDown={handleMouseDown}
      style={{
        left: displayPosition.x - scaledRadius, 
        top: displayPosition.y - scaledRadius, 
        width: 2 * scaledRadius, 
        height: 2 * scaledRadius, 
        background: isSelected ? `#bfdbfe`: `#eeeeee`,
        borderRadius: `100%`,
        boxShadow: isSelected ? 'initial' : 'none'
      }}  
    >
      { transform.scale >= 0.3 && <svg width={2 * scaledRadius} height={2 * scaledRadius} className="relative select-none" pointerEvents={'none'}>
        <text
          x={scaledRadius}
          y={scaledRadius}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={14 * Math.min(1, transform.scale)}
        >
          {myState.label}
          {/* {isSelected && <p>selected</p>} */}
        </text>
      </svg>
      }
    </div>
}

export const demoStateProps: StateProps = {id: "0", position: {x: 1, y: 1}, label: "demo", radius: 0.25, isAccepting: false, isDummy: false}

export const DemoState: React.FC<{ p: BoardObjectProps} > = (props) => {
  return <State state={demoStateProps} boardProps={props.p} selected={null}/>
}